/**
 * Translation Orchestrator
 * Coordinates the translation of multiple files with progress tracking
 * Uses sequential processing to avoid memory issues
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { Translator, type TranslationResult } from './translator.js';
import { type FileInfo } from './file-scanner.js';

export interface OrchestrationConfig {
    sourceDir: string;
    outputDir: string;
    maxConcurrent?: number;
}

export interface TranslationStats {
    totalFiles: number;
    translatedFiles: number;
    failedFiles: number;
    skippedFiles: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    startTime: Date;
    endTime?: Date;
}

export interface FileTranslationResult {
    file: FileInfo;
    success: boolean;
    error?: string;
    result?: TranslationResult;
}

export class Orchestrator {
    private readonly config: OrchestrationConfig;
    private readonly translator: Translator;

    constructor(config: OrchestrationConfig, translator: Translator) {
        this.config = config;
        this.translator = translator;
    }

    /**
     * Translate a list of files - processes sequentially to avoid memory issues
     */
    async translateFiles(
        files: FileInfo[],
        onProgress?: (current: number, total: number, file: string) => void
    ): Promise<{ results: FileTranslationResult[]; stats: TranslationStats }> {
        const stats: TranslationStats = {
            totalFiles: files.length,
            translatedFiles: 0,
            failedFiles: 0,
            skippedFiles: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            startTime: new Date(),
        };

        const results: FileTranslationResult[] = [];

        // Process files sequentially to avoid memory issues
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const current = i + 1;

            onProgress?.(current, files.length, file.relativePath);

            try {
                const result = await this.translateFile(file);
                results.push(result);

                if (result.success && result.result) {
                    stats.translatedFiles++;
                    stats.totalInputTokens += result.result.inputTokens;
                    stats.totalOutputTokens += result.result.outputTokens;
                } else if (result.success) {
                    stats.skippedFiles++;
                } else {
                    stats.failedFiles++;
                    console.log(`\n   ⚠️ Failed: ${file.relativePath}: ${result.error}`);
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                results.push({
                    file,
                    success: false,
                    error: errorMsg,
                });
                stats.failedFiles++;
                console.log(`\n   ❌ Error: ${file.relativePath}: ${errorMsg}`);
            }

            // // Hint garbage collection every 10 files
            // if (i % 10 === 0 && global.gc) {
            //     try {
            //         global.gc();
            //     } catch {
            //         // GC not exposed
            //     }
            // }
        }

        stats.endTime = new Date();
        return { results, stats };
    }

    /**
     * Translate a single file
     */
    private async translateFile(file: FileInfo): Promise<FileTranslationResult> {
        try {
            // Read source file
            const content = await readFile(file.path, 'utf-8');

            // Skip very large files (> 100KB) to avoid API issues
            // if (content.length > 100 * 1024) {
            //     console.log(`\n   ⏭️ Skipping large file (${(content.length / 1024).toFixed(1)}KB): ${file.relativePath}`);
            //     return {
            //         file,
            //         success: true,
            //         result: {
            //             translatedContent: content,
            //             inputTokens: 0,
            //             outputTokens: 0,
            //         },
            //     };
            // }

            // Translate
            const result = await this.translator.translateMarkdown(content);

            // Determine output path
            const outputPath = join(this.config.outputDir, file.relativePath);

            // Ensure output directory exists
            await mkdir(dirname(outputPath), { recursive: true });

            // Write translated file
            await writeFile(outputPath, result.translatedContent, 'utf-8');

            // Clear references to help GC
            return {
                file,
                success: true,
                result,
            };
        } catch (error) {
            return {
                file,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Print a summary of the translation stats
     */
    printSummary(stats: TranslationStats): void {
        const duration = stats.endTime
            ? (stats.endTime.getTime() - stats.startTime.getTime()) / 1000
            : 0;

        console.log('\n📊 Translation Summary');
        console.log('─'.repeat(40));
        console.log(`📁 Total files:      ${stats.totalFiles}`);
        console.log(`✅ Translated:       ${stats.translatedFiles}`);
        console.log(`⏭️  Skipped:          ${stats.skippedFiles}`);
        console.log(`❌ Failed:           ${stats.failedFiles}`);
        console.log(`📥 Input tokens:     ${stats.totalInputTokens.toLocaleString()}`);
        console.log(`📤 Output tokens:    ${stats.totalOutputTokens.toLocaleString()}`);
        console.log(`⏱️  Duration:         ${duration.toFixed(1)}s`);

        // Estimate cost (gpt-4o-mini pricing)
        const inputCost = (stats.totalInputTokens / 1_000_000) * 0.15;
        const outputCost = (stats.totalOutputTokens / 1_000_000) * 0.60;
        console.log(`💰 Est. cost:        $${(inputCost + outputCost).toFixed(4)}`);
        console.log('─'.repeat(40));
    }
}

