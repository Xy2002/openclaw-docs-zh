/**
 * Sync Module
 * Downloads documentation from upstream GitHub repository
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
 * Download documentation files from GitHub
 */
export async function downloadDocsFromGitHub(config: SyncConfig): Promise<SyncStats> {
    const stats: SyncStats = {
        filesDownloaded: 0,
        filesSkipped: 0,
        totalSize: 0,
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

    // Filter for markdown files in the docs path
    const docsPrefix = config.docsPath.endsWith('/') ? config.docsPath : `${config.docsPath}/`;
    const markdownFiles = treeData.tree.filter(item =>
        item.type === 'blob' &&
        item.path.startsWith(docsPrefix) &&
        (item.path.endsWith('.md') || item.path.endsWith('.mdx'))
    );

    console.log(`📁 Found ${markdownFiles.length} markdown files`);

    // Download each file
    for (const file of markdownFiles) {
        const relativePath = file.path.replace(docsPrefix, '');
        const outputPath = join(config.outputDir, relativePath);

        try {
            // Fetch file content
            const contentUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${file.path}`;
            const contentResponse = await fetch(contentUrl, { headers });

            if (!contentResponse.ok) {
                console.warn(`⚠️ Failed to download: ${file.path}`);
                continue;
            }

            const content = await contentResponse.text();

            // Check if file needs updating
            const needsUpdate = await checkFileNeedsUpdate(outputPath, content);

            if (needsUpdate) {
                // Ensure directory exists
                await mkdir(dirname(outputPath), { recursive: true });

                // Write file
                await writeFile(outputPath, content, 'utf-8');
                stats.filesDownloaded++;
                stats.totalSize += content.length;
            } else {
                stats.filesSkipped++;
            }

            // Progress indicator
            process.stdout.write(`\r   Processed ${stats.filesDownloaded + stats.filesSkipped}/${markdownFiles.length}`);

        } catch (error) {
            console.warn(`\n⚠️ Error processing ${file.path}:`, error);
        }
    }

    console.log(''); // New line after progress

    return stats;
}

/**
 * Check if local file needs to be updated
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
 * Also download non-markdown assets (images, etc.) if needed
 */
export async function downloadAssets(config: SyncConfig): Promise<number> {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'openclaw-docs-translator',
    };

    if (config.githubToken) {
        headers['Authorization'] = `Bearer ${config.githubToken}`;
    }

    const branchResponse = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}/git/trees/${config.branch}?recursive=1`,
        { headers }
    );

    if (!branchResponse.ok) {
        throw new Error(`Failed to fetch repository tree: ${branchResponse.status}`);
    }

    const treeData = await branchResponse.json() as GitHubTreeResponse;

    const docsPrefix = config.docsPath.endsWith('/') ? config.docsPath : `${config.docsPath}/`;
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

    const assetFiles = treeData.tree.filter(item =>
        item.type === 'blob' &&
        item.path.startsWith(docsPrefix) &&
        assetExtensions.some(ext => item.path.toLowerCase().endsWith(ext))
    );

    let downloaded = 0;

    for (const file of assetFiles) {
        const relativePath = file.path.replace(docsPrefix, '');
        const outputPath = join(config.outputDir, relativePath);

        try {
            const contentUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${file.path}`;
            const contentResponse = await fetch(contentUrl, { headers });

            if (!contentResponse.ok) continue;

            const buffer = Buffer.from(await contentResponse.arrayBuffer());
            await mkdir(dirname(outputPath), { recursive: true });
            await writeFile(outputPath, buffer);
            downloaded++;
        } catch {
            // Skip failed assets
        }
    }

    return downloaded;
}
