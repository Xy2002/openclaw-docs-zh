---
summary: CLI reference for `openclaw onboard` (interactive onboarding wizard)
read_when:
  - 'You want guided setup for gateway, workspace, auth, channels, and skills'
---
# `openclaw onboard`

交互式引导向导（本地或远程网关设置）。

相关：
- 向导指南：[引导](/start/onboarding)

## 示例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url ws://gateway-host:18789
```

流程说明：
- `quickstart`：最少提示，自动生成网关令牌。
- `manual`：提供完整的端口/绑定/认证提示（`advanced`的别名）。
- 最快首次聊天：`openclaw dashboard`（控制 UI，无需频道设置）。
