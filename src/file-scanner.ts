/**
 * File Scanner
 * Scans documentation directory for markdown files and detects changes
 */

import { glob } from 'glob';
import { readFile, stat } from 'fs/promises';
import { createHash } from 'crypto';
import { join, relative } from 'path';

export interface FileInfo {
    path: string;           // Absolute path
    relativePath: string;   // Relative path from source dir
    hash: string;           // Content hash for change detection
    size: number;           // File size in bytes
}

export interface ScanResult {
    files: FileInfo[];
    total: number;
}

/**
 * Scan directory for markdown files
 */
export async function scanMarkdownFiles(
    sourceDir: string,
    extensions: string[] = ['md', 'mdx']
): Promise<ScanResult> {
    const patterns = extensions.map(ext => join(sourceDir, '**', `*.${ext}`));

    const allFiles: string[] = [];
    for (const pattern of patterns) {
        const files = await glob(pattern, {
            nodir: true,
            absolute: true,
            windowsPathsNoEscape: true,
        });
        allFiles.push(...files);
    }

    const fileInfos: FileInfo[] = [];

    for (const filePath of allFiles) {
        try {
            const content = await readFile(filePath, 'utf-8');
            const stats = await stat(filePath);
            const hash = createHash('md5').update(content).digest('hex');

            fileInfos.push({
                path: filePath,
                relativePath: relative(sourceDir, filePath),
                hash,
                size: stats.size,
            });
        } catch (error) {
            console.warn(`⚠️ Could not read file: ${filePath}`, error);
        }
    }

    return {
        files: fileInfos,
        total: fileInfos.length,
    };
}

/**
 * Load hash cache from a previous run
 */
export async function loadHashCache(
    cacheFile: string
): Promise<Map<string, string>> {
    const cache = new Map<string, string>();

    try {
        const content = await readFile(cacheFile, 'utf-8');
        const data = JSON.parse(content) as Record<string, string>;
        for (const [path, hash] of Object.entries(data)) {
            cache.set(path, hash);
        }
    } catch {
        // Cache file doesn't exist or is invalid
    }

    return cache;
}

/**
 * Save hash cache for future runs
 */
export async function saveHashCache(
    cacheFile: string,
    files: FileInfo[]
): Promise<void> {
    const { writeFile, mkdir } = await import('fs/promises');
    const { dirname } = await import('path');

    const data: Record<string, string> = {};
    for (const file of files) {
        data[file.relativePath] = file.hash;
    }

    await mkdir(dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Detect changed files by comparing with cache
 */
export function detectChangedFiles(
    files: FileInfo[],
    cache: Map<string, string>
): FileInfo[] {
    return files.filter(file => {
        const cachedHash = cache.get(file.relativePath);
        return cachedHash !== file.hash;
    });
}

/**
 * Get statistics about files
 */
export function getFileStats(files: FileInfo[]): {
    totalFiles: number;
    totalSize: number;
    avgSize: number;
} {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    return {
        totalFiles: files.length,
        totalSize,
        avgSize: files.length > 0 ? Math.round(totalSize / files.length) : 0,
    };
}
