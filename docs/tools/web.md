---
summary: 'Web search + fetch tools (Brave Search API, Perplexity direct/OpenRouter)'
read_when:
  - You want to enable web_search or web_fetch
  - You need Brave Search API key setup
  - You want to use Perplexity Sonar for web search
---
# 网页工具

OpenClaw 提供两款轻量级网页工具：

- `web_search` — 通过 Brave Search API（默认）或 Perplexity Sonar（直接调用或经由 OpenRouter）搜索网络。
- `web_fetch` — 执行 HTTP 请求并提取可读内容（HTML → Markdown/文本）。

这些工具**并非**用于浏览器自动化。对于包含大量 JavaScript 的网站或需要登录的场景，请使用
[浏览器工具](/tools/browser)。

## 工作原理

- `web_search` 调用您配置的提供商并返回搜索结果。
  - **Brave**（默认）：返回结构化结果（标题、URL、摘要）。
  - **Perplexity**：返回基于实时网络搜索并附带引用的 AI 合成答案。
- 搜索结果按查询缓存 15 分钟（可配置）。
- `web_fetch` 执行普通的 HTTP GET 请求，并提取可读内容（HTML → Markdown/文本）。它**不**执行 JavaScript。
- `web_fetch` 默认启用（除非显式禁用）。

## 选择搜索提供商

| 提供商 | 优点 | 缺点 | API 密钥 |
|----------|------|------|---------|
| **Brave**（默认） | 速度快，结果结构化，提供免费层级 | 传统搜索结果 | `BRAVE_API_KEY` |
| **Perplexity** | AI 合成答案，附带引用，实时性 | 需要 Perplexity 或 OpenRouter 访问权限 | `OPENROUTER_API_KEY` 或 `PERPLEXITY_API_KEY` |

有关特定提供商的详细信息，请参阅 [Brave Search 设置](/brave-search) 和 [Perplexity Sonar](/perplexity)。

在配置中设置提供商：

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave"  // or "perplexity"
      }
    }
  }
}
```

示例：切换到 Perplexity Sonar（直接 API）：

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...",
          baseUrl: "https://api.perplexity.ai",
          model: "perplexity/sonar-pro"
        }
      }
    }
  }
}
```

## 获取 Brave API 密钥

1) 在 https://brave.com/search/api/ 创建一个 Brave Search API 账户。
2) 在仪表板中，选择 **Data for Search** 方案（而非“Data for AI”），并生成 API 密钥。
3) 运行 `openclaw configure --section web` 将密钥存储在配置中（推荐），或在您的环境变量中设置 `BRAVE_API_KEY`。

Brave 提供免费层级以及付费方案；请查看 Brave API 门户以了解当前的限制和定价。

### 推荐的密钥设置位置

**推荐方法：**运行 `openclaw configure --section web`。它会将密钥存储在 `~/.openclaw/openclaw.json` 下的 `tools.web.search.apiKey` 中。

**环境变量替代方案：:**在 Gateway 进程的环境中设置 `BRAVE_API_KEY`。对于 Gateway 安装，将其放入 `~/.openclaw/.env`（或您的服务环境）。详情请参阅 [环境变量](/help/faq#how-does-openclaw-load-environment-variables)。

## 使用 Perplexity（直接调用或经由 OpenRouter）

Perplexity Sonar 模型内置了网络搜索功能，并返回带有引用的 AI 合成答案。您可以通过 OpenRouter 使用这些模型（无需信用卡——支持加密货币和预付支付）。

### 获取 OpenRouter API 密钥

1) 在 https://openrouter.ai/ 创建一个账户。
2) 添加余额（支持加密货币、预付卡或信用卡）。
3) 在您的账户设置中生成 API 密钥。

### 设置 Perplexity 搜索

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          // API key (optional if OPENROUTER_API_KEY or PERPLEXITY_API_KEY is set)
          apiKey: "sk-or-v1-...",
          // Base URL (key-aware default if omitted)
          baseUrl: "https://openrouter.ai/api/v1",
          // Model (defaults to perplexity/sonar-pro)
          model: "perplexity/sonar-pro"
        }
      }
    }
  }
}
```

**环境变量替代方案：**在 Gateway 环境中设置 `OPENROUTER_API_KEY` 或 `PERPLEXITY_API_KEY`。对于 Gateway 安装，将其放入 `~/.openclaw/.env`。

如果未设置基础 URL，OpenClaw 会根据 API 密钥来源选择默认值：

- `PERPLEXITY_API_KEY` 或 `pplx-...` → `https://api.perplexity.ai`
- `OPENROUTER_API_KEY` 或 `sk-or-...` → `https://openrouter.ai/api/v1`
- 未知密钥格式 → OpenRouter（安全回退）

