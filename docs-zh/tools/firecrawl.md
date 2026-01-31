---
summary: Firecrawl fallback for web_fetch (anti-bot + cached extraction)
read_when:
  - You want Firecrawl-backed web extraction
  - You need a Firecrawl API key
  - You want anti-bot extraction for web_fetch
---
# Firecrawl

OpenClaw 可以将 **Firecrawl** 用作 `web_fetch` 的后备提取器。它是一项托管的内容提取服务，支持规避机器人检测和缓存功能，有助于处理 JavaScript 重度加载的网站或会阻止普通 HTTP 请求的页面。

## 获取 API 密钥

1) 创建一个 Firecrawl 账户并生成 API 密钥。
2) 将其存储在配置中，或在网关环境中设置 `FIRECRAWL_API_KEY`。

## 配置 Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        firecrawl: {
          apiKey: "FIRECRAWL_API_KEY_HERE",
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 172800000,
          timeoutSeconds: 60
        }
      }
    }
  }
}
```

注意事项：
- 当存在 API 密钥时，`firecrawl.enabled` 默认为 true。
- `maxAgeMs` 控制缓存结果的最旧时间（以毫秒为单位）。默认值为 2 天。

## 隐蔽模式/规避机器人检测

Firecrawl 提供了一个用于规避机器人检测的 **代理模式** 参数（`basic`、`stealth` 或 `auto`）。
OpenClaw 在向 Firecrawl 发出请求时始终使用 `proxy: "auto"` 加上 `storeInCache: true`。
如果未指定代理，Firecrawl 默认使用 `auto`。如果基本尝试失败，`auto` 会使用隐蔽代理重试，而这可能会比仅使用基本模式抓取消耗更多额度。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 的提取顺序如下：
1) Readability（本地）
2) Firecrawl（若已配置）
3) 基本 HTML 清理（最后的后备方案）

有关完整的网络工具设置，请参阅 [网络工具](/tools/web)。
