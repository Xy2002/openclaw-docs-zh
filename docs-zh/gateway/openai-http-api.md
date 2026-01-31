---
summary: >-
  Expose an OpenAI-compatible /v1/chat/completions HTTP endpoint from the
  Gateway
read_when:
  - Integrating tools that expect OpenAI Chat Completions
---
# OpenAI 聊天补全（HTTP）

OpenClaw 的网关可以提供一个小型的 OpenAI 兼容聊天补全端点。

此端点在默认情况下是__已禁用__的。请先在配置中将其启用。

- `POST /v1/chat/completions`
- 与网关使用相同端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/chat/completions`

在底层，请求以与普通网关代理运行相同的代码路径执行（与 `openclaw agent` 相同），因此路由、权限和配置与您的网关一致。

## 身份验证

使用网关的身份验证配置。发送 Bearer 令牌：

- `Authorization: Bearer <token>`

注意事项：
- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。

## 选择代理

无需自定义标头：将代理 ID 编码到 OpenAI 的 `model` 字段中：

- `model: "openclaw:<agentId>"`（示例：`"openclaw:main"`, `"openclaw:beta"`）
- `model: "agent:<agentId>"`（别名）

或者通过标头指定特定的 OpenClaw 代理：

- `x-openclaw-agent-id: <agentId>`（默认：`main`）

高级用法：
- 使用 `x-openclaw-session-key: <sessionKey>` 完全控制会话路由。

## 启用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `true`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true }
      }
    }
  }
}
```

## 禁用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设置为 `false`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false }
      }
    }
  }
}
```

## 会话行为

默认情况下，该端点是**每次请求无状态的**（每次调用都会生成一个新的会话密钥）。

如果请求包含 OpenAI 的 `user` 字符串，网关会从中派生出一个稳定的会话密钥，因此重复调用可以共享同一个代理会话。

## 流式传输（SSE）

设置 `stream: true` 以接收服务器发送事件（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行都是 `data: <json>`
- 流以 `data: [DONE]` 结束

## 示例

非流式传输：
```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式传输：
```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```
