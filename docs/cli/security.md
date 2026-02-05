---
summary: CLI reference for `openclaw security` (audit and fix common security footguns)
read_when:
  - You want to run a quick security audit on config/state
  - 'You want to apply safe “fix” suggestions (chmod, tighten defaults)'
---
# `openclaw security`

安全工具（审计 + 可选修复）。

相关：

- 安全指南：[安全](/gateway/security)

## 审计

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
```

当多个DM发件人共享主会话时，审计会发出警告，并建议为共享收件箱使用`session.dmScope="per-channel-peer"`（或对于多账号频道使用`per-account-channel-peer`）。此外，当小型模型(`<=300B`)在未启用沙盒且启用了网络/浏览器工具的情况下使用时，审计也会发出警告。
