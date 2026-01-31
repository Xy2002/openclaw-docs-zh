---
title: Sandbox CLI
summary: Manage sandbox containers and inspect effective sandbox policy
read_when: You are managing sandbox containers or debugging sandbox/tool-policy behavior.
status: active
---
# 沙盒 CLI

管理基于 Docker 的沙盒容器，以实现隔离的代理执行。

## 概述

OpenClaw 可以在隔离的 Docker 容器中运行代理，以提高安全性。`sandbox` 命令可帮助您管理这些容器，尤其是在更新或配置更改之后。

## 命令

### `openclaw sandbox explain`

检查**有效**的沙盒模式/范围/工作区访问权限、沙盒工具策略以及提升的门控（包含修复配置密钥路径）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

列出所有沙盒容器及其状态和配置。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**输出内容包括：**
- 容器名称和状态（运行中/已停止）
- Docker 镜像以及是否与配置匹配
- 年龄（自创建以来的时间）
- 空闲时间（自上次使用以来的时间）
- 关联的会话/代理

### `openclaw sandbox recreate`

移除沙盒容器，以强制使用更新的镜像/配置重新创建容器。

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**选项：**
- `--all`：重新创建所有沙盒容器
- `--session <key>`：为特定会话重新创建容器
- `--agent <id>`：为特定代理重新创建容器
- `--browser`：仅重新创建浏览器容器
- `--force`：跳过确认提示

**重要提示：** 当代理下次被使用时，容器会自动重新创建。

## 使用场景

### 更新 Docker 镜像后

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### 更改沙盒配置后

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### 更改 setupCommand 后

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```


### 仅针对特定代理

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## 为什么需要这样做？

**问题：** 当您更新沙盒 Docker 镜像或配置时：
- 现有容器仍使用旧设置运行
- 容器仅在不活动 24 小时后才会被清理
- 经常使用的代理会无限期地继续运行旧容器

**解决方案：** 使用 `openclaw sandbox recreate` 强制移除旧容器。当下次需要时，它们将自动使用当前设置重新创建。

提示：相比手动 `docker rm`，更推荐使用 `openclaw sandbox recreate`。它使用网关的容器命名规则，并在范围/会话密钥发生变化时避免出现不匹配。

## 配置

沙盒设置位于 `~/.openclaw/openclaw.json` 下的 `agents.defaults.sandbox` 中（每代理覆盖设置位于 `agents.list[].sandbox` 中）：

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all",                    // off, non-main, all
        "scope": "agent",                 // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-"
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24,               // Auto-prune after 24h idle
          "maxAgeDays": 7                // Auto-prune after 7 days
        }
      }
    }
  }
}
```

## 参见

- [沙盒文档](/gateway/sandboxing)
- [代理配置](/concepts/agent-workspace)
- [Doctor 命令](/gateway/doctor) - 检查沙盒设置
