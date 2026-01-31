---
summary: 'Gateway web surfaces: Control UI, bind modes, and security'
read_when:
  - You want to access the Gateway over Tailscale
  - You want the browser Control UI and config editing
---
# 网页（网关）

网关通过与网关 WebSocket 相同的端口提供一个小型 **浏览器控制 UI**（Vite + Lit）：

- 默认：`http://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

功能位于 [控制 UI](/web/control-ui) 中。本页面重点介绍绑定模式、安全性以及面向 Web 的界面。

## Webhook

当 `hooks.enabled=true` 时，网关还会在同一 HTTP 服务器上公开一个小型 webhook 端点。有关身份验证和有效载荷，请参阅 [网关配置](/gateway/configuration) → `hooks`。

## 配置（默认启用）

在存在资产的情况下，控制 UI **默认启用**（`dist/control-ui`）。您可以通过配置对其进行控制：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" } // basePath optional
  }
}
```

## Tailscale 访问

### 集成 Serve（推荐）

将网关保留在环回地址上，并让 Tailscale Serve 代理它：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" }
  }
}
```

然后启动网关：

```bash
openclaw gateway
```

打开：
- `https://<magicdns>/`（或您配置的 `gateway.controlUi.basePath`）

### Tailnet 绑定 + 令牌

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" }
  }
}
```

然后启动网关（非环回绑定需要令牌）：

```bash
openclaw gateway
```

打开：
- `http://<tailscale-ip>:18789/`（或您配置的 `gateway.controlUi.basePath`）

### 公共互联网（漏斗）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" } // or OPENCLAW_GATEWAY_PASSWORD
  }
}
```

## 安全注意事项

- 默认情况下需要网关身份验证（令牌/密码或 Tailscale 身份标头）。
- 非环回绑定仍然 **需要** 共享令牌/密码（`gateway.auth` 或环境变量）。
- 向导默认会生成网关令牌（即使在环回地址上）。
- UI 发送 `connect.params.auth.token` 或 `connect.params.auth.password`。
- 使用 Serve 时，Tailscale 身份标头可以在 `gateway.auth.allowTailscale` 为 `true` 时满足身份验证要求（无需令牌/密码）。设置 `gateway.auth.allowTailscale: false` 以要求显式凭据。请参阅 [Tailscale](/gateway/tailscale) 和 [安全](/gateway/security)。
- `gateway.tailscale.mode: "funnel"` 需要 `gateway.auth.mode: "password"`（共享密码）。

## 构建 UI

网关从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：

```bash
pnpm ui:build # auto-installs UI deps on first run
```
