---
summary: CLI reference for `openclaw webhooks` (webhook helpers + Gmail Pub/Sub)
read_when:
  - You want to wire Gmail Pub/Sub events into OpenClaw
  - You want webhook helper commands
---
# `openclaw webhooks`

Webhook助手与集成（Gmail Pub/Sub，Webhook助手）。

相关：
- Webhooks：[Webhook](/automation/webhook)
- Gmail Pub/Sub：[Gmail Pub/Sub](/automation/gmail-pubsub)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

详情请参阅[Gmail Pub/Sub文档](/automation/gmail-pubsub)。
