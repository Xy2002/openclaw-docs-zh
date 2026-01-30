/**
 * OpenAI Translator
 * Translates markdown content to Chinese using OpenAI API
 */

import OpenAI from 'openai';
import { RateLimiter } from './rate-limiter.js';
import {
    parseMarkdown,
    restoreProtectedBlocks,
    reconstructMarkdown,
    estimateTokens
} from './markdown-parser.js';

export interface TranslatorConfig {
    apiKey: string;
    model?: string;
    baseURL?: string;
    targetLanguage?: string;
}

export interface TranslationResult {
    translatedContent: string;
    inputTokens: number;
    outputTokens: number;
}

const TRANSLATION_SYSTEM_PROMPT = `You are a professional technical documentation translator. Translate the following content to Simplified Chinese (简体中文).

Important rules:
1. Preserve all markdown formatting exactly
2. Do NOT translate:
   - Placeholders like __CODE_BLOCK_0__, __LINK_1__, etc.
   - Technical terms, command names, function names, variable names
   - Brand names and product names
3. Keep the same paragraph structure and line breaks
4. Maintain professional and technical tone
5. Translate naturally, not word-by-word
6. For link placeholders like "__LINK_X__[text]", translate the text in brackets but keep the placeholder

Return ONLY the translated content, no explanations.`;

export class Translator {
    private readonly apiKey: string;
    private readonly baseURL: string;
    private readonly model: string;
    private readonly targetLanguage: string;
    private readonly rateLimiter: RateLimiter;
    private readonly isQwenTranslation: boolean;

    constructor(config: TranslatorConfig, rateLimiter: RateLimiter) {
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL ?? 'https://api.openai.com/v1';
        this.model = config.model ?? 'gpt-4o-mini';
        this.targetLanguage = config.targetLanguage ?? 'zh-CN';
        this.rateLimiter = rateLimiter;
        // Check if using Qwen translation model
        this.isQwenTranslation = this.model.includes('qwen-mt');
    }

    /**
     * Make API request - handles both OpenAI and Qwen translation APIs
     */
    private async makeRequest(content: string): Promise<{
        translatedText: string;
        inputTokens: number;
        outputTokens: number;
    }> {
        const url = `${this.baseURL}/chat/completions`;

        // Build request body
        const body: Record<string, unknown> = {
            model: this.model,
            messages: this.isQwenTranslation
                ? [{ role: 'user', content }]
                : [
                    { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
                    { role: 'user', content }
                ],
        };

        // Add Qwen translation-specific options
        if (this.isQwenTranslation) {
            body.translation_options = {
                source_lang: 'English',
                target_lang: this.targetLanguage
            };
        } else {
            body.temperature = 0.3;
        }

        console.log(`📡 Request: model=${this.model}, isQwen=${this.isQwenTranslation}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error: ${response.status} - ${errorText}`);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as {
            choices: Array<{ message: { content: string } }>;
            usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        };

        return {
            translatedText: data.choices[0]?.message?.content ?? '',
            inputTokens: data.usage?.prompt_tokens ?? 0,
            outputTokens: data.usage?.completion_tokens ?? 0,
        };
    }

    /**
     * Translate a markdown file content
     */
    async translateMarkdown(rawContent: string): Promise<TranslationResult> {
        // Parse and protect non-translatable content
        const parsed = parseMarkdown(rawContent);

        // If content is empty or only has protected blocks, return as-is
        const textToTranslate = parsed.content.trim();
        if (!textToTranslate || this.isOnlyPlaceholders(textToTranslate)) {
            return {
                translatedContent: reconstructMarkdown(parsed.frontmatter, parsed.content),
                inputTokens: 0,
                outputTokens: 0,
            };
        }

        // Estimate tokens for rate limiting
        const estimatedInputTokens = estimateTokens(textToTranslate) + estimateTokens(TRANSLATION_SYSTEM_PROMPT);
        const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 1.5);
        const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

        // Execute translation with rate limiting
        const result = await this.rateLimiter.execute(estimatedTotalTokens, async () => {
            const apiResult = await this.makeRequest(textToTranslate);

            return {
                result: apiResult,
                actualTokens: apiResult.inputTokens + apiResult.outputTokens,
            };
        });

        // Restore protected blocks
        const restoredContent = restoreProtectedBlocks(result.translatedText, parsed.protectedBlocks);

        // Reconstruct with frontmatter
        const finalContent = reconstructMarkdown(parsed.frontmatter, restoredContent);

        return {
            translatedContent: finalContent,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
        };
    }

    /**
     * Check if content is only placeholders (no actual text to translate)
     */
    private isOnlyPlaceholders(content: string): boolean {
        const withoutPlaceholders = content.replace(/__[A-Z_]+_\d+__/g, '').trim();
        return withoutPlaceholders.length === 0;
    }

    /**
     * Translate frontmatter fields that should be translated
     */
    async translateFrontmatter(
        frontmatter: Record<string, unknown>
    ): Promise<Record<string, unknown>> {
        const translatableFields = ['summary', 'description', 'title'];
        const translated = { ...frontmatter };

        for (const field of translatableFields) {
            if (typeof frontmatter[field] === 'string') {
                const text = frontmatter[field] as string;
                const estimatedTokens = estimateTokens(text) * 2;

                const result = await this.rateLimiter.execute(estimatedTokens, async () => {
                    const apiResult = await this.makeRequest(text);
                    return {
                        result: apiResult.translatedText,
                        actualTokens: apiResult.inputTokens + apiResult.outputTokens,
                    };
                });

                translated[field] = result;
            }
        }

        return translated;
    }
}

