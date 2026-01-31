/**
 * Sync Module
 * Downloads entire documentation folder from upstream GitHub repository
 * Supports Mintlify and other static doc generators that need complete folder structure
 */

import { mkdir, writeFile, readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { createHash } from 'crypto';

export interface SyncConfig {
    owner: string;
    repo: string;
    branch: string;
    docsPath: string;
    outputDir: string;
    githubToken?: string;
}

export interface SyncStats {
    filesDownloaded: number;
    filesSkipped: number;
    totalSize: number;
    /** Upstream file hashes for incremental translation detection */
    upstreamHashes: Map<string, string>;
}

interface GitHubTreeItem {
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
    url: string;
}

interface GitHubTreeResponse {
    sha: string;
    url: string;
    tree: GitHubTreeItem[];
    truncated: boolean;
}

/**
 * Download ALL files from docs folder (not just markdown)
 * This preserves Mintlify config files, assets, images, etc.
 */
export async function downloadDocsFromGitHub(config: SyncConfig): Promise<SyncStats> {
    const stats: SyncStats = {
        filesDownloaded: 0,
        filesSkipped: 0,
        totalSize: 0,
        upstreamHashes: new Map<string, string>(),
    };

    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'openclaw-docs-translator',
    };

    if (config.githubToken) {
        headers['Authorization'] = `Bearer ${config.githubToken}`;
    }

    // Get the tree SHA for the branch
    console.log('📡 Fetching repository tree...');

    const branchResponse = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}/git/trees/${config.branch}?recursive=1`,
        { headers }
    );

    if (!branchResponse.ok) {
        throw new Error(`Failed to fetch repository tree: ${branchResponse.status} ${branchResponse.statusText}`);
    }

    const treeData = await branchResponse.json() as GitHubTreeResponse;

    // Filter for ALL files in the docs path (not just markdown)
    const docsPrefix = config.docsPath.endsWith('/') ? config.docsPath : `${config.docsPath}/`;
    const allFiles = treeData.tree.filter(item =>
        item.type === 'blob' &&
        item.path.startsWith(docsPrefix)
    );

    console.log(`📁 Found ${allFiles.length} files in docs folder`);

    // Categorize files for logging
    const mdFiles = allFiles.filter(f => f.path.endsWith('.md') || f.path.endsWith('.mdx'));
    const nonMdFiles = allFiles.filter(f => !f.path.endsWith('.md') && !f.path.endsWith('.mdx'));

    console.log(`   📝 Markdown: ${mdFiles.length} (will track hashes only, NOT overwrite)`);
    console.log(`   📄 Other: ${nonMdFiles.length} (will sync)`);

    // For markdown files: fetch content and record upstream hash for translation detection
    // We do NOT write these to disk - that would overwrite translations!
    console.log('\n📊 Recording upstream markdown hashes...');
    for (let i = 0; i < mdFiles.length; i++) {
        const file = mdFiles[i];
        const relativePath = file.path.replace(docsPrefix, '');

        try {
            const contentUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${file.path}`;
            const contentResponse = await fetch(contentUrl, { headers });

            if (contentResponse.ok) {
                const content = await contentResponse.text();
                const hash = createHash('md5').update(content).digest('hex');
                stats.upstreamHashes.set(relativePath, hash);
            }

            process.stdout.write(`\r   Processed ${i + 1}/${mdFiles.length} markdown files`);
        } catch (error) {
            console.warn(`\n⚠️ Error fetching ${file.path}:`, error);
        }
    }
    console.log('');

    // For non-markdown files: download/update as before (assets, configs, etc.)
    console.log('\n📥 Syncing non-markdown files (assets, configs)...');
    for (let i = 0; i < nonMdFiles.length; i++) {
        const file = nonMdFiles[i];
        const relativePath = file.path.replace(docsPrefix, '');
        const outputPath = join(config.outputDir, relativePath);

        try {
            const contentUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${file.path}`;
            const contentResponse = await fetch(contentUrl, { headers });

            if (!contentResponse.ok) {
                console.warn(`\n⚠️ Failed to download: ${file.path}`);
                continue;
            }

            const isBinary = isBinaryFile(file.path);
            let needsUpdate = true;

            if (isBinary) {
                const buffer = Buffer.from(await contentResponse.arrayBuffer());
                needsUpdate = await checkBinaryFileNeedsUpdate(outputPath, buffer);

                if (needsUpdate) {
                    await mkdir(dirname(outputPath), { recursive: true });
                    await writeFile(outputPath, buffer);
                    stats.filesDownloaded++;
                    stats.totalSize += buffer.length;
                } else {
                    stats.filesSkipped++;
                }
            } else {
                const content = await contentResponse.text();
                needsUpdate = await checkFileNeedsUpdate(outputPath, content);

                if (needsUpdate) {
                    await mkdir(dirname(outputPath), { recursive: true });
                    await writeFile(outputPath, content, 'utf-8');
                    stats.filesDownloaded++;
                    stats.totalSize += content.length;
                } else {
                    stats.filesSkipped++;
                }
            }

            process.stdout.write(`\r   Processed ${i + 1}/${nonMdFiles.length} non-markdown files`);

        } catch (error) {
            console.warn(`\n⚠️ Error processing ${file.path}:`, error);
        }
    }

    console.log(''); // New line after progress

    return stats;

}

/**
 * Check if file is binary based on extension
 */
function isBinaryFile(path: string): boolean {
    const binaryExtensions = [
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp',
        '.pdf', '.zip', '.tar', '.gz',
        '.woff', '.woff2', '.ttf', '.eot',
        '.mp4', '.webm', '.mp3', '.wav'
    ];
    const lowerPath = path.toLowerCase();
    return binaryExtensions.some(ext => lowerPath.endsWith(ext));
}

/**
 * Check if local text file needs to be updated
 */
async function checkFileNeedsUpdate(localPath: string, newContent: string): Promise<boolean> {
    try {
        const existingContent = await readFile(localPath, 'utf-8');
        const existingHash = createHash('md5').update(existingContent).digest('hex');
        const newHash = createHash('md5').update(newContent).digest('hex');
        return existingHash !== newHash;
    } catch {
        // File doesn't exist, needs to be created
        return true;
    }
}

/**
 * Check if local binary file needs to be updated
 */
async function checkBinaryFileNeedsUpdate(localPath: string, newContent: Buffer): Promise<boolean> {
    try {
        const existingContent = await readFile(localPath);
        const existingHash = createHash('md5').update(existingContent).digest('hex');
        const newHash = createHash('md5').update(newContent).digest('hex');
        return existingHash !== newHash;
    } catch {
        // File doesn't exist, needs to be created
        return true;
    }
}

