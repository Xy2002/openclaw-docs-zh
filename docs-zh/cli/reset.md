---
summary: CLI reference for `openclaw reset` (reset local state/config)
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
---
# `openclaw reset`

重置本地配置/状态（保留已安装的 CLI）。

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config+creds+sessions --yes --non-interactive
```
