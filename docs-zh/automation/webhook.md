---
summary: Webhook ingress for wake and isolated agent runs
read_when:
  - Adding or changing webhook endpoints
  - Wiring external systems into OpenClaw
---
# Webhook

网关可公开一个小型 HTTP Webhook 端点，以供外部触发使用。

## 启用

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks"
  }
}
```

注意事项：
- 当启用 `hooks.enabled=true` 时，需要 `hooks.token`。
- 默认情况下，`hooks.path` 设置为 `/hooks`。

## 认证

每个请求都必须包含 hook 令牌。建议优先使用标头：
- `Authorization: Bearer <token>`（推荐）
- `x-openclaw-token: <token>`
- `?token=<token>`（已弃用；会记录警告，并将在未来的重大版本中移除）

## 端点

### `POST /hooks/wake`

有效载荷：
```json
{ "text": "System line", "mode": "now" }
```

- `text` **必填**（字符串）：事件的描述（例如，“收到新邮件”）。
- `mode` 可选（`now` | `next-heartbeat`）：是否立即触发心跳（默认为 `now`），或等待下一次定期检查。

效果：
- 将系统事件加入 **主** 会话的队列
- 如果启用 `mode=now`，则立即触发心跳

### `POST /hooks/agent`

有效载荷：
```json
{
  "message": "Run this",
  "name": "Email",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+15551234567",
  "model": "openai/gpt-5.2-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

- `message` **必填**（字符串）：代理要处理的提示或消息。
- `name` 可选（字符串）：钩子的人类可读名称（例如，“GitHub”），用作会话摘要中的前缀。
- `sessionKey` 可选（字符串）：用于标识代理会话的密钥。默认为随机生成的 `hook:<uuid>`。使用一致的密钥可在钩子上下文中实现多轮对话。
- `wakeMode` 可选（`now` | `next-heartbeat`）：是否立即触发心跳（默认为 `now`），或等待下一次定期检查。
- `deliver` 可选（布尔值）：如果启用 `true`，代理的响应将被发送到消息通道。默认为 `true`。仅作为心跳确认的响应会自动跳过。
- `channel` 可选（字符串）：用于传递消息的通道。可选通道包括：`last`、`whatsapp`、`telegram`、`discord`、`slack`、`mattermost`（插件）、`signal`、`imessage`、`msteams`。默认为 `last`。
- `to` 可选（字符串）：通道的接收方标识符（例如，WhatsApp/Signal 的电话号码，Telegram 的聊天 ID，Discord/Slack/Mattermost（插件）的频道 ID，MS Teams 的对话 ID）。默认为主会话中最后一位接收方。
- `model` 可选（字符串）：模型覆盖（例如，`anthropic/claude-3-5-sonnet` 或别名）。如果有限制，则必须在允许的模型列表中。
- `thinking` 可选（字符串）：思维层级覆盖（例如，`low`、`medium`、`high`）。
- `timeoutSeconds` 可选（数字）：代理运行的最大持续时间（以秒为单位）。

效果：
- 运行一个 **隔离** 的代理回合（独立会话密钥）
- 始终将摘要发布到 **主** 会话
- 如果启用 `wakeMode=now`，则立即触发心跳

### `POST /hooks/<name>`（映射）

自定义钩子名称通过 `hooks.mappings` 解析（参见配置）。映射可以将任意有效载荷转换为 `wake` 或 `agent` 操作，并可选择使用模板或代码转换。

映射选项（概览）：
- `hooks.presets: ["gmail"]` 启用内置的 Gmail 映射。
- `hooks.mappings` 允许您在配置中定义 `match`、`action` 和模板。
- `hooks.transformsDir` + `transform.module` 加载 JS/TS 模块以实现自定义逻辑。
- 使用 `match.source` 保留通用的摄入端点（基于有效载荷的路由）。
- TS 转换需要 TS 加载器（例如，`bun` 或 `tsx`）或在运行时预编译的 `.js`。
- 对映射设置 `deliver: true` + `channel`/`to`，以将回复路由到聊天界面
  （`channel` 默认为 `last`，并回退到 WhatsApp）。
- `allowUnsafeExternalContent: true` 为该钩子禁用外部内容安全封装
  （危险；仅适用于受信任的内部来源）。
- `openclaw webhooks gmail setup` 为 `openclaw webhooks gmail run` 写入 `hooks.gmail` 配置。
有关完整的 Gmail 监视流程，请参阅 [Gmail Pub/Sub](/automation/gmail-pubsub)。

## 响应

- `200` 表示成功处理 `/hooks/wake`
- `202` 表示异步运行已启动 `/hooks/agent`
- `401` 表示认证失败
- `400` 表示无效有效载荷
- `413` 表示有效载荷过大

## 示例

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","wakeMode":"next-heartbeat"}'
```

### 使用不同的模型

在代理有效载荷（或映射）中添加 `model`，以覆盖该次运行的模型：

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.2-mini"}'
```

如果您强制执行 `agents.defaults.models`，请确保覆盖模型包含在其中。

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## 安全性

- 将钩子端点置于环回、尾网或受信任的反向代理之后。
- 使用专用的钩子令牌；不要重复使用网关认证令牌。
- 避免在 Webhook 日志中包含敏感的原始有效载荷。
- 钩子有效载荷默认被视为不受信任，并被安全边界包裹。如果您必须为特定钩子禁用此功能，请在该钩子的映射中设置 `allowUnsafeExternalContent: true`（危险）。
