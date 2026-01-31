---
summary: CLI reference for `openclaw logs` (tail gateway logs via RPC)
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
---
# `openclaw logs`

通过 RPC 记录网关文件日志（在远程模式下工作）。

相关：
- 日志概述：[日志](/logging)

## 示例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
```
