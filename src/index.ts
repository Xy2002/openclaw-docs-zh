#!/usr/bin/env node
/**
 * OpenClaw Docs Translation CLI
 * Main entry point
 */

import { Command } from 'commander';
import { resolve, join } from 'path';
import { RateLimiter } from './rate-limiter.js';
import { Translator } from './translator.js';
import { Orchestrator } from './orchestrator.js';
import { ParagraphOrchestrator } from './paragraph-orchestrator.js';
import {
    scanMarkdownFiles,
    loadHashCache,
    saveHashCache,
    detectChangedFiles,
    getFileStats
} from './file-scanner.js';
import { loadConfig, defaultConfig } from './config.js';

const program = new Command();

program
    .name('translate-docs')
    .description('Automated documentation translation using OpenAI')
    .version('1.0.0');

program
    .command('translate')
    .description('Translate markdown documents')
    .option('-s, --source <dir>', 'Source directory containing markdown files', './docs')
    .option('-o, --output <dir>', 'Output directory for translated files', './docs-zh')
    .option('-c, --config <file>', 'Configuration file path', './config.json')
    .option('-i, --incremental', 'Only translate changed files', false)
    .option('--cache <file>', 'Hash cache file for incremental builds', './.translation-cache.json')
    .option('--paragraph-cache <file>', 'Enable paragraph-level caching (reduces API calls for small changes)', '')
    .option('--dry-run', 'Show what would be translated without actually translating', false)
    .action(async (options) => {
        try {
            console.log('🦞 OpenClaw Docs Translator\n');

            // Load config
            const configPath = resolve(process.cwd(), options.config);
            const config = await loadConfig(configPath);

            // Check for API key
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey && !options.dryRun) {
                console.error('❌ Error: OPENAI_API_KEY environment variable is required');
                process.exit(1);
            }

            // Resolve paths
            const sourceDir = resolve(process.cwd(), options.source);
            const outputDir = resolve(process.cwd(), options.output);
            const cacheFile = resolve(process.cwd(), options.cache);

            console.log(`📂 Source:  ${sourceDir}`);
            console.log(`📁 Output:  ${outputDir}`);
            console.log(`🤖 Model:   ${config.translation.model}`);
            console.log(`🎯 Target:  ${config.translation.targetLanguage}`);

            // Scan for files
            console.log('\n🔍 Scanning for markdown files...');
            const scanResult = await scanMarkdownFiles(sourceDir);

            if (scanResult.total === 0) {
                console.log('⚠️ No markdown files found');
                return;
            }

            const stats = getFileStats(scanResult.files);
            console.log(`   Found ${stats.totalFiles} files (${(stats.totalSize / 1024).toFixed(1)} KB total)`);

            // Filter changed files if incremental
            // This compares: current upstream hash vs last-translated upstream hash
            // NOT: local file hash (which would be the translated content)
            let filesToTranslate = scanResult.files;
            if (options.incremental) {
                console.log('\n📋 Checking for upstream changes...');

                // Load the translation cache (records which upstream hash was last translated)
                const translationCache = await loadHashCache(cacheFile);

                // Load current upstream hashes (set by sync command)
                const upstreamCacheFile = resolve(process.cwd(), '.upstream-hashes.json');
                const upstreamHashes = await loadHashCache(upstreamCacheFile);

                if (upstreamHashes.size === 0) {
                    console.log('   ⚠️ No upstream hashes found. Run "sync" first or translate all files.');
                } else {
                    // Find files where upstream hash changed since last translation
                    filesToTranslate = scanResult.files.filter(file => {
                        const upstreamHash = upstreamHashes.get(file.relativePath);
                        const lastTranslatedHash = translationCache.get(file.relativePath);
                        // Translate if: no upstream hash (new file) OR upstream changed
                        return !upstreamHash || upstreamHash !== lastTranslatedHash;
                    });
                    console.log(`   ${filesToTranslate.length} files need translation (upstream changed)`);
                }
            }

            if (filesToTranslate.length === 0) {
                console.log('\n✅ All files are up to date!');
                return;
            }

            // Dry run - just show what would be translated
            if (options.dryRun) {
                console.log('\n📝 Dry run - files that would be translated:');
                for (const file of filesToTranslate) {
                    console.log(`   - ${file.relativePath}`);
                }
                return;
            }

            // Create translator components
            const rateLimiter = new RateLimiter({
                rpm: config.rateLimit.rpm,
                tpm: config.rateLimit.tpm,
            });

            const translator = new Translator({
                apiKey: apiKey!,
                model: config.translation.model,
                baseURL: process.env.OPENAI_BASE_URL,
                targetLanguage: config.translation.targetLanguage,
            }, rateLimiter);

            // Use paragraph-level caching if enabled
            const useParagraphCache = !!options.paragraphCache;
            const paragraphCacheFile = options.paragraphCache
                ? resolve(process.cwd(), options.paragraphCache)
                : resolve(process.cwd(), '.paragraph-cache.json');

            if (useParagraphCache) {
                console.log('\n📦 Using paragraph-level caching...');

                const paragraphOrchestrator = new ParagraphOrchestrator({
                    sourceDir,
                    outputDir,
                    paragraphCacheFile,
                }, translator);

                // Translate files with paragraph-level caching
                console.log('\n🌐 Translating with paragraph cache...');
                const { results, stats: translationStats } = await paragraphOrchestrator.translateFiles(
                    filesToTranslate,
                    (current, total, file, status) => {
                        process.stdout.write(`\r   [${current}/${total}] ${file.padEnd(40).slice(0, 40)} ${status}`);
                    }
                );
                console.log('\n');

                // Report failures
                const failures = results.filter(r => !r.success);
                if (failures.length > 0) {
                    console.log('\n⚠️ Failed files:');
                    for (const failure of failures) {
                        console.log(`   ❌ ${failure.file.relativePath}: ${failure.error}`);
                    }
                }

                // Print summary
                paragraphOrchestrator.printSummary(translationStats);
                return;
            }

            // Standard file-level translation (no paragraph caching)
            const orchestrator = new Orchestrator({
                sourceDir,
                outputDir,
                maxConcurrent: config.rateLimit.maxConcurrent,
            }, translator);

            // Translate files
            console.log('\n🌐 Translating...');
            const { results, stats: translationStats } = await orchestrator.translateFiles(
                filesToTranslate,
                (current, total, file) => {
                    process.stdout.write(`\r   [${current}/${total}] ${file.padEnd(50).slice(0, 50)}`);
                }
            );
            console.log('\n');

            // Report failures
            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                console.log('\n⚠️ Failed files:');
                for (const failure of failures) {
                    console.log(`   ❌ ${failure.file.relativePath}: ${failure.error}`);
                }
            }

            // Save cache for incremental builds
            // We save the UPSTREAM hash (not local file hash) for files we successfully translated
            if (options.incremental) {
                const upstreamCacheFile = resolve(process.cwd(), '.upstream-hashes.json');
                const upstreamHashes = await loadHashCache(upstreamCacheFile);

                // Build new cache: for each successfully translated file, record its upstream hash
                const successfulFiles = results.filter(r => r.success).map(r => r.file);
                const cacheData: Record<string, string> = {};

                // Load existing cache first (keep hashes for files we didn't touch)
                const existingCache = await loadHashCache(cacheFile);
                for (const [path, hash] of existingCache) {
                    cacheData[path] = hash;
                }

                // Update with upstream hashes for files we translated
                for (const file of successfulFiles) {
                    const upstreamHash = upstreamHashes.get(file.relativePath);
                    if (upstreamHash) {
                        cacheData[file.relativePath] = upstreamHash;
                    }
                }

                const { writeFile } = await import('fs/promises');
                await writeFile(cacheFile, JSON.stringify(cacheData, null, 2), 'utf-8');
            }

            // Print summary
            orchestrator.printSummary(translationStats);

        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('sync')
    .description('Sync documentation from upstream repository')
    .option('-u, --upstream <repo>', 'Upstream repository (owner/repo)', 'openclaw/openclaw')
    .option('-b, --branch <branch>', 'Branch to sync from', 'main')
    .option('-p, --path <path>', 'Path to docs in upstream repo', 'docs')
    .option('-o, --output <dir>', 'Output directory for synced docs', './docs')
    .action(async (options) => {
        try {
            console.log('🔄 Syncing from upstream...\n');

            const [owner, repo] = options.upstream.split('/');
            const outputDir = resolve(process.cwd(), options.output);

            console.log(`📦 Repository: ${owner}/${repo}`);
            console.log(`🌿 Branch:     ${options.branch}`);
            console.log(`📂 Path:       ${options.path}`);
            console.log(`📁 Output:     ${outputDir}`);

            // Download using GitHub API
            const { downloadDocsFromGitHub } = await import('./sync.js');
            const stats = await downloadDocsFromGitHub({
                owner,
                repo,
                branch: options.branch,
                docsPath: options.path,
                outputDir,
                githubToken: process.env.GITHUB_TOKEN,
            });

            console.log(`\n✅ Synced ${stats.filesDownloaded} non-markdown files`);
            if (stats.filesSkipped > 0) {
                console.log(`⏭️  Skipped ${stats.filesSkipped} unchanged files`);
            }
            console.log(`📊 Tracked ${stats.upstreamHashes.size} upstream markdown hashes`);

            // Save upstream hashes to cache file for incremental translation
            const upstreamCacheFile = join(outputDir, '..', '.upstream-hashes.json');
            const { writeFile, mkdir } = await import('fs/promises');
            const { dirname } = await import('path');
            const hashData: Record<string, string> = {};
            for (const [path, hash] of stats.upstreamHashes.entries()) {
                hashData[path] = hash;
            }
            await mkdir(dirname(upstreamCacheFile), { recursive: true });
            await writeFile(upstreamCacheFile, JSON.stringify(hashData, null, 2), 'utf-8');
            console.log(`💾 Saved upstream hashes to ${upstreamCacheFile}`);

        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('status')
    .description('Show translation status')
    .option('-s, --source <dir>', 'Source directory', './docs')
    .option('-o, --output <dir>', 'Output directory', './docs-zh')
    .action(async (options) => {
        try {
            const sourceDir = resolve(process.cwd(), options.source);
            const outputDir = resolve(process.cwd(), options.output);

            console.log('📊 Translation Status\n');

            const sourceFiles = await scanMarkdownFiles(sourceDir);
            const outputFiles = await scanMarkdownFiles(outputDir);

            const translatedPaths = new Set(outputFiles.files.map(f => f.relativePath));
            const untranslated = sourceFiles.files.filter(f => !translatedPaths.has(f.relativePath));

            console.log(`📂 Source files:      ${sourceFiles.total}`);
            console.log(`📝 Translated files:  ${outputFiles.total}`);
            console.log(`⏳ Pending:           ${untranslated.length}`);

            const progress = sourceFiles.total > 0
                ? ((outputFiles.total / sourceFiles.total) * 100).toFixed(1)
                : '0';
            console.log(`📈 Progress:          ${progress}%`);

            if (untranslated.length > 0 && untranslated.length <= 10) {
                console.log('\n📋 Pending files:');
                for (const file of untranslated) {
                    console.log(`   - ${file.relativePath}`);
                }
            }

        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('fix')
    .description('Fix syntax errors in translated markdown files')
    .option('-s, --source <dir>', 'Directory containing translated markdown files', './docs')
    .option('--dry-run', 'Show what would be fixed without making changes', false)
    .option('-v, --verbose', 'Show detailed fix information', false)
    .action(async (options) => {
        try {
            const sourceDir = resolve(process.cwd(), options.source);

            const { fixDirectory } = await import('./syntax-fixer.js');
            const result = await fixDirectory(sourceDir, {
                dryRun: options.dryRun,
                verbose: options.verbose,
            });

            if (result.totalFixes === 0) {
                console.log('\n✅ No syntax errors found!');
            } else if (!options.dryRun) {
                console.log(`\n✅ Fixed ${result.totalFixes} syntax errors in ${result.fixedFiles} files`);
            }

        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('validate')
    .description('Validate markdown/MDX files for Mintlify compatibility')
    .option('-s, --source <dir>', 'Directory containing markdown files to validate', './docs')
    .option('-v, --verbose', 'Show progress for each file', false)
    .action(async (options) => {
        try {
            const sourceDir = resolve(process.cwd(), options.source);

            const { validateDirectory } = await import('./validator.js');
            const result = await validateDirectory(sourceDir, {
                verbose: options.verbose,
            });

            if (result.invalidFiles > 0) {
                console.log('\n⚠️  Some files have syntax errors that will break Mintlify!');
                console.log('   Run "fix" command first, then re-validate.\n');
                process.exit(1);
            } else {
                console.log('\n✅ All files are valid and Mintlify-compatible!\n');
            }

        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

// Cache management command group
const cacheCommand = program
    .command('cache')
    .description('Manage translation cache');

cacheCommand
    .command('delete <files...>')
    .description('Delete cache entries for specific files')
    .option('--paragraph-cache <file>', 'Paragraph cache file', './.paragraph-cache.json')
    .option('--translation-cache <file>', 'Translation cache file', './.translation-cache.json')
    .option('--upstream-cache <file>', 'Upstream hash cache file', './.upstream-hashes.json')
    .option('--all', 'Delete from all cache types', false)
    .option('--dry-run', 'Show what would be deleted without actually deleting', false)
    .action(async (files: string[], options) => {
        try {
            console.log('🗑️  Cache Delete\n');

            const paragraphCacheFile = resolve(process.cwd(), options.paragraphCache);
            const translationCacheFile = resolve(process.cwd(), options.translationCache);
            const upstreamCacheFile = resolve(process.cwd(), options.upstreamCache);

            const { readFile, writeFile, access } = await import('fs/promises');

            // Normalize file paths for matching
            const normalizeFilePath = (p: string) => p.replace(/\\/g, '/').replace(/^\.\//, '');
            const filesToDelete = files.map(normalizeFilePath);

            console.log(`📋 Files to clear from cache:`);
            for (const file of filesToDelete) {
                console.log(`   - ${file}`);
            }
            console.log('');

            let totalDeleted = 0;

            // Helper to check if file exists
            const fileExists = async (path: string) => {
                try {
                    await access(path);
                    return true;
                } catch {
                    return false;
                }
            };

            // Helper to delete entries from a JSON cache file
            const deleteFromCache = async (cacheFile: string, cacheName: string) => {
                if (!(await fileExists(cacheFile))) {
                    console.log(`⏭️  ${cacheName}: file not found, skipping`);
                    return 0;
                }

                try {
                    const content = await readFile(cacheFile, 'utf-8');
                    const cacheData = JSON.parse(content);
                    let deleted = 0;

                    // Handle paragraph cache format (has 'paragraphs' and 'fileHashes' keys)
                    if (cacheData.paragraphs && typeof cacheData.paragraphs === 'object') {
                        for (const filePattern of filesToDelete) {
                            // Delete from paragraphs
                            for (const key of Object.keys(cacheData.paragraphs)) {
                                if (normalizeFilePath(key).includes(filePattern) ||
                                    filePattern.includes(normalizeFilePath(key))) {
                                    if (!options.dryRun) {
                                        delete cacheData.paragraphs[key];
                                    }
                                    console.log(`   ✓ paragraphs: ${key}`);
                                    deleted++;
                                }
                            }
                            // Delete from fileHashes
                            if (cacheData.fileHashes) {
                                for (const key of Object.keys(cacheData.fileHashes)) {
                                    if (normalizeFilePath(key).includes(filePattern) ||
                                        filePattern.includes(normalizeFilePath(key))) {
                                        if (!options.dryRun) {
                                            delete cacheData.fileHashes[key];
                                        }
                                        console.log(`   ✓ fileHashes: ${key}`);
                                        deleted++;
                                    }
                                }
                            }
                        }
                    } else {
                        // Handle simple key-value cache format
                        for (const filePattern of filesToDelete) {
                            for (const key of Object.keys(cacheData)) {
                                if (normalizeFilePath(key).includes(filePattern) ||
                                    filePattern.includes(normalizeFilePath(key))) {
                                    if (!options.dryRun) {
                                        delete cacheData[key];
                                    }
                                    console.log(`   ✓ ${key}`);
                                    deleted++;
                                }
                            }
                        }
                    }

                    if (deleted > 0) {
                        if (!options.dryRun) {
                            await writeFile(cacheFile, JSON.stringify(cacheData, null, 2), 'utf-8');
                        }
                        console.log(`   ${options.dryRun ? '(dry run) Would delete' : 'Deleted'} ${deleted} entries from ${cacheName}`);
                    } else {
                        console.log(`   No matching entries found in ${cacheName}`);
                    }

                    return deleted;
                } catch (error) {
                    console.error(`   ❌ Error processing ${cacheName}: ${error instanceof Error ? error.message : error}`);
                    return 0;
                }
            };

            // Process paragraph cache
            console.log(`\n🔍 Paragraph cache (${options.paragraphCache}):`);
            totalDeleted += await deleteFromCache(paragraphCacheFile, 'paragraph cache');

            // Process translation cache
            console.log(`\n🔍 Translation cache (${options.translationCache}):`);
            totalDeleted += await deleteFromCache(translationCacheFile, 'translation cache');

            // Process upstream cache
            console.log(`\n🔍 Upstream hash cache (${options.upstreamCache}):`);
            totalDeleted += await deleteFromCache(upstreamCacheFile, 'upstream cache');

            // Summary
            console.log('\n' + '─'.repeat(40));
            if (options.dryRun) {
                console.log(`📊 Dry run: would delete ${totalDeleted} total cache entries`);
            } else if (totalDeleted > 0) {
                console.log(`✅ Deleted ${totalDeleted} total cache entries`);
            } else {
                console.log(`⚠️  No matching cache entries found`);
            }

        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

cacheCommand
    .command('list')
    .description('List all cached file entries')
    .option('--paragraph-cache <file>', 'Paragraph cache file', './.paragraph-cache.json')
    .option('--translation-cache <file>', 'Translation cache file', './.translation-cache.json')
    .option('--upstream-cache <file>', 'Upstream hash cache file', './.upstream-hashes.json')
    .action(async (options) => {
        try {
            console.log('📋 Cache Contents\n');

            const paragraphCacheFile = resolve(process.cwd(), options.paragraphCache);
            const translationCacheFile = resolve(process.cwd(), options.translationCache);
            const upstreamCacheFile = resolve(process.cwd(), options.upstreamCache);

            const { readFile, access } = await import('fs/promises');

            const fileExists = async (path: string) => {
                try {
                    await access(path);
                    return true;
                } catch {
                    return false;
                }
            };

            // List paragraph cache
            console.log(`🔍 Paragraph cache (${options.paragraphCache}):`);
            if (await fileExists(paragraphCacheFile)) {
                const content = await readFile(paragraphCacheFile, 'utf-8');
                const cacheData = JSON.parse(content);
                if (cacheData.paragraphs) {
                    const files = Object.keys(cacheData.paragraphs);
                    console.log(`   ${files.length} files cached`);
                    for (const file of files) {
                        const paragraphCount = Object.keys(cacheData.paragraphs[file]).length;
                        console.log(`   - ${file} (${paragraphCount} paragraphs)`);
                    }
                }
            } else {
                console.log('   (not found)');
            }

            // List translation cache
            console.log(`\n🔍 Translation cache (${options.translationCache}):`);
            if (await fileExists(translationCacheFile)) {
                const content = await readFile(translationCacheFile, 'utf-8');
                const cacheData = JSON.parse(content);
                const files = Object.keys(cacheData);
                console.log(`   ${files.length} files cached`);
                for (const file of files.slice(0, 20)) {
                    console.log(`   - ${file}`);
                }
                if (files.length > 20) {
                    console.log(`   ... and ${files.length - 20} more`);
                }
            } else {
                console.log('   (not found)');
            }

            // List upstream cache
            console.log(`\n🔍 Upstream hash cache (${options.upstreamCache}):`);
            if (await fileExists(upstreamCacheFile)) {
                const content = await readFile(upstreamCacheFile, 'utf-8');
                const cacheData = JSON.parse(content);
                const files = Object.keys(cacheData);
                console.log(`   ${files.length} files tracked`);
                for (const file of files.slice(0, 20)) {
                    console.log(`   - ${file}`);
                }
                if (files.length > 20) {
                    console.log(`   ... and ${files.length - 20} more`);
                }
            } else {
                console.log('   (not found)');
            }

        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program.parse();