### 可用的 Perplexity 模型

| 模型 | 描述 | 适用场景 |
|-------|-------------|----------|
| `perplexity/sonar` | 带有网络搜索的快速问答 | 快速查询 |
| `perplexity/sonar-pro`（默认） | 带有网络搜索的多步推理 | 复杂问题 |
| `perplexity/sonar-reasoning-pro` | 思考链分析 | 深度研究 |

## web_search

使用您配置的提供商搜索网络。

### 要求

- `tools.web.search.enabled` 不得为 `false`（默认：启用）。
- 所选提供商的 API 密钥：
  - **Brave**：`BRAVE_API_KEY` 或 `tools.web.search.apiKey`。
  - **Perplexity**：`OPENROUTER_API_KEY`、`PERPLEXITY_API_KEY` 或 `tools.web.search.perplexity.apiKey`。

### 配置

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE", // optional if BRAVE_API_KEY is set
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15
      }
    }
  }
}
```

### 工具参数

- `query`（必填）。
- `count`（1–10；默认来自配置）。
- `country`（可选）：2 位数国家代码，用于获取特定地区的搜索结果（例如，“DE”、“US”、“ALL”）。若省略，Brave 将选择其默认地区。
- `search_lang`（可选）：ISO 语言代码，用于指定搜索结果的语言（例如，“de”、“en”、“fr”）。
- `ui_lang`（可选）：ISO 语言代码，用于指定界面元素的语言。
- `freshness`（可选，仅适用于 Brave）：按发现时间筛选（`pd`、`pw`、`pm`、`py` 或 `YYYY-MM-DDtoYYYY-MM-DD`）。

**示例：**

```javascript
// German-specific search
await web_search({
  query: "TV online schauen",
  count: 10,
  country: "DE",
  search_lang: "de"
});

// French search with French UI
await web_search({
  query: "actualités",
  country: "FR",
  search_lang: "fr",
  ui_lang: "fr"
});

// Recent results (past week)
await web_search({
  query: "TMBG interview",
  freshness: "pw"
});
```

## web_fetch

获取 URL 并提取可读内容。

### 要求

- `tools.web.fetch.enabled` 不得为 `false`（默认：启用）。
- 可选的 Firecrawl 回退：设置 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY`。

### 配置

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        maxChars: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        readability: true,
        firecrawl: {
          enabled: true,
          apiKey: "FIRECRAWL_API_KEY_HERE", // optional if FIRECRAWL_API_KEY is set
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 86400000, // ms (1 day)
          timeoutSeconds: 60
        }
      }
    }
  }
}
```

### 工具参数

- `url`（必填，仅支持 http/https）。
- `extractMode`（`markdown` | `text`）。
- `maxChars`（截断长页面）。

注意事项：
- `web_fetch` 首先使用 Readability 进行主要内容提取，然后在已配置的情况下使用 Firecrawl。如果两者都失败，工具将返回错误。
- Firecrawl 请求默认使用规避机器人模式，并对结果进行缓存。
- `web_fetch` 默认发送类似 Chrome 的 User-Agent，`Accept-Language` 也默认启用；如有需要，可覆盖 `userAgent`。
- `web_fetch` 会阻止私有/内部主机名，并重新检查重定向（重定向次数上限由 `maxRedirects` 控制）。
- `web_fetch` 是尽力而为的提取；某些网站可能仍需使用浏览器工具。
- 有关密钥设置和服务详情，请参阅 [Firecrawl](/tools/firecrawl)。
- 响应默认缓存 15 分钟，以减少重复请求。
- 如果您使用工具配置文件或白名单，请添加 `web_search`/`web_fetch` 或 `group:web`。
- 如果缺少 Brave 密钥，`web_search` 会返回一条简短的设置提示，并附上文档链接。
