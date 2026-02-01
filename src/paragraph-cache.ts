/**
 * Paragraph Cache
 * Manages paragraph-level translation caching for incremental translation.
 * Uses content hash matching to find cached translations across file changes.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { Paragraph } from './paragraph-parser.js';

/**
 * Cache entry for a single translated paragraph
 */
export interface ParagraphCacheEntry {
    /** MD5 hash of the original upstream content */
    upstreamHash: string;
    /** The translated content */
    translatedContent: string;
    /** Timestamp when this translation was cached */
    timestamp: number;
}

/**
 * Cache for all paragraphs in a single file
 * Key: paragraph content hash
 */
export interface FileParagraphCache {
    [paragraphHash: string]: ParagraphCacheEntry;
}

/**
 * Global paragraph cache structure
 * Key: relative file path
 */
export interface ParagraphCache {
    [relativePath: string]: FileParagraphCache;
}

/**
 * Extended cache that includes file-level hashes for quick unchanged detection
 */
export interface ExtendedParagraphCache {
    /** Paragraph-level cache */
    paragraphs: ParagraphCache;
    /** File-level hash cache: relativePath -> file content MD5 hash */
    fileHashes: Record<string, string>;
}

/**
 * Load paragraph cache from file
 */
export async function loadParagraphCache(cacheFile: string): Promise<ExtendedParagraphCache> {
    try {
        const content = await readFile(cacheFile, 'utf-8');
        const parsed = JSON.parse(content);

        // Handle both old format (just paragraphs) and new format (with fileHashes)
        if (parsed.paragraphs) {
            return parsed as ExtendedParagraphCache;
        } else {
            // Old format - convert
            return {
                paragraphs: parsed as ParagraphCache,
                fileHashes: {},
            };
        }
    } catch {
        // Cache file doesn't exist or is invalid
        return {
            paragraphs: {},
            fileHashes: {},
        };
    }
}

/**
 * Save paragraph cache to file
 */
export async function saveParagraphCache(
    cacheFile: string,
    cache: ExtendedParagraphCache
): Promise<void> {
    await mkdir(dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Get cached translation for a paragraph
 * Uses content hash matching (Method A) - works even if paragraph order changes
 * 
 * @param cache The paragraph cache
 * @param relativePath File's relative path
 * @param paragraphHash Hash of the paragraph content
 * @returns Translated content if cached, null otherwise
 */
export function getCachedTranslation(
    cache: ParagraphCache,
    relativePath: string,
    paragraphHash: string
): string | null {
    const fileCache = cache[relativePath];
    if (!fileCache) {
        return null;
    }

    const entry = fileCache[paragraphHash];
    if (!entry) {
        return null;
    }

    return entry.translatedContent;
}

/**
 * Also search other files for the same paragraph hash
 * This handles cases where content is moved between files
 * 
 * @param cache The paragraph cache
 * @param paragraphHash Hash of the paragraph content
 * @returns Translated content if found anywhere, null otherwise
 */
export function getCachedTranslationGlobal(
    cache: ParagraphCache,
    paragraphHash: string
): string | null {
    for (const fileCache of Object.values(cache)) {
        const entry = fileCache[paragraphHash];
        if (entry) {
            return entry.translatedContent;
        }
    }
    return null;
}

/**
 * Set cached translation for a paragraph
 */
export function setCachedTranslation(
    cache: ParagraphCache,
    relativePath: string,
    paragraphHash: string,
    translatedContent: string
): void {
    if (!cache[relativePath]) {
        cache[relativePath] = {};
    }

    cache[relativePath][paragraphHash] = {
        upstreamHash: paragraphHash,
        translatedContent,
        timestamp: Date.now(),
    };
}

/**
 * Analyze paragraphs and determine which need translation
 * 
 * @param paragraphs Parsed paragraphs from the upstream file
 * @param cache The paragraph cache
 * @param relativePath File's relative path
 * @returns Object with paragraphs to translate and cached paragraphs
 */
export function analyzeParagraphsForTranslation(
    paragraphs: Paragraph[],
    cache: ParagraphCache,
    relativePath: string
): {
    toTranslate: Paragraph[];
    cached: Map<number, string>;  // paragraph id -> cached translation
    stats: {
        total: number;
        cached: number;
        needsTranslation: number;
        nonTranslatable: number;
    };
} {
    const toTranslate: Paragraph[] = [];
    const cached = new Map<number, string>();
    let nonTranslatable = 0;

    for (const paragraph of paragraphs) {
        // Skip non-translatable paragraphs (code blocks)
        if (!paragraph.translatable) {
            cached.set(paragraph.id, paragraph.content);
            nonTranslatable++;
            continue;
        }

        // Try to find cached translation
        // First try exact file match, then global search
        let cachedContent = getCachedTranslation(cache, relativePath, paragraph.hash);
        if (!cachedContent) {
            cachedContent = getCachedTranslationGlobal(cache, paragraph.hash);
        }

        if (cachedContent) {
            cached.set(paragraph.id, cachedContent);
        } else {
            toTranslate.push(paragraph);
        }
    }

    return {
        toTranslate,
        cached,
        stats: {
            total: paragraphs.length,
            cached: cached.size - nonTranslatable,
            needsTranslation: toTranslate.length,
            nonTranslatable,
        },
    };
}

/**
 * Merge translated paragraphs with cached ones
 * 
 * @param paragraphs Original paragraph list (for ordering)
 * @param cached Map of paragraph id -> cached/translated content
 * @returns Merged paragraph list with translations
 */
export function mergeCachedAndTranslated(
    paragraphs: Paragraph[],
    cached: Map<number, string>
): Paragraph[] {
    return paragraphs.map(p => ({
        ...p,
        content: cached.get(p.id) ?? p.content,
    }));
}
