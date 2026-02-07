---
summary: Integrated Tailscale Serve/Funnel for the Gateway dashboard
read_when:
  - Exposing the Gateway Control UI outside localhost
  - Automating tailnet or public dashboard access
---
__HEADING_0__Tailscale（网关仪表板）

OpenClaw 可以为网关仪表板和 WebSocket 端口自动配置 Tailscale 的“Serve”（尾网）或“Funnel”（公共）模式。这样一来，网关始终绑定到环回地址，而 Tailscale 则负责提供 HTTPS、路由，以及（对于 Serve 模式）身份标头。

## 模式

- `serve`：仅通过 `tailscale serve` 使用尾网的 Serve 模式。网关仍绑定在 `127.0.0.1` 上。
- `funnel`：通过 `tailscale funnel` 提供公共 HTTPS。OpenClaw 需要共享密码。
- `off`：默认设置（不启用 Tailscale 自动化）。

## 身份验证

通过设置 `gateway.auth.mode` 来控制握手：

- `token`（当 `OPENCLAW_GATEWAY_TOKEN` 设置时为默认值）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置文件共享密钥）

当 `tailscale.mode = "serve"` 和 `gateway.auth.allowTailscale` 设置为 `true` 时，有效的 Serve 代理请求可以通过 Tailscale 身份标头（`tailscale-user-login`）进行身份验证，而无需提供令牌或密码。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）解析 `x-forwarded-for` 地址，并将其与标头中的地址进行匹配，从而验证身份并接受请求。只有当请求来自环回地址且带有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 标头时，OpenClaw 才会将其视为 Serve 请求。若需明确要求凭据，请设置 `gateway.auth.allowTailscale: false` 或强制启用 `gateway.auth.mode: "password"`。

## 配置示例

### 仅尾网（发球）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" }
  }
}
```

打开：`https://<magicdns>/`（或您配置的 `gateway.controlUi.basePath`）

### 仅尾网（绑定到尾网 IP）

当您希望网关直接监听尾网 IP 时使用此配置（无 Serve/Funnel）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" }
  }
}
```

从另一台尾网设备连接：

- 控制 UI：`http://<tailscale-ip>:18789/`
- WebSocket：`ws://<tailscale-ip>:18789`

注意：在此模式下，环回（`http://127.0.0.1:18789`）将**无法**工作。

### 公共互联网（漏斗 + 共享密码）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" }
  }
}
```

建议使用 `OPENCLAW_GATEWAY_PASSWORD`，而非将密码写入磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意事项

- Tailscale Serve/Funnel 需要安装并登录 `tailscale`CLI。
- `tailscale.mode: "funnel"` 在未设置为 `password` 的身份验证模式时将拒绝启动，以避免公开暴露。
- 如果您希望 OpenClaw 在关闭时撤销 `tailscale serve` 或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- `gateway.bind: "tailnet"` 是直接绑定到尾网（无 HTTPS，无 Serve/Funnel）。
- `gateway.bind: "auto"` 优先使用环回；如果您只想使用尾网，请使用 `tailnet`。
- Serve/Funnel 仅暴露 **网关控制 UI + WS**。节点通过相同的网关 WS 端点连接，因此 Serve 可用于节点访问。

## 浏览器控制（远程网关 + 本地浏览器）

如果网关运行在一台机器上，而您想在另一台机器上使用浏览器进行操作，可以在浏览器所在的机器上运行一个“节点主机”，并确保两台机器位于同一子网中。网关会将浏览器的操作代理到节点上，因此无需单独的控制服务器或 Serve URL。

对于浏览器控制，应避免使用漏斗；节点配置应被视为操作员访问。

__HEADING_0__Tailscale 前提条件与限制

- Serve 要求您的尾网已启用 HTTPS；如果未启用，CLI 会向您发出提示。
- Serve 会注入 Tailscale 身份标头；而 Funnel 不会。
- Funnel 要求 Tailscale 版本 1.38.3 或更高，且必须支持 MagicDNS、已启用 HTTPS，并具备漏斗节点属性。
- Funnel 仅支持通过 TLS 的 `443`、`8443` 和 `10000` 端口。
- 在 macOS 上，Funnel 需要使用开源的 Tailscale 应用变体。

## 了解更多信息

- Tailscale Serve 概述：https://tailscale.com/kb/1312/serve
- `tailscale serve` 命令：https://tailscale.com/kb/1242/tailscale-serve
- Tailscale Funnel 概述：https://tailscale.com/kb/1223/tailscale-funnel
- `tailscale funnel` 命令：https://tailscale.com/kb/1311/tailscale-funnel
