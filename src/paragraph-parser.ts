/**
 * Paragraph Parser
 * Splits markdown content into paragraphs for granular caching and translation.
 * Enables incremental translation by only re-translating changed paragraphs.
 */

import { createHash } from 'crypto';
import matter from 'gray-matter';

export interface Paragraph {
    id: number;                                   // Paragraph sequence number
    type: 'heading' | 'text' | 'list' | 'code' | 'blockquote' | 'other';
    content: string;                              // Raw content including newlines
    hash: string;                                 // MD5 hash for change detection
    translatable: boolean;                        // Whether this paragraph should be translated
}

export interface ParsedDocument {
    frontmatter: Record<string, unknown>;
    paragraphs: Paragraph[];
}

/**
 * Compute MD5 hash of content
 */
function computeHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
}

/**
 * Determine paragraph type based on content
 */
function detectParagraphType(content: string): Paragraph['type'] {
    const trimmed = content.trim();

    // Heading: starts with #
    if (/^#{1,6}\s/.test(trimmed)) {
        return 'heading';
    }

    // Code block: starts with ``` or ~~~
    if (/^(```|~~~)/.test(trimmed)) {
        return 'code';
    }

    // List: starts with -, *, +, or numbered (1. 2. etc.)
    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        return 'list';
    }

    // Blockquote: starts with >
    if (/^>/.test(trimmed)) {
        return 'blockquote';
    }

    // Default to text
    return trimmed ? 'text' : 'other';
}

/**
 * Check if a paragraph type should be translated
 */
function isTranslatable(type: Paragraph['type']): boolean {
    // Code blocks should not be translated
    return type !== 'code';
}

/**
 * Split markdown content into paragraphs
 * 
 * Rules:
 * - Code blocks (``` or ~~~) are kept as single paragraphs
 * - Headings are individual paragraphs
 * - Consecutive list items are grouped together
 * - Consecutive blockquote lines are grouped together
 * - Regular text separated by blank lines are separate paragraphs
 */
export function splitIntoParagraphs(content: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');

    let currentBlock: string[] = [];
    let blockType: Paragraph['type'] | null = null;
    let inCodeBlock = false;
    let codeBlockDelimiter = '';
    let paragraphId = 0;

    const flushBlock = () => {
        if (currentBlock.length > 0) {
            const blockContent = currentBlock.join('\n');
            const type = blockType || detectParagraphType(blockContent);

            paragraphs.push({
                id: paragraphId++,
                type,
                content: blockContent,
                hash: computeHash(blockContent),
                translatable: isTranslatable(type),
            });

            currentBlock = [];
            blockType = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Handle code blocks specially
        if (!inCodeBlock && (trimmedLine.startsWith('```') || trimmedLine.startsWith('~~~'))) {
            // Start of code block
            flushBlock();
            inCodeBlock = true;
            codeBlockDelimiter = trimmedLine.startsWith('```') ? '```' : '~~~';
            currentBlock.push(line);
            blockType = 'code';
            continue;
        }

        if (inCodeBlock) {
            currentBlock.push(line);
            // Check for end of code block
            if (trimmedLine.startsWith(codeBlockDelimiter) && currentBlock.length > 1) {
                inCodeBlock = false;
                flushBlock();
            }
            continue;
        }

        // Empty line - flush current block
        if (trimmedLine === '') {
            flushBlock();
            continue;
        }

        // Heading - always a separate paragraph
        if (/^#{1,6}\s/.test(trimmedLine)) {
            flushBlock();
            currentBlock.push(line);
            blockType = 'heading';
            flushBlock();
            continue;
        }

        // List item
        if (/^[-*+]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine)) {
            // If we're already in a list, continue it
            if (blockType === 'list') {
                currentBlock.push(line);
            } else {
                // Start a new list
                flushBlock();
                currentBlock.push(line);
                blockType = 'list';
            }
            continue;
        }

        // Blockquote
        if (trimmedLine.startsWith('>')) {
            if (blockType === 'blockquote') {
                currentBlock.push(line);
            } else {
                flushBlock();
                currentBlock.push(line);
                blockType = 'blockquote';
            }
            continue;
        }

        // Regular text - group with previous text if same type
        if (blockType === 'text') {
            currentBlock.push(line);
        } else {
            flushBlock();
            currentBlock.push(line);
            blockType = 'text';
        }
    }

    // Flush any remaining content
    flushBlock();

    return paragraphs;
}

/**
 * Merge paragraphs back into a single markdown string
 */
export function mergeParagraphs(paragraphs: Paragraph[]): string {
    if (paragraphs.length === 0) {
        return '';
    }

    // Join paragraphs with double newlines (blank line between)
    return paragraphs.map(p => p.content).join('\n\n');
}

/**
 * Parse a complete markdown document into frontmatter and paragraphs
 */
export function parseDocumentIntoParagraphs(rawContent: string): ParsedDocument {
    // Extract frontmatter using gray-matter
    const { data: frontmatter, content } = matter(rawContent);

    // Split body into paragraphs
    const paragraphs = splitIntoParagraphs(content);

    return {
        frontmatter,
        paragraphs,
    };
}

/**
 * Reconstruct a complete markdown document from frontmatter and paragraphs
 */
export function reconstructDocument(
    frontmatter: Record<string, unknown>,
    paragraphs: Paragraph[]
): string {
    const body = mergeParagraphs(paragraphs);

    if (Object.keys(frontmatter).length === 0) {
        return body;
    }

    return matter.stringify(body, frontmatter);
}
