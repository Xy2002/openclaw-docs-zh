---
summary: Gateway dashboard (Control UI) access and auth
read_when:
  - Changing dashboard authentication or exposure modes
---
# 仪表板（控制界面）

网关仪表板默认在 `/` 上提供浏览器控制 UI（可通过 `gateway.controlUi.basePath` 覆盖）。

本地网关快速打开：

- http://127.0.0.1:18789/（或 http://localhost:18789/）

关键参考：

- [控制 UI](/web/control-ui) 提供使用说明和 UI 功能。
- [Tailscale](/gateway/tailscale) 提供 Serve/Funnel 自动化信息。
- [Web 表面](/web) 提供绑定模式和安全注意事项。

在通过 WebSocket 握手进行身份验证时，强制执行`connect.params.auth`（令牌或密码）。有关详细信息，请参阅[网关配置](/gateway/configuration)中的`gateway.auth`。

安全提示：控制 UI 是一个**管理员界面**，用于聊天、配置和执行审批。请勿将其公开暴露。首次加载后，UI 会将令牌存储在 `localStorage` 中。建议使用本地主机、Tailscale Serve 或 SSH 隧道。

## 快速路径（推荐）

- 完成初始设置后，CLI 现会自动使用您的令牌打开仪表板，并打印包含该令牌的相同链接。
- 随时重新打开：`openclaw dashboard`（复制链接，如果可能则在浏览器中打开；在无头模式下显示 SSH 提示）。
- 令牌仅本地存储为查询参数；UI 在首次加载后会移除令牌，并将其保存在 localStorage 中。

## 令牌基础（本地与远程）

- **本地主机**：打开 `http://127.0.0.1:18789/`。如果显示“未授权”，请运行 `openclaw dashboard` 并使用带令牌的链接 (`?token=...`)。
- **令牌来源**：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）；UI 在首次加载后会存储该令牌。
- **非本地主机**：使用 Tailscale Serve（若为 `gateway.auth.allowTailscale: true`，则无需令牌）、带有令牌的 tailnet 绑定，或 SSH 隧道。更多信息请参见 [Web 表面](/web)。

## 如果看到“未授权”/1008

- 运行 `openclaw dashboard` 获取新的带令牌链接。
- 确保网关可访问（本地：`openclaw status`；远程：先通过 SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/?token=...`)。
- 在仪表板设置中，粘贴您在 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）中配置的相同令牌。
