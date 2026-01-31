---
summary: 'Per-agent sandbox + tool restrictions, precedence, and examples'
title: Multi-Agent Sandbox & Tools
read_when: >-
  You want per-agent sandboxing or per-agent tool allow/deny policies in a
  multi-agent gateway.
status: active
---
# 多智能体沙盒与工具配置

## 概述

在多智能体设置中，每个智能体现在可以拥有自己的：
- **沙盒配置**（`agents.list[].sandbox` 优先于 `agents.defaults.sandbox`）
- **工具限制**（`tools.allow` / `tools.deny`，以及 `agents.list[].tools`）

这使您能够以不同的安全配置运行多个智能体：
- 具有完全访问权限的个人助理
- 工具受限的家庭或工作智能体
- 运行在沙盒中的面向公众的智能体

`setupCommand` 属于 `sandbox.docker`（全局或按智能体），并在容器创建时运行一次。

身份验证是按智能体进行的：每个智能体从其自身的 `agentDir` 身份验证存储中读取，路径为：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

智能体之间**不共享**凭据。请勿在不同智能体之间重复使用 `agentDir`。如果需要共享凭据，请将 `auth-profiles.json` 复制到另一智能体的 `agentDir` 中。

有关沙盒在运行时的行为，请参阅 [沙盒](/gateway/sandboxing)。有关调试“为什么被阻止？”的问题，请参阅 [沙盒 vs 工具策略 vs 提升权限](/gateway/sandbox-vs-tool-policy-vs-elevated) 和 `openclaw sandbox explain`。

---

## 配置示例

### 示例 1：个人助理 + 受限家庭智能体

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**结果：**
- `main` 智能体：在主机上运行，可使用所有工具
- `family` 智能体：在 Docker 中运行（每个智能体一个容器），仅可使用 `read` 工具

---

### 示例 2：共享沙盒的工作智能体

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### 示例 2b：全局编码配置 + 仅消息传递智能体

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**结果：**
- 默认智能体获得编码工具
- `support` 智能体仅用于消息传递（并包含 Slack 工具）

---

### 示例 3：按智能体使用不同的沙盒模式

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main",  // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off"  // Override: main never sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all",  // Override: public always sandboxed
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## 配置优先级

当同时存在全局 (`agents.defaults.*`) 和智能体特定 (`agents.list[].*`) 配置时：

### 沙盒配置
智能体特定设置优先于全局设置：
```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**注意事项：**
- `agents.list[].sandbox.{docker,browser,prune}.*` 优先于 `agents.defaults.sandbox.{docker,browser,prune}.*`，适用于该智能体（当沙盒范围解析为 `"shared"` 时则忽略）。

### 工具限制
过滤顺序如下：
1. **工具配置文件**（`tools.profile` 或 `agents.list[].tools.profile`）
2. **提供商工具配置文件**（`tools.byProvider[provider].profile` 或 `agents.list[].tools.byProvider[provider].profile`）
3. **全球工具政策**（`tools.allow` / `tools.deny`）
4. **提供商工具政策**（`tools.byProvider[provider].allow/deny`）
5. **智能体特定工具政策**（`agents.list[].tools.allow/deny`）
6. **智能体提供商政策**（`agents.list[].tools.byProvider[provider].allow/deny`）
7. **沙盒工具政策**（`tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`）
8. **子智能体工具政策**（`tools.subagents.tools`，如适用）

每一层都可以进一步限制工具，但不能恢复先前层次中被拒绝的工具。如果设置了 `agents.list[].tools.sandbox.tools`，它将取代该智能体的 `tools.sandbox.tools`。如果设置了 `agents.list[].tools.profile`，它将覆盖该智能体的 `tools.profile`。提供商工具密钥接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.2`）。

### 工具组（简写）

工具政策（全球、智能体、沙盒）支持 `group:*` 条目，这些条目会扩展为多个具体工具：

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 所有内置 OpenClaw 工具（不包括提供商插件）

### 提升模式
`tools.elevated` 是全局基线（基于发送者的白名单）。`agents.list[].tools.elevated` 可以进一步限制特定智能体的提升权限（两者都必须允许）。

缓解模式：
- 对不受信任的智能体拒绝 `exec`（`agents.list[].tools.deny: ["exec"]`）
- 避免对路由到受限智能体的发送者进行白名单处理
- 如果只想进行沙盒执行，则在全球范围内禁用提升权限（`tools.elevated.enabled: false`）
- 对敏感配置的智能体禁用提升权限（`agents.list[].tools.elevated.enabled: false`）

---

## 从单智能体迁移

**之前（单智能体）：**
```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**之后（多智能体，具有不同配置文件）：**
```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

旧版 `agent.*` 配置由 `openclaw doctor` 迁移；今后应优先使用 `agents.defaults` + `agents.list`。

---

## 工具限制示例

### 只读智能体
```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### 安全执行智能体（无文件修改）
```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### 仅通信智能体
```json
{
  "tools": {
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

---

## 常见陷阱：“非主”

`agents.defaults.sandbox.mode: "non-main"` 基于 `session.mainKey`（默认 `"main"`），而不是智能体 ID。群组/频道会话始终拥有自己的密钥，因此被视为非主，并将被置于沙盒中。如果您希望某个智能体永远不被置于沙盒中，请设置 `agents.list[].sandbox.mode: "off"`。

---

## 测试

在配置多智能体沙盒和工具后：

1. **检查智能体解析：**
   ```exec
   openclaw agents list --bindings
   ```

2. **验证沙盒容器：**
   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **测试工具限制：**
   - 发送一条需要受限工具的消息
   - 验证智能体无法使用被拒绝的工具

4. **监控日志：**
   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## 故障排除

### 尽管设置了 `mode: "all"`，智能体仍未被置于沙盒中
- 检查是否存在覆盖它的全局 `agents.defaults.sandbox.mode`
- 智能体特定配置优先，因此请设置 `agents.list[].sandbox.mode: "all"`

### 尽管有拒绝列表，工具仍然可用
- 检查工具过滤顺序：全局 → 智能体 → 沙盒 → 子智能体
- 每一层只能进一步限制，不能恢复
- 通过日志进行验证：`[tools] filtering tools for agent:${agentId}`

### 每个智能体的容器未隔离
- 在智能体特定的沙盒配置中设置 `scope: "agent"`
- 默认设置为 `"session"`，即每个会话创建一个容器

---

## 参见

- [多智能体路由](/concepts/multi-agent)
- [沙盒配置](/gateway/configuration#agentsdefaults-sandbox)
- [会话管理](/concepts/session)
