/**
 * MDX Validator
 * Validates markdown/MDX files for syntax errors before Mintlify deployment
 */

import { compile } from '@mdx-js/mdx';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

export interface ValidationError {
    file: string;
    line?: number;
    column?: number;
    message: string;
    source?: string;
}

export interface ValidationResult {
    totalFiles: number;
    validFiles: number;
    invalidFiles: number;
    errors: ValidationError[];
}

/**
 * Validate a single MDX/MD file
 */
async function validateFile(filePath: string): Promise<ValidationError | null> {
    try {
        const content = await readFile(filePath, 'utf-8');

        // Try to compile with MDX
        await compile(content, {
            // Use JSX runtime to avoid needing React
            jsx: true,
            // Don't emit - just parse/compile
            development: false,
        });

        return null; // No error
    } catch (error: unknown) {
        const err = error as { line?: number; column?: number; message?: string; reason?: string };

        // Extract error details
        return {
            file: filePath,
            line: err.line,
            column: err.column,
            message: err.reason || err.message || String(error),
        };
    }
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
 * Validate all markdown files in a directory
 */
export async function validateDirectory(
    sourceDir: string,
    options: { verbose?: boolean } = {}
): Promise<ValidationResult> {
    const { verbose = false } = options;

    console.log(`\n🔍 Validating MDX syntax in ${sourceDir}...\n`);

    const files = await getMarkdownFiles(sourceDir);
    const errors: ValidationError[] = [];
    let validCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const error = await validateFile(file);

        if (error) {
            errors.push(error);
            const location = error.line ? `:${error.line}${error.column ? `:${error.column}` : ''}` : '';
            console.log(`❌ ${file}${location}`);
            console.log(`   ${error.message}\n`);
        } else {
            validCount++;
            if (verbose) {
                process.stdout.write(`\r✅ Validated ${validCount}/${files.length} files`);
            }
        }
    }

    if (verbose && errors.length === 0) {
        console.log('');
    }

    // Print summary
    console.log('\n📊 Validation Summary');
    console.log('─'.repeat(40));
    console.log(`📁 Total files:    ${files.length}`);
    console.log(`✅ Valid:          ${validCount}`);
    console.log(`❌ Invalid:        ${errors.length}`);
    console.log('─'.repeat(40));

    return {
        totalFiles: files.length,
        validFiles: validCount,
        invalidFiles: errors.length,
        errors,
    };
}
