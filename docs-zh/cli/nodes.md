---
summary: >-
  CLI reference for `openclaw nodes` (list/status/approve/invoke,
  camera/canvas/screen)
read_when:
  - 'You’re managing paired nodes (cameras, screen, canvas)'
  - You need to approve requests or invoke node commands
---
# `openclaw nodes`

管理配对节点（设备）并调用节点功能。

相关：
- 节点概览：[节点](/nodes)
- 摄像头：[相机节点](/nodes/camera)
- 图像：[图像节点](/nodes/images)

常用选项：
- `--url`, __ INLINE_CODE_4__, `--timeout`, `--json`

## 常用命令

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 用于打印待处理/已配对表。配对行包含最近一次连接时间（Last Connect）。
使用 `--connected` 只显示当前已连接的节点。使用 `--last-connected <duration>` 可以筛选在特定时间段内连接的节点（例如 `24h`, `7d`）。

## 调用/运行

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
openclaw nodes run --node <id|name|ip> <command...>
openclaw nodes run --raw "git status"
openclaw nodes run --agent main --node <id|name|ip> --raw "git status"
```

调用标志：
- `--params <json>`: JSON 对象字符串（默认为 `{}`）。
- `--invoke-timeout <ms>`: 节点调用超时时间（默认为 `15000`）。
- `--idempotency-key <key>`: 可选的幂等键。

### Exec 风格的默认设置

`nodes run` 复制了模型的 exec 行为（默认值 + 审批）：

- 读取 `tools.exec.*`（加上 `agents.list[].tools.exec.*` 的覆盖）。
- 在调用 `system.run` 之前，先使用 exec 审批（`exec.approval.request`）。
- 当设置了 `tools.exec.node` 时，可以省略 `--node`。
- 需要一个声明了 `system.run` 的节点（macOS 伴侣应用或无头节点主机）。

标志：
- `--cwd <path>`: 工作目录。
- `--env <key=val>`: 环境变量覆盖（可重复）。
- `--command-timeout <ms>`: 命令超时时间。
- `--invoke-timeout <ms>`: 节点调用超时时间（默认为 `30000`）。
- `--needs-screen-recording`: 要求屏幕录制权限。
- `--raw <command>`: 运行 shell 字符串（`/bin/sh -lc` 或 `cmd.exe /c`）。
- `--agent <id>`: 代理范围内的审批/白名单（默认为配置的代理）。
- `--ask <off|on-miss|always>`, `--security <deny|allowlist|full>`: 覆盖设置。
