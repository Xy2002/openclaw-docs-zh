/**
 * Rate Limiter for OpenAI API
 * Implements sliding window algorithm for RPM (requests per minute) and TPM (tokens per minute)
 */

export interface RateLimiterConfig {
    rpm: number;      // Requests per minute
    tpm: number;      // Tokens per minute
    maxRetries?: number;
    retryDelayMs?: number;
}

interface RequestRecord {
    timestamp: number;
    tokens: number;
}

export class RateLimiter {
    private readonly rpm: number;
    private readonly tpm: number;
    private readonly maxRetries: number;
    private readonly retryDelayMs: number;
    private readonly requestHistory: RequestRecord[] = [];
    private readonly windowMs = 60 * 1000; // 1 minute window

    constructor(config: RateLimiterConfig) {
        this.rpm = config.rpm;
        this.tpm = config.tpm;
        this.maxRetries = config.maxRetries ?? 3;
        this.retryDelayMs = config.retryDelayMs ?? 1000;
    }

    /**
     * Clean up old records outside the sliding window
     */
    private cleanupOldRecords(): void {
        const now = Date.now();
        const cutoff = now - this.windowMs;

        while (this.requestHistory.length > 0 && this.requestHistory[0].timestamp < cutoff) {
            this.requestHistory.shift();
        }
    }

    /**
     * Get current request count in the sliding window
     */
    private getCurrentRequestCount(): number {
        this.cleanupOldRecords();
        return this.requestHistory.length;
    }

    /**
     * Get current token count in the sliding window
     */
    private getCurrentTokenCount(): number {
        this.cleanupOldRecords();
        return this.requestHistory.reduce((sum, record) => sum + record.tokens, 0);
    }

    /**
     * Calculate wait time needed before making a request
     */
    private calculateWaitTime(estimatedTokens: number): number {
        this.cleanupOldRecords();

        const currentRequests = this.getCurrentRequestCount();
        const currentTokens = this.getCurrentTokenCount();

        // Check RPM limit
        if (currentRequests >= this.rpm) {
            const oldestRequest = this.requestHistory[0];
            if (oldestRequest) {
                return oldestRequest.timestamp + this.windowMs - Date.now() + 100;
            }
        }

        // Check TPM limit
        if (currentTokens + estimatedTokens > this.tpm) {
            // Find when enough tokens will be freed
            let tokensToFree = currentTokens + estimatedTokens - this.tpm;
            let waitUntil = Date.now();

            for (const record of this.requestHistory) {
                tokensToFree -= record.tokens;
                waitUntil = record.timestamp + this.windowMs;
                if (tokensToFree <= 0) break;
            }

            return Math.max(0, waitUntil - Date.now() + 100);
        }

        return 0;
    }

    /**
     * Wait if necessary and record the request
     */
    async acquire(estimatedTokens: number): Promise<void> {
        const waitTime = this.calculateWaitTime(estimatedTokens);

        if (waitTime > 0) {
            console.log(`⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s...`);
            await this.sleep(waitTime);
        }

        // Record this request
        this.requestHistory.push({
            timestamp: Date.now(),
            tokens: estimatedTokens,
        });
    }

    /**
     * Update the actual token usage after a request completes
     */
    updateActualTokens(estimatedTokens: number, actualTokens: number): void {
        // Find the most recent record with the estimated tokens and update it
        for (let i = this.requestHistory.length - 1; i >= 0; i--) {
            if (this.requestHistory[i].tokens === estimatedTokens) {
                this.requestHistory[i].tokens = actualTokens;
                break;
            }
        }
    }

    /**
     * Execute a function with rate limiting and retry logic
     */
    async execute<T>(
        estimatedTokens: number,
        fn: () => Promise<{ result: T; actualTokens: number }>
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                await this.acquire(estimatedTokens);
                const { result, actualTokens } = await fn();
                this.updateActualTokens(estimatedTokens, actualTokens);
                return result;
            } catch (error) {
                lastError = error as Error;

                console.log(`Error occurred:`, error);

                // Check if it's a rate limit error (429)
                if (this.isRateLimitError(error)) {
                    const retryAfter = this.getRetryAfter(error);
                    console.log(`⚠️ Rate limit hit, waiting ${retryAfter}ms before retry...`);
                    await this.sleep(retryAfter);
                    continue;
                }

                // For other errors, apply exponential backoff
                if (attempt < this.maxRetries - 1) {
                    const backoffTime = this.retryDelayMs * Math.pow(2, attempt);

                    console.log(`⚠️ Error occurred, retrying in ${backoffTime}ms... (${attempt + 1}/${this.maxRetries})`);
                    await this.sleep(backoffTime);
                }
            }
        }

        throw lastError ?? new Error('Max retries exceeded');
    }

    private isRateLimitError(error: unknown): boolean {
        if (error && typeof error === 'object') {
            const err = error as { status?: number; code?: string };
            return err.status === 429 || err.code === 'rate_limit_exceeded';
        }
        return false;
    }

    private getRetryAfter(error: unknown): number {
        if (error && typeof error === 'object') {
            const err = error as { headers?: { 'retry-after'?: string } };
            const retryAfter = err.headers?.['retry-after'];
            if (retryAfter) {
                return parseInt(retryAfter, 10) * 1000;
            }
        }
        return this.retryDelayMs * 2;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current rate limit status
     */
    getStatus(): { requests: number; tokens: number; rpm: number; tpm: number } {
        this.cleanupOldRecords();
        return {
            requests: this.getCurrentRequestCount(),
            tokens: this.getCurrentTokenCount(),
            rpm: this.rpm,
            tpm: this.tpm,
        };
    }
}
