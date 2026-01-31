---
summary: Retry policy for outbound provider calls
read_when:
  - Updating provider retry behavior or defaults
  - Debugging provider send errors or rate limits
---
# 重试策略

## 目标
- 按单个 HTTP 请求进行重试，而非按多步骤流程整体重试。
- 仅重试当前步骤，以保持操作顺序。
- 避免重复执行非幂等操作。

## 默认设置
- 重试次数：3
- 最大延迟上限：30000 毫秒
- 随机抖动：0.1（10%）
- 各提供商默认值：
  - Telegram 最小延迟：400 毫秒
  - Discord 最小延迟：500 毫秒

## 行为
### Discord
- 仅在遇到限流错误（HTTP 429）时重试。
- 在可用的情况下使用 Discord `retry_after`，否则采用指数退避策略。

### Telegram
- 在出现瞬态错误（429、超时、连接/重置/关闭、暂时不可用）时重试。
- 在可用的情况下使用 `retry_after`，否则采用指数退避策略。
- Markdown 解析错误不会触发重试；此类错误会回退到纯文本处理。

## 配置
在 `~/.openclaw/openclaw.json` 中为每个提供商单独设置重试策略：

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1
      }
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1
      }
    }
  }
}
```

## 备注
- 重试是针对单个请求的（如发送消息、上传媒体、添加反应、创建投票、发送贴纸）。
- 对于复合流程，已完成的步骤不会被重试。
