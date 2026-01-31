---
summary: CLI reference for `openclaw dns` (wide-area discovery helpers)
read_when:
  - You want wide-area discovery (DNS-SD) via Tailscale + CoreDNS
  - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
---
# `openclaw dns`

用于广域发现的 DNS 助手（Tailscale + CoreDNS）。目前专注于 macOS + Homebrew CoreDNS。

相关：
- 网关发现：[发现](/gateway/discovery)
- 广域发现配置：[配置](/gateway/configuration)

## 设置

```bash
openclaw dns setup
openclaw dns setup --apply
```
