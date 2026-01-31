---
summary: 'Browser-based control UI for the Gateway (chat, nodes, config)'
read_when:
  - You want to operate the Gateway from a browser
  - You want Tailnet access without SSH tunnels
---
# 控制 UI（浏览器）

控制 UI 是一个由网关提供服务的小型 **Vite + Lit** 单页应用：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

它在同一端口上**直接与网关 WebSocket 通信**。

## 本地快速打开

如果网关运行在本地计算机上，打开：

- http://127.0.0.1:18789/（或 http://localhost:18789/）

如果页面无法加载，请先启动网关：`openclaw gateway`。

身份验证通过以下方式在 WebSocket 握手期间提供：
- `connect.params.auth.token`
- `connect.params.auth.password`
仪表板设置面板允许您存储令牌；密码不会被持久化。
首次连接时，引导向导会默认生成网关令牌，请在此处粘贴该令牌。

## 当前功能
- 通过网关 WS 与模型聊天（`chat.history`、`chat.send`、`chat.abort`、`chat.inject`）
- 在聊天中流式传输工具调用和实时工具输出卡片（代理事件）
- 频道：WhatsApp/Telegram/Discord/Slack + 插件频道（Mattermost 等）状态 + QR 登录 + 每个频道的配置（`channels.status`、`web.login.*`、`config.patch`）
- 实例：在线列表 + 刷新（`system-presence`）
- 会话：列表 + 每会话的思考/详细模式覆盖（`sessions.list`、`sessions.patch`）
- 定时任务：列出/添加/运行/启用/禁用 + 运行历史（`cron.*`）
- 技能：状态、启用/禁用、安装、API 密钥更新（`skills.*`）
- 节点：列表 + 功能（`node.list`）
- 执行审批：编辑网关或节点白名单 + 请求 `exec host=gateway/node` 的策略（`exec.approvals.*`）
- 配置：查看/编辑 `~/.openclaw/openclaw.json`（`config.get`、`config.set`）
- 配置：应用并重启，同时进行验证（`config.apply`），并唤醒最近一次活跃会话
- 配置写入包含基础哈希保护，以防止并发编辑相互覆盖
- 配置模式 + 表单渲染（`config.schema`，包括插件和频道模式）；原始 JSON 编辑器仍然可用
- 调试：状态/健康/模型快照 + 事件日志 + 手动 RPC 调用（`status`、`health`、`models.list`）
- 日志：带有过滤和导出功能的网关文件日志实时尾部跟踪（`logs.tail`）
- 更新：运行包/Git 更新并重启（`update.run`），附带重启报告

## 聊天行为

- `chat.send` 是**非阻塞的**：它立即通过 `{ runId, status: "started" }` 确认，并通过 `chat` 事件流式传输响应。
- 使用相同的 `idempotencyKey` 重新发送，在运行时返回 `{ status: "in_flight" }`，完成后返回 `{ status: "ok" }`。
- `chat.inject` 将助手备注附加到会话记录中，并广播一个仅用于 UI 更新的 `chat` 事件（不运行代理，不传递到频道）。
- 停止：
  - 点击**停止**（调用 `chat.abort`）
  - 输入 `/stop`（或 `stop|esc|abort|wait|exit|interrupt`）以在带外终止
  - `chat.abort` 支持 `{ sessionKey }`（无 `runId`），可为该会话的所有活动运行终止

## Tailnet 访问（推荐）

### 集成 Tailscale Serve（首选）

将网关保留在环回地址上，并让 Tailscale Serve 通过 HTTPS 代理它：

```bash
openclaw gateway --tailscale serve
```

打开：
- `https://<magicdns>/`（或您配置的 `gateway.controlUi.basePath`）

默认情况下，Serve 请求可以通过 Tailscale 身份标头进行身份验证
（`tailscale-user-login`），当 `gateway.auth.allowTailscale` 设置为 `true` 时。OpenClaw 通过解析 `x-forwarded-for` 地址并与标头匹配来验证身份，并且仅在请求通过 Tailscale 的 `x-forwarded-*` 标头访问环回地址时才接受这些请求。如果您希望即使对于 Serve 流量也要求使用令牌/密码，请设置 `gateway.auth.allowTailscale: false`（或强制 `gateway.auth.mode: "password"`）。

### 绑定到 tailnet + 令牌

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

然后打开：
- `http://<tailscale-ip>:18789/`（或您配置的 `gateway.controlUi.basePath`）

将令牌粘贴到 UI 设置中（作为 `connect.params.auth.token` 发送）。

## 不安全的 HTTP

如果您通过普通 HTTP 打开仪表板（`http://<lan-ip>` 或 `http://<tailscale-ip>`），浏览器将在**非安全上下文**中运行，并阻止 WebCrypto。默认情况下，OpenClaw **会阻止**没有设备身份的控制 UI 连接。

**推荐修复方法**：使用 HTTPS（Tailscale Serve）或在本地打开 UI：
- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（在网关主机上）

**降级示例（仅令牌通过 HTTP）**：

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" }
  }
}
```

这会禁用控制 UI 的设备身份和配对（即使在 HTTPS 下）。仅在您信任网络时使用。

有关 HTTPS 设置指南，请参阅 [Tailscale](/gateway/tailscale)。

## 构建 UI

网关从 `dist/control-ui` 提供静态文件。使用以下命令构建：

```bash
pnpm ui:build # auto-installs UI deps on first run
```

可选绝对基址（当您需要固定的资产 URL 时）：

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

用于本地开发（单独的开发服务器）：

```bash
pnpm ui:dev # auto-installs UI deps on first run
```

然后将 UI 指向您的网关 WS URL（例如 `ws://127.0.0.1:18789`）。

## 调试/测试：开发服务器 + 远程网关

控制 UI 是静态文件；WebSocket 目标是可配置的，可以与 HTTP 源不同。当您希望本地运行 Vite 开发服务器，而网关运行在其他地方时，这一点非常方便。

1) 启动 UI 开发服务器：`pnpm ui:dev`
2) 打开类似以下的 URL：

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

可选一次性身份验证（如有需要）：

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789&token=<gateway-token>
```

注意事项：
- `gatewayUrl` 在加载后存储在 localStorage 中，并从 URL 中移除。
- `token` 存储在 localStorage 中；`password` 仅保存在内存中。
- 如果网关位于 TLS 之后（Tailscale Serve、HTTPS 代理等），请使用 `wss://`。

远程访问设置详情：[远程访问](/gateway/remote)。
