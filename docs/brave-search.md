---
summary: Brave Search API setup for web_search
read_when:
  - You want to use Brave Search for web_search
  - You need a BRAVE_API_KEY or plan details
---
# 勇敢搜索 API

OpenClaw 默认使用 Brave Search 作为`web_search`的提供商。

## 获取 API 密钥

1) 在 https://brave.com/search/api/ 创建一个 Brave Search API 账户。
2) 在仪表板中，选择 **Data for Search** 方案并生成 API 密钥。
3) 将密钥存储在配置中（推荐），或在网关环境中设置 `BRAVE_API_KEY`。

## 配置示例

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
        timeoutSeconds: 30
      }
    }
  }
}
```

## 注意事项

- 适用于人工智能的数据方案与 `web_search` **不兼容**。
- Brave 提供免费层级和付费方案；请查看 Brave API 门户以了解当前的使用限制。

有关完整的 web_search 配置，请参阅 [Web 工具](/tools/web)。
