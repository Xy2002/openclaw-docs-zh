/**
 * Markdown Parser
 * Handles frontmatter extraction and content protection (code blocks, URLs, etc.)
 */

import matter from 'gray-matter';

export interface ParsedMarkdown {
    frontmatter: Record<string, unknown>;
    content: string;
    protectedBlocks: ProtectedBlock[];
}

export interface ProtectedBlock {
    placeholder: string;
    original: string;
    type: 'code' | 'url' | 'image' | 'html';
}

/**
 * Parse markdown content, extracting frontmatter and protecting non-translatable blocks
 */
export function parseMarkdown(rawContent: string): ParsedMarkdown {
    // Parse frontmatter using gray-matter
    const { data: frontmatter, content: bodyContent } = matter(rawContent);

    const protectedBlocks: ProtectedBlock[] = [];
    let processedContent = bodyContent;
    let blockIndex = 0;

    // Protect fenced code blocks (``` or ~~~)
    processedContent = processedContent.replace(
        /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g,
        (match) => {
            const placeholder = `__CODE_BLOCK_${blockIndex++}__`;
            protectedBlocks.push({ placeholder, original: match, type: 'code' });
            return placeholder;
        }
    );

    // Protect inline code (backticks)
    processedContent = processedContent.replace(
        /`[^`\n]+`/g,
        (match) => {
            const placeholder = `__INLINE_CODE_${blockIndex++}__`;
            protectedBlocks.push({ placeholder, original: match, type: 'code' });
            return placeholder;
        }
    );

    // Protect image references ![alt](url)
    processedContent = processedContent.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (match) => {
            const placeholder = `__IMAGE_${blockIndex++}__`;
            protectedBlocks.push({ placeholder, original: match, type: 'image' });
            return placeholder;
        }
    );

    // Protect URL links [text](url) - but keep the text for translation
    // We'll handle this specially to translate the link text but keep the URL
    processedContent = processedContent.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (match, text, url) => {
            const placeholder = `__LINK_${blockIndex++}__`;
            // Store both text and url so we can reconstruct after translation
            protectedBlocks.push({
                placeholder,
                original: match,
                type: 'url',
            });
            // Return placeholder with text that should be translated
            return `${placeholder}[${text}]`;
        }
    );

    // Protect raw URLs
    processedContent = processedContent.replace(
        /https?:\/\/[^\s<>\[\]()]+/g,
        (match) => {
            const placeholder = `__URL_${blockIndex++}__`;
            protectedBlocks.push({ placeholder, original: match, type: 'url' });
            return placeholder;
        }
    );

    // Protect HTML tags
    processedContent = processedContent.replace(
        /<[^>]+>/g,
        (match) => {
            const placeholder = `__HTML_${blockIndex++}__`;
            protectedBlocks.push({ placeholder, original: match, type: 'html' });
            return placeholder;
        }
    );

    // Protect markdown heading markers (preserve # symbols)
    // Match lines starting with 1-6 # followed by space
    processedContent = processedContent.replace(
        /^(#{1,6})\s+/gm,
        (match, hashes) => {
            const placeholder = `__HEADING_${blockIndex++}__ `;
            protectedBlocks.push({ placeholder, original: match, type: 'html' });
            return placeholder;
        }
    );

    return {
        frontmatter,
        content: processedContent,
        protectedBlocks,
    };
}

/**
 * Restore protected blocks in translated content
 */
export function restoreProtectedBlocks(
    translatedContent: string,
    protectedBlocks: ProtectedBlock[]
): string {
    let result = translatedContent;

    for (const block of protectedBlocks) {
        // Handle link placeholders specially - reconstruct with translated text
        if (block.type === 'url' && block.placeholder.startsWith('__LINK_')) {
            // Find the translated text for this link
            const linkRegex = new RegExp(`${escapeRegex(block.placeholder)}\\[([^\\]]+)\\]`, 'g');
            result = result.replace(linkRegex, (_, translatedText) => {
                // Extract URL from original
                const urlMatch = block.original.match(/\]\(([^)]+)\)/);
                const url = urlMatch ? urlMatch[1] : '';
                return `[${translatedText}](${url})`;
            });
        } else {
            // Simple replacement for other types
            result = result.replace(new RegExp(escapeRegex(block.placeholder), 'g'), block.original);
        }
    }

    return result;
}

/**
 * Reconstruct markdown with frontmatter
 */
export function reconstructMarkdown(
    frontmatter: Record<string, unknown>,
    content: string
): string {
    if (Object.keys(frontmatter).length === 0) {
        return content;
    }
    return matter.stringify(content, frontmatter);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fix placeholders that LLM may have corrupted during translation.
 * Common issues:
 * 1. Spaces inserted: "__ INLINE_CODE_1__" -> "__INLINE_CODE_1__"
 * 2. Names translated: "__内联代码_0__" -> needs to match original
 */
export function fixCorruptedPlaceholders(
    content: string,
    protectedBlocks: ProtectedBlock[]
): string {
    let result = content;

    // Fix spaces in placeholders: "__ SOMETHING" -> "__SOMETHING"
    result = result.replace(/__ ([A-Z]+)/g, '__$1');

    // Build a map of Chinese placeholder names to their original names
    const chineseToEnglish: Record<string, string> = {
        '内联代码': 'INLINE_CODE',
        '代码块': 'CODE_BLOCK',
        '链接': 'LINK',
        '网址': 'URL',
        '图片': 'IMAGE',
        '标题': 'HEADING',
    };

    // Fix translated placeholder names
    for (const [chinese, english] of Object.entries(chineseToEnglish)) {
        const chinesePattern = new RegExp(`__${chinese}_(\\d+)__`, 'g');
        result = result.replace(chinesePattern, `__${english}_$1__`);
    }

    return result;
}

/**
 * Estimate token count for a string (rough approximation)
 * Uses ~4 characters per token as a rough estimate for mixed content
 */
export function estimateTokens(text: string): number {
    // For Chinese text, roughly 1.5-2 characters per token
    // For English text, roughly 4 characters per token
    // We'll use a conservative estimate
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;

    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}
