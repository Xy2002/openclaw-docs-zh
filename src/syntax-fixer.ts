/**
 * Syntax Fixer
 * Automatically fixes common syntax errors in translated markdown files
 * that can cause Mintlify parsing failures.
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname } from 'path';

export interface SyntaxFix {
    pattern: RegExp;
    replacement: string | ((match: string, ...args: string[]) => string);
    description: string;
}

export interface FixResult {
    file: string;
    fixesApplied: number;
    fixDescriptions: string[];
}

/**
 * List of syntax fixes to apply after translation
 * These fix common issues where the LLM breaks HTML/MDX syntax
 */
const SYNTAX_FIXES: SyntaxFix[] = [
    // Fix href/src attributes with missing closing quotes before >
    // e.g., href="__URL_X__> -> href="__URL_X__">
    {
        pattern: /(href|src)="(__URL_\d+__)>/g,
        replacement: '$1="$2">',
        description: 'Fixed missing quote in href/src attribute',
    },

    // Fix href/src attributes with missing closing quotes before newline
    // e.g., src="__URL_X__\n -> src="__URL_X__"\n
    {
        pattern: /(href|src)="(__URL_\d+__)(\r?\n)/g,
        replacement: '$1="$2"$3',
        description: 'Fixed missing quote in multiline href/src attribute',
    },

    // Fix broken link placeholder format: __LINK_X__#[text] -> [text](__URL_X__)
    // This happens when LLM adds # between placeholder and bracket
    {
        pattern: /__LINK_(\d+)#\[([^\]]+)\]/g,
        replacement: '[$2](__URL_$1__)',
        description: 'Fixed broken link placeholder format',
    },

    // Fix less-than comparisons being parsed as HTML tags (in Chinese parentheses)
    // e.g., （<10 秒） -> （小于 10 秒）
    {
        pattern: /（<(\d+)/g,
        replacement: '（小于 $1',
        description: 'Fixed less-than symbol before number (Chinese parentheses)',
    },

    // Fix less-than comparisons in regular parentheses
    // e.g., (<10 秒) -> (小于 10 秒)
    {
        pattern: /\(<(\d+)/g,
        replacement: '(小于 $1',
        description: 'Fixed less-than symbol before number (English parentheses)',
    },

    // Fix standalone less-than comparison at start of text or after space
    // e.g., "< 30 分钟" -> "小于 30 分钟"
    {
        pattern: /(^|\s)<\s*(\d+)/gm,
        replacement: '$1小于 $2',
        description: 'Fixed standalone less-than comparison',
    },
];

/**
 * Apply all syntax fixes to content
 */
export function fixSyntaxErrors(content: string): { fixed: string; fixCount: number; descriptions: string[] } {
    let fixed = content;
    let fixCount = 0;
    const descriptions: string[] = [];

    for (const fix of SYNTAX_FIXES) {
        const matches = content.match(fix.pattern);
        if (matches && matches.length > 0) {
            fixed = fixed.replace(fix.pattern, fix.replacement as string);
            fixCount += matches.length;
            descriptions.push(`${fix.description} (${matches.length}x)`);
        }
        // Update content for next iteration to detect cascading fixes
        content = fixed;
    }

    return { fixed, fixCount, descriptions };
}

/**
 * Process a single file
 */
async function processFile(filePath: string, dryRun: boolean): Promise<FixResult | null> {
    const content = await readFile(filePath, 'utf-8');
    const { fixed, fixCount, descriptions } = fixSyntaxErrors(content);

    if (fixCount === 0) {
        return null;
    }

    if (!dryRun) {
        await writeFile(filePath, fixed, 'utf-8');
    }

    return {
        file: filePath,
        fixesApplied: fixCount,
        fixDescriptions: descriptions,
    };
}

/**
 * Recursively get all markdown/mdx files in a directory
 */
async function getMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dir);

    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
            // Skip hidden directories and node_modules
            if (!entry.startsWith('.') && entry !== 'node_modules') {
                const subFiles = await getMarkdownFiles(fullPath);
                files.push(...subFiles);
            }
        } else if (stats.isFile()) {
            const ext = extname(entry).toLowerCase();
            if (ext === '.md' || ext === '.mdx') {
                files.push(fullPath);
            }
        }
    }

    return files;
}

/**
 * Fix syntax errors in all markdown files in a directory
 */
export async function fixDirectory(
    sourceDir: string,
    options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<{ totalFiles: number; fixedFiles: number; totalFixes: number }> {
    const { dryRun = false, verbose = false } = options;

    console.log(`\n🔧 ${dryRun ? '[DRY RUN] ' : ''}Scanning for syntax errors...\n`);

    const files = await getMarkdownFiles(sourceDir);
    let fixedFiles = 0;
    let totalFixes = 0;

    for (const file of files) {
        try {
            const result = await processFile(file, dryRun);
            if (result) {
                fixedFiles++;
                totalFixes += result.fixesApplied;

                if (verbose) {
                    console.log(`📝 ${result.file}`);
                    for (const desc of result.fixDescriptions) {
                        console.log(`   └─ ${desc}`);
                    }
                } else {
                    console.log(`✅ Fixed ${result.fixesApplied} issues in ${result.file}`);
                }
            }
        } catch (error) {
            console.error(`❌ Error processing ${file}: ${error instanceof Error ? error.message : error}`);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total files scanned: ${files.length}`);
    console.log(`   Files with fixes: ${fixedFiles}`);
    console.log(`   Total fixes applied: ${totalFixes}`);

    if (dryRun && totalFixes > 0) {
        console.log(`\n💡 Run without --dry-run to apply fixes.`);
    }

    return { totalFiles: files.length, fixedFiles, totalFixes };
}
