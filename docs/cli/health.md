---
summary: CLI reference for `openclaw health` (gateway health endpoint via RPC)
read_when:
  - You want to quickly check the running Gateway’s health
---
从正在运行的网关获取健康信息。

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

注意事项：
- `--verbose` 会运行实时探测，并在配置了多个账户时打印每个账户的计时信息。
- 当配置了多个代理时，输出将包含每个代理的会话存储。
