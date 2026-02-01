/**
 * Paragraph Orchestrator
 * Coordinates paragraph-level translation with caching for incremental updates.
 * Only translates changed paragraphs while preserving cached translations.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import { Translator } from './translator.js';
import { type FileInfo } from './file-scanner.js';
import {
    parseDocumentIntoParagraphs,
    reconstructDocument,
    mergeParagraphs,
    type Paragraph,
} from './paragraph-parser.js';
import {
    loadParagraphCache,
    saveParagraphCache,
    analyzeParagraphsForTranslation,
    setCachedTranslation,
    type ParagraphCache,
    type ExtendedParagraphCache,
} from './paragraph-cache.js';

export interface ParagraphOrchestrationConfig {
    sourceDir: string;
    outputDir: string;
    paragraphCacheFile: string;
}

export interface ParagraphTranslationStats {
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;        // Files skipped because unchanged
    failedFiles: number;
    totalParagraphs: number;
    translatedParagraphs: number;
    cachedParagraphs: number;
    nonTranslatableParagraphs: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    startTime: Date;
    endTime?: Date;
}

export interface FileTranslationResult {
    file: FileInfo;
    success: boolean;
    skipped?: boolean;           // True if file was skipped (unchanged)
    error?: string;
    paragraphStats?: {
        total: number;
        translated: number;
        cached: number;
        nonTranslatable: number;
    };
    inputTokens: number;
    outputTokens: number;
}

export class ParagraphOrchestrator {
    private readonly config: ParagraphOrchestrationConfig;
    private readonly translator: Translator;
    private cache: ExtendedParagraphCache = { paragraphs: {}, fileHashes: {} };

    constructor(config: ParagraphOrchestrationConfig, translator: Translator) {
        this.config = config;
        this.translator = translator;
    }

    /**
     * Load paragraph cache from file
     */
    async loadCache(): Promise<void> {
        this.cache = await loadParagraphCache(this.config.paragraphCacheFile);
        const fileCount = Object.keys(this.cache.paragraphs).length;
        const paragraphCount = Object.values(this.cache.paragraphs).reduce(
            (sum, fc) => sum + Object.keys(fc).length,
            0
        );
        const hashCount = Object.keys(this.cache.fileHashes).length;
        console.log(`   📦 Loaded cache: ${paragraphCount} paragraphs from ${fileCount} files, ${hashCount} file hashes`);
    }

    /**
     * Save paragraph cache to file
     */
    async saveCache(): Promise<void> {
        await saveParagraphCache(this.config.paragraphCacheFile, this.cache);
        const fileCount = Object.keys(this.cache.paragraphs).length;
        const paragraphCount = Object.values(this.cache.paragraphs).reduce(
            (sum, fc) => sum + Object.keys(fc).length,
            0
        );
        console.log(`   💾 Saved cache: ${paragraphCount} paragraphs from ${fileCount} files`);
    }

    /**
     * Translate files using paragraph-level caching
     */
    async translateFiles(
        files: FileInfo[],
        onProgress?: (current: number, total: number, file: string, stats: string) => void
    ): Promise<{ results: FileTranslationResult[]; stats: ParagraphTranslationStats }> {
        const stats: ParagraphTranslationStats = {
            totalFiles: files.length,
            processedFiles: 0,
            skippedFiles: 0,
            failedFiles: 0,
            totalParagraphs: 0,
            translatedParagraphs: 0,
            cachedParagraphs: 0,
            nonTranslatableParagraphs: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            startTime: new Date(),
        };

        const results: FileTranslationResult[] = [];

        // Load cache
        await this.loadCache();

        // Process files sequentially
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const current = i + 1;

            try {
                const result = await this.translateFile(file);
                results.push(result);

                if (result.success) {
                    if (result.skipped) {
                        stats.skippedFiles++;
                    } else {
                        stats.processedFiles++;
                        if (result.paragraphStats) {
                            stats.totalParagraphs += result.paragraphStats.total;
                            stats.translatedParagraphs += result.paragraphStats.translated;
                            stats.cachedParagraphs += result.paragraphStats.cached;
                            stats.nonTranslatableParagraphs += result.paragraphStats.nonTranslatable;
                        }
                    }
                    stats.totalInputTokens += result.inputTokens;
                    stats.totalOutputTokens += result.outputTokens;
                } else {
                    stats.failedFiles++;
                }

                const statusStr = result.skipped
                    ? 'skipped (unchanged)'
                    : result.paragraphStats
                        ? `${result.paragraphStats.translated}/${result.paragraphStats.total} translated`
                        : 'done';
                onProgress?.(current, files.length, file.relativePath, statusStr);

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                results.push({
                    file,
                    success: false,
                    error: errorMsg,
                    inputTokens: 0,
                    outputTokens: 0,
                });
                stats.failedFiles++;
                console.log(`\n   ❌ Error: ${file.relativePath}: ${errorMsg}`);
            }
        }

        // Save updated cache
        await this.saveCache();

        stats.endTime = new Date();
        return { results, stats };
    }

    /**
     * Translate a single file using paragraph-level caching
     */
    private async translateFile(file: FileInfo): Promise<FileTranslationResult> {
        try {
            // Read source file
            const content = await readFile(file.path, 'utf-8');

            // Calculate file hash
            const fileHash = createHash('md5').update(content).digest('hex');
            const cachedFileHash = this.cache.fileHashes[file.relativePath];

            // Check if file is unchanged (same hash as last run)
            if (cachedFileHash && cachedFileHash === fileHash) {
                // File unchanged - no need to process paragraphs
                return {
                    file,
                    success: true,
                    skipped: true,
                    inputTokens: 0,
                    outputTokens: 0,
                };
            }

            // Skip very large files (> 100KB)
            if (content.length > 100 * 1024) {
                console.log(`\n   ⏭️ Skipping large file (${(content.length / 1024).toFixed(1)}KB): ${file.relativePath}`);
                // Write original content to output
                const outputPath = join(this.config.outputDir, file.relativePath);
                await mkdir(dirname(outputPath), { recursive: true });
                await writeFile(outputPath, content, 'utf-8');
                return {
                    file,
                    success: true,
                    inputTokens: 0,
                    outputTokens: 0,
                };
            }

            // Parse into paragraphs
            const parsed = parseDocumentIntoParagraphs(content);

            // Analyze which paragraphs need translation
            const analysis = analyzeParagraphsForTranslation(
                parsed.paragraphs,
                this.cache.paragraphs,
                file.relativePath
            );

            let totalInputTokens = 0;
            let totalOutputTokens = 0;

            // Translate paragraphs that need translation
            for (const paragraph of analysis.toTranslate) {
                const result = await this.translator.translateParagraph(paragraph.content);

                // Cache the translation
                setCachedTranslation(
                    this.cache.paragraphs,
                    file.relativePath,
                    paragraph.hash,
                    result.translatedContent
                );

                // Store in analysis.cached for later merge
                analysis.cached.set(paragraph.id, result.translatedContent);

                totalInputTokens += result.inputTokens;
                totalOutputTokens += result.outputTokens;
            }

            // Merge all paragraphs (cached + newly translated)
            const translatedParagraphs = parsed.paragraphs.map(p => ({
                ...p,
                content: analysis.cached.get(p.id) ?? p.content,
            }));

            // Reconstruct document
            const translatedContent = reconstructDocument(
                parsed.frontmatter,
                translatedParagraphs
            );

            // Write output
            const outputPath = join(this.config.outputDir, file.relativePath);
            await mkdir(dirname(outputPath), { recursive: true });
            await writeFile(outputPath, translatedContent, 'utf-8');

            // Update file hash cache after successful translation
            this.cache.fileHashes[file.relativePath] = fileHash;

            return {
                file,
                success: true,
                paragraphStats: {
                    total: analysis.stats.total,
                    translated: analysis.stats.needsTranslation,
                    cached: analysis.stats.cached,
                    nonTranslatable: analysis.stats.nonTranslatable,
                },
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
            };

        } catch (error) {
            return {
                file,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                inputTokens: 0,
                outputTokens: 0,
            };
        }
    }

    /**
     * Print a summary of the translation stats
     */
    printSummary(stats: ParagraphTranslationStats): void {
        const duration = stats.endTime
            ? (stats.endTime.getTime() - stats.startTime.getTime()) / 1000
            : 0;

        console.log('\n📊 Paragraph-Level Translation Summary');
        console.log('─'.repeat(50));
        console.log(`📁 Total files:            ${stats.totalFiles}`);
        console.log(`✅ Processed:              ${stats.processedFiles}`);
        console.log(`⏭️  Skipped (unchanged):    ${stats.skippedFiles}`);
        console.log(`❌ Failed:                 ${stats.failedFiles}`);
        console.log('─'.repeat(50));
        console.log(`📝 Total paragraphs:       ${stats.totalParagraphs}`);
        console.log(`🔄 Translated (new):       ${stats.translatedParagraphs}`);
        console.log(`💾 From cache:             ${stats.cachedParagraphs}`);
        console.log(`⏭️  Non-translatable:       ${stats.nonTranslatableParagraphs}`);
        console.log('─'.repeat(50));
        console.log(`📥 Input tokens:           ${stats.totalInputTokens.toLocaleString()}`);
        console.log(`📤 Output tokens:          ${stats.totalOutputTokens.toLocaleString()}`);
        console.log(`⏱️  Duration:               ${duration.toFixed(1)}s`);

        // Cache hit rate
        const hitRate = stats.totalParagraphs > 0
            ? ((stats.cachedParagraphs / (stats.totalParagraphs - stats.nonTranslatableParagraphs)) * 100).toFixed(1)
            : '0';
        console.log(`📈 Cache hit rate:         ${hitRate}%`);

        // Estimate cost (gpt-4o-mini pricing)
        const inputCost = (stats.totalInputTokens / 1_000_000) * 0.15;
        const outputCost = (stats.totalOutputTokens / 1_000_000) * 0.60;
        console.log(`💰 Est. cost:              $${(inputCost + outputCost).toFixed(4)}`);
        console.log('─'.repeat(50));
    }
}
