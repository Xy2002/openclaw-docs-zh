---
summary: >-
  Expose an OpenResponses-compatible /v1/responses HTTP endpoint from the
  Gateway
read_when:
  - Integrating clients that speak the OpenResponses API
  - 'You want item-based inputs, client tool calls, or SSE events'
---
# OpenResponses API（HTTP）

OpenClaw 的网关可以提供与 OpenResponses 兼容的 `POST /v1/responses` 端点。

此端点默认处于**禁用状态**。请先在配置中将其启用。

- `POST /v1/responses`
- 与网关使用相同端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/responses`

在底层，请求会作为普通的网关代理运行来执行（与 `openclaw agent` 使用相同的代码路径），因此路由/权限/配置与您的网关保持一致。

## 身份验证

使用网关的身份验证配置。发送一个 Bearer 令牌：

- `Authorization: Bearer <token>`

注意事项：
- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。

## 选择代理

无需自定义标头：将代理 ID 编码到 OpenResponses 的 `model` 字段中：

- `model: "openclaw:<agentId>"`（示例：`"openclaw:main"`, `"openclaw:beta"`）
- `model: "agent:<agentId>"`（别名）

或者通过标头指定特定的 OpenClaw 代理：

- `x-openclaw-agent-id: <agentId>`（默认：`main`）

高级选项：
- `x-openclaw-session-key: <sessionKey>` 可用于完全控制会话路由。

## 启用端点

将 `gateway.http.endpoints.responses.enabled` 设置为 `true`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true }
      }
    }
  }
}
```

## 禁用端点

将 `gateway.http.endpoints.responses.enabled` 设置为 `false`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: false }
      }
    }
  }
}
```

## 会话行为

默认情况下，该端点是**每个请求无状态的**（每次调用都会生成一个新的会话密钥）。

如果请求包含 OpenResponses 的 `user` 字符串，网关会从中派生出一个稳定的会话密钥，因此重复调用可以共享同一个代理会话。

## 请求格式（支持）

请求遵循 OpenResponses API，并采用基于项目的输入。当前支持的功能包括：

- `input`：字符串或项目对象数组。
- `instructions`：合并到系统提示中。
- `tools`：客户端工具定义（函数工具）。
- `tool_choice`：筛选或要求客户端工具。
- `stream`：启用 SSE 流式传输。
- `max_output_tokens`：尽力而为的输出限制（取决于提供商）。
- `user`：稳定的会话路由。

以下内容被接受但**目前被忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## 项目（输入）

### `message`
角色：`system`, `developer`, `user`, `assistant`。

- `system` 和 `developer` 会被附加到系统提示中。
- 最近的 `user` 或 `function_call_output` 项目将成为“当前消息”。
- 较早的用户/助手消息会被纳入上下文历史中。

### `function_call_output`（基于回合的工具）

将工具结果返回给模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

为兼容性目的被接受，但在构建提示时会被忽略。

## 工具（客户端函数工具）

通过 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果代理决定调用某个工具，响应会返回一个 `function_call` 输出项。然后您可以通过 `function_call_output` 发送后续请求以继续该回合。

## 图片（`input_image`）

支持 base64 或 URL 源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

当前允许的 MIME 类型：`image/jpeg`, `image/png`, `image/gif`, `image/webp`。
当前最大尺寸：10MB。

## 文件（`input_file`）

支持 base64 或 URL 源：

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

当前允许的 MIME 类型：`text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`。

当前最大尺寸：5MB。

当前行为：
- 文件内容会被解码并添加到**系统提示**中，而不是用户消息中，因此它只是一次性的（不会保存在会话历史中）。
- PDF 文件会被解析以提取文本。如果发现的文本很少，则前几页会被光栅化成图像并传递给模型。

PDF 解析使用对 Node 友好的 `pdfjs-dist` 旧版构建（无需 worker）。现代的 PDF.js 构建需要浏览器 worker/DOM 全局变量，因此未在网关中使用。

URL 获取的默认设置：
- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- 请求受到保护（DNS 解析、私有 IP 阻止、重定向限制、超时）。

## 文件和图片限制（配置）

默认值可在 `gateway.http.endpoints.responses` 下进行调整：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          files: {
            allowUrl: true,
            allowedMimes: ["text/plain", "text/markdown", "text/html", "text/csv", "application/json", "application/pdf"],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200
            }
          },
          images: {
            allowUrl: true,
            allowedMimes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000
          }
        }
      }
    }
  }
}
```

省略时的默认值：
- `maxBodyBytes`: 20MB
- `files.maxBytes`: 5MB
- `files.maxChars`: 20万
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10秒
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10秒

## 流式传输（SSE）

设置 `stream: true` 以接收服务器发送事件（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行都是 `event: <type>` 和 `data: <json>`
- 流以 `data: [DONE]` 结束

当前发出的事件类型：
- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`（发生错误时）

## 使用情况

当底层提供商报告令牌计数时，`usage` 会被填充。

## 错误

错误使用如下 JSON 对象：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况：
- `401` 缺失或无效的身份验证
- `400` 无效的请求体
- `405` 方法错误

## 示例

非流式传输：
```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

流式传输：
```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```
