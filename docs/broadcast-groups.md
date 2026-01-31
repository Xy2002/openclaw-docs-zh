---
summary: Broadcast a WhatsApp message to multiple agents
read_when:
  - Configuring broadcast groups
  - Debugging multi-agent replies in WhatsApp
status: experimental
---
# 广播群组

**状态：** 实验性  
**版本：** 添加于 2026.1.9

## 概述

广播群组允许多个代理同时处理并响应同一条消息。借助这一功能，您可以在单个 WhatsApp 群组或私信中创建协同工作的专业代理团队——所有这一切都通过一个电话号码完成。

当前适用范围：仅限 **WhatsApp**（Web 渠道）。

广播群组在通道白名单和群组激活规则之后进行评估。在 WhatsApp 群组中，这意味着当 OpenClaw 通常会回复时（例如：根据您的群组设置，在被提及时），广播就会触发。

## 使用场景

### 1. 专业化代理团队
部署多个具有原子级、专注职责的代理：
```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

每个代理处理同一条消息，并提供其专业化的视角。

### 2. 多语言支持
```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. 质量保证工作流
```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. 任务自动化
```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## 配置

### 基本设置

添加顶级 `broadcast` 部分（与 `bindings` 并列）。键是 WhatsApp 对等 ID：
- 群聊：群 JID（如 `120363403215116621@g.us`）
- 私信：E.164 电话号码（如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**结果：** 当 OpenClaw 在此聊天中回复时，它将运行所有三个代理。

### 处理策略

控制代理如何处理消息：

#### 并行（默认）
所有代理同时处理：
```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### 顺序
代理按顺序处理（一个等待前一个完成）：
```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 完整示例

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 工作原理

### 消息流程

1. **传入消息**到达 WhatsApp 群组
2. **广播检查**：系统检查对等 ID 是否在 `broadcast` 中
3. **如果在广播列表中**：
   - 所有列出的代理都会处理该消息
   - 每个代理都有自己的会话密钥和隔离上下文
   - 代理以并行方式（默认）或顺序方式处理
4. **如果不在广播列表中**：
   - 应用正常路由（第一个匹配的绑定）

注意：广播群组不会绕过通道白名单或群组激活规则（提及/命令等）。它们只改变在消息符合处理条件时 *哪些代理会运行*。

### 会话隔离

广播群组中的每个代理都保持完全独立：

- **会话密钥**（`agent:alfred:whatsapp:group:120363...` 与 `agent:baerbel:whatsapp:group:120363...`）
- **对话历史**（代理看不到其他代理的消息）
- **工作空间**（如果已配置，则为独立沙盒）
- **工具访问权限**（不同的允许/拒绝列表）
- **内存/上下文**（独立的 IDENTITY.md、SOUL.md 等）
- **群组上下文缓冲区**（用于上下文的近期群组消息）按对等共享，因此所有广播代理在被触发时看到相同的上下文

这使每个代理可以拥有：
- 不同的人格
- 不同的工具访问权限（例如，只读与读写）
- 不同的模型（例如，opus 与 sonnet）
- 不同的技能安装

### 示例：隔离的会话

在群组 `120363403215116621@g.us` 中，代理为 `["alfred", "baerbel"]`：

**Alfred 的上下文：**
```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/pascal/openclaw-alfred/
Tools: read, write, exec
```

**Bärbel 的上下文：**
```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us  
History: [user message, baerbel's previous responses]
Workspace: /Users/pascal/openclaw-baerbel/
Tools: read only
```

## 最佳实践

### 1. 保持代理专注
为每个代理设计单一且明确的职责：

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **良好：** 每个代理只负责一项任务  
❌ **不良：** 一个通用的“开发助手”代理

### 2. 使用描述性名称
清楚地表明每个代理的功能：

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. 配置不同的工具访问权限
只赋予代理所需的工具：

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] }  // Read-only
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] }  // Read-write
    }
  }
}
```

### 4. 监控性能
在使用大量代理时，建议：
- 使用 `"strategy": "parallel"`（默认）以提高速度
- 将广播群组限制在 5–10 个代理
- 对简单的代理使用更快的模型

### 5. 优雅地处理故障
代理独立失败。一个代理的错误不会阻止其他代理：

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## 兼容性

### 提供商

广播群组目前适用于：
- ✅ WhatsApp（已实现）
- 🚧 Telegram（计划中）
- 🚧 Discord（计划中）
- 🚧 Slack（计划中）

### 路由
广播群组与现有路由协同工作：

```json
{
  "bindings": [
    { "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } }, "agentId": "alfred" }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`：只有 alfred 回应（正常路由）
- `GROUP_B`：agent1 和 agent2 同时回应（广播）

**优先级：** `broadcast` 优先于 `bindings`。

## 故障排除

### 代理未响应

**检查：**
1. 代理 ID 是否存在于 `agents.list` 中
2. 对等 ID 格式是否正确（如 `120363403215116621@g.us`）
3. 代理是否未被列入拒绝列表

**调试：**
```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 只有一个代理响应

**原因：** 对等 ID 可能存在于 `bindings` 中，但不存在于 `broadcast` 中。

**修复：** 将其添加到广播配置中，或从绑定中移除。

### 性能问题

**如果在使用大量代理时速度较慢：**
- 减少每个群组中的代理数量
- 使用更轻量级的模型（sonnet 代替 opus）
- 检查沙盒启动时间

## 示例

### 示例 1：代码审查团队

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      { "id": "code-formatter", "workspace": "~/agents/formatter", "tools": { "allow": ["read", "write"] } },
      { "id": "security-scanner", "workspace": "~/agents/security", "tools": { "allow": ["read", "exec"] } },
      { "id": "test-coverage", "workspace": "~/agents/testing", "tools": { "allow": ["read", "exec"] } },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**用户发送：** 代码片段  
**回复：**
- code-formatter：“已修复缩进并添加了类型提示”
- security-scanner：“⚠️ 第 12 行存在 SQL 注入漏洞”
- test-coverage：“覆盖率仅为 45%，缺少针对错误情况的测试”
- docs-checker：“缺少函数 `process_data` 的文档字符串”

### 示例 2：多语言支持

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API 参考

### 配置模式

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 字段

- `strategy`（可选）：代理的处理方式
  - `"parallel"`（默认）：所有代理同时处理
  - `"sequential"`：代理按数组顺序处理
  
- `[peerId]`：WhatsApp 群 JID、E.164 号码或其他对等 ID
  - 值：应处理消息的代理 ID 数组

## 限制

1. **最大代理数：** 没有硬性限制，但 10 个以上代理可能会导致速度变慢
2. **共享上下文：** 代理彼此看不到对方的回复（设计使然）
3. **消息排序：** 并行回复可能以任意顺序到达
4. **速率限制：** 所有代理均计入 WhatsApp 的速率限制

## 未来增强功能

计划中的功能：
- [ ] 共享上下文模式（代理可以看到彼此的回复）
- [ ] 代理协调（代理之间可以相互信号传递）
- [ ] 动态代理选择（根据消息内容选择代理）
- [ ] 代理优先级（某些代理先于其他代理响应）

## 参见

- [多代理配置](/multi-agent-sandbox-tools)
- [路由配置](/concepts/channel-routing)
- [会话管理](/concepts/sessions)
