---
summary: 'CLI reference for `openclaw status` (diagnostics, probes, usage snapshots)'
read_when:
  - You want a quick diagnosis of channel health + recent session recipients
  - You want a pasteable “all” status for debugging
---
# `openclaw status`

通道与会话诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意事项：
- `--deep` 会运行实时探测（WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal）。
- 当配置了多个代理时，输出包含每个代理的会话存储。
- 概览在可用时包括网关和节点主机服务的安装/运行状态。
- 概览还包括更新通道和 git SHA（用于源代码检出）。
- 更新信息会显示在概览中；如果有可用更新，状态会提示运行 `openclaw update`（请参阅 [更新](/install/updating)）。
