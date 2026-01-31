---
summary: >-
  CLI reference for `openclaw approvals` (exec approvals for gateway or node
  hosts)
read_when:
  - You want to edit exec approvals from the CLI
  - You need to manage allowlists on gateway or node hosts
---
# `openclaw approvals`

管理**本地主机**、**网关主机**或**节点主机**的 Exec 审批。
默认情况下，命令会针对磁盘上的本地审批文件。使用 `--gateway` 可以针对网关，或使用 `--node` 来针对特定节点。

相关：
- Exec 审批：[Exec 审批](/tools/exec-approvals)
- 节点：[节点](/nodes)

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## 从文件替换审批

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## 允许列表助手

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 注意事项

- `--node` 使用与 `openclaw nodes` 相同的解析器（ID、名称、IP 或 ID 前缀）。
- `--agent` 默认为 `"*"`，适用于所有代理。
- 节点主机必须通告 `system.execApprovals.get/set`（macOS 应用程序或无头节点主机）。
- 审批文件按主机存储在 `~/.openclaw/exec-approvals.json` 中。
