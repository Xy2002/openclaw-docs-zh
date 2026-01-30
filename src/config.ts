/**
 * Configuration Types
 */

export interface Config {
    upstream: {
        owner: string;
        repo: string;
        branch: string;
        docsPath: string;
    };
    translation: {
        model: string;
        targetLanguage: string;
        outputDir: string;
    };
    rateLimit: {
        rpm: number;
        tpm: number;
        maxConcurrent: number;
    };
}

export const defaultConfig: Config = {
    upstream: {
        owner: 'openclaw',
        repo: 'openclaw',
        branch: 'main',
        docsPath: 'docs',
    },
    translation: {
        model: 'gpt-4o-mini',
        targetLanguage: 'zh-CN',
        outputDir: 'docs-zh',
    },
    rateLimit: {
        rpm: 500,
        tpm: 200000,
        maxConcurrent: 5,
    },
};

/**
 * Load configuration from file
 */
export async function loadConfig(configPath: string): Promise<Config> {
    const { readFile } = await import('fs/promises');

    try {
        const content = await readFile(configPath, 'utf-8');
        const userConfig = JSON.parse(content) as Partial<Config>;

        return {
            upstream: { ...defaultConfig.upstream, ...userConfig.upstream },
            translation: { ...defaultConfig.translation, ...userConfig.translation },
            rateLimit: { ...defaultConfig.rateLimit, ...userConfig.rateLimit },
        };
    } catch {
        return defaultConfig;
    }
}
