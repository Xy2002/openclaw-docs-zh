---
summary: 'Refactor plan: exec host routing, node approvals, and headless runner'
read_when:
  - Designing exec host routing or exec approvals
  - Implementing node runner + UI IPC
  - Adding exec host security modes and slash commands
---
# 执行主机重构计划

## 目标
- 将 `exec.host` 和 `exec.security` 添加到路由中，以在**沙箱**、**网关**和**节点**之间分配执行任务。
- 保持默认设置**安全**：除非显式启用，否则禁止跨主机执行。
- 将执行拆分为一个带有可选 UI（macOS 应用）的**无头运行器服务**，并通过本地 IPC 进行通信。
- 提供**每代理**的策略、白名单、询问模式和节点绑定。
- 支持*有*或*无*白名单的**询问模式**。
- 跨平台：Unix 套接字 + 令牌认证（macOS/Linux/Windows 功能对等）。

## 非目标
- 不进行旧版白名单迁移或旧版架构支持。
- 不为节点执行提供 PTY/流式传输（仅支持聚合输出）。
- 在现有 Bridge + 网关之外不引入新的网络层。

## 已锁定的决策
- **配置键：** `exec.host` + `exec.security`（允许按代理覆盖）。
- **提升权限：** 保留 `/elevated` 作为网关完全访问权限的别名。
- **询问默认值：** `on-miss`。
- **批准存储：** `~/.openclaw/exec-approvals.json`（JSON 格式，不进行旧版迁移）。
- **运行器：** 无头系统服务；UI 应用托管 Unix 套接字以处理批准请求。
- **节点身份：** 使用现有的 `nodeId`。
- **套接字认证：** Unix 套接字 + 令牌（跨平台）；如有需要，后续再拆分。
- **节点主机状态：** `~/.openclaw/node.json`（节点 ID + 配合令牌）。
- **macOS 执行主机：** 在 macOS 应用内运行 `system.run`；节点主机服务通过本地 IPC 转发请求。
- **无需 XPC 助手：** 继续使用 Unix 套接字 + 令牌 + 对等检查。

## 关键概念
### 主机
- `sandbox`: Docker 执行（当前行为）。
- `gateway`: 在网关主机上执行。
- `node`: 通过 Bridge 在节点运行器上执行（`system.run`）。

### 安全模式
- `deny`: 始终阻止。
- `allowlist`: 仅允许匹配项。
- `full`: 允许一切（等同于提升权限）。

### 询问模式
- `off`: 永不询问。
- `on-miss`: 仅在白名单不匹配时询问。
- `always`: 每次都询问。

询问与白名单**独立**；白名单可与 `always` 或 `on-miss` 一起使用。

### 策略解析（每次执行）
1) 解析 `exec.host`（工具参数 → 代理覆盖 → 全局默认）。
2) 解析 `exec.security` 和 `exec.ask`（优先级相同）。
3) 如果主机是 `sandbox`，则继续在本地沙箱中执行。
4) 如果主机是 `gateway` 或 `node`，则在该主机上应用安全和询问策略。

## 默认安全性
- 默认 `exec.host = sandbox`。
- 默认 `exec.security = deny` 适用于 `gateway` 和 `node`。
- 默认 `exec.ask = on-miss`（仅在安全策略允许时适用）。
- 如果未设置节点绑定，**代理可以指向任意节点**，但前提是策略允许。

## 配置界面
### 工具参数
- `exec.host`（可选）：`sandbox | gateway | node`。
- `exec.security`（可选）：`deny | allowlist | full`。
- `exec.ask`（可选）：`off | on-miss | always`。
- `exec.node`（可选）：当 `host=node` 时使用的节点 ID/名称。

### 全局配置键
- `tools.exec.host`
- `tools.exec.security`
- `tools.exec.ask`
- `tools.exec.node`（默认节点绑定）

### 代理级配置键
- `agents.list[].tools.exec.host`
- `agents.list[].tools.exec.security`
- `agents.list[].tools.exec.ask`
- `agents.list[].tools.exec.node`

### 别名
- `/elevated on` = 为代理会话设置 `tools.exec.host=gateway`, `tools.exec.security=full`。
- `/elevated off` = 恢复代理会话之前的执行设置。

## 批准存储（JSON）
路径： `~/.openclaw/exec-approvals.json`

用途：
- **执行主机**（网关或节点运行器）的本地策略和白名单。
- 当没有 UI 可用时的询问回退。
- 为 UI 客户端提供 IPC 凭证。

建议的模式（v1）：
```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64-opaque-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny"
  },
  "agents": {
    "agent-id-1": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [
        {
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 0,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```
备注：
- 不支持旧版白名单格式。
- `askFallback` 仅在需要 `ask` 且无法访问 UI 时适用。
- 文件权限： `0600`。

## 无头运行器服务
### 角色
- 在本地强制执行 `exec.security` + `exec.ask`。
- 执行系统命令并返回输出。
- 发出 Bridge 事件以记录执行生命周期（可选，但推荐）。

### 服务生命周期
- macOS 上使用 Launchd/守护进程；Linux/Windows 上使用系统服务。
- 批准 JSON 局限于执行主机。
- UI 托管本地 Unix 套接字；运行器按需连接。

## UI 集成（macOS 应用）
### IPC
- Unix 套接字位于 `~/.openclaw/exec-approvals.sock`（0600）。
- 令牌存储在 `exec-approvals.json`（0600）。
- 对等检查：仅同一 UID 可连接。
- 挑战/响应机制：nonce + HMAC(令牌, 请求哈希)，以防止重放攻击。
- 短 TTL（例如 10 秒）+ 最大负载 + 速率限制。

### 询问流程（macOS 应用执行主机）
1) 节点服务从网关接收 `system.run`。
2) 节点服务连接到本地套接字，并发送提示/执行请求。
3) 应用验证对等方 + 令牌 + HMAC + TTL，然后在必要时显示对话框。
4) 应用在 UI 上下文中执行命令并返回输出。
5) 节点服务将输出返回给网关。

如果缺少 UI：
- 应用 `askFallback`（`deny|allowlist|full`）。

### 流程图（SCI）
```
Agent -> Gateway -> Bridge -> Node Service (TS)
                         |  IPC (UDS + token + HMAC + TTL)
                         v
                     Mac App (UI + TCC + system.run)
```

## 节点身份 + 绑定
- 使用来自 Bridge 配对的现有 `nodeId`。
- 绑定模型：
  - `tools.exec.node` 将代理限制为特定节点。
  - 如果未设置，代理可以选择任何节点（策略仍会强制执行默认设置）。
- 节点选择解析：
  - `nodeId` 精确匹配
  - `displayName`（规范化）
  - `remoteIp`
  - `nodeId` 前缀（>= 6 个字符）

## 事件传递
### 谁能看到事件
- 系统事件是**按会话**的，并在下一个提示时显示给代理。
- 存储在网关的内存队列中（`enqueueSystemEvent`）。

### 事件文本
- `Exec started (node=<id>, id=<runId>)`
- `Exec finished (node=<id>, id=<runId>, code=<code>)` + 可选的输出尾部
- `Exec denied (node=<id>, id=<runId>, <reason>)`

### 传输方式
选项 A（推荐）：
- 运行器向 Bridge 发送 `event` 帧 `exec.started` / `exec.finished`。
- 网关 `handleBridgeEvent` 将这些映射为 `enqueueSystemEvent`。

选项 B：
- 网关 `exec` 工具直接处理生命周期（仅同步模式）。

## 执行流程
### 沙箱主机
- 现有的 `exec` 行为（Docker 或非沙箱时的主机）。
- 仅在非沙箱模式下支持 PTY。

### 网关主机
- 网关进程在其自己的机器上执行。
- 强制执行本地 `exec-approvals.json`（安全/询问/白名单）。

### 节诺主机
- 网关使用 `node.invoke` 和 `system.run` 调用。
- 运行器强制执行本地批准。
- 运行器返回聚合的 stdout/stderr。
- 可选的 Bridge 事件用于记录开始/结束/拒绝。

## 输出上限
- 合并的 stdout+stderr 上限为**200k**；保留**尾部 20k**用于事件。
- 截断时使用清晰的后缀（例如 `"… (truncated)"`）。

## 斜杠命令
- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`
- 按代理、按会话覆盖；除非通过配置保存，否则不持久。
- `/elevated on|off|ask|full` 仍然是 `host=gateway security=full` 的快捷方式（使用 `full` 可跳过批准）。

## 跨平台方案
- 无头运行器服务是可移植的执行目标。
- UI 是可选的；如果缺失，应用 `askFallback`。
- Windows/Linux 支持相同的批准 JSON + 套接字协议。

## 实施阶段
### 第 1 阶段：配置 + 执行路由
- 添加 `exec.host`, `exec.security`, `exec.ask`, `exec.node` 的配置模式。
- 更新工具管道以尊重 `exec.host`。
- 添加 `/exec` 斜杠命令，并保留 `/elevated` 别名。

### 第 2 阶段：批准存储 + 网关强制执行
- 实现 `exec-approvals.json` 读写器。
- 对 `gateway` 主机强制执行白名单 + 询问模式。
- 添加输出上限。

### 第 3 阶段：节点运行器强制执行
- 更新节点运行器以强制执行白名单 + 询问。
- 在 macOS 应用 UI 中添加 Unix 套接字提示桥。
- 连接 `askFallback`。

### 第 4 阶段：事件
- 为执行生命周期添加节点 → 网关 Bridge 事件。
- 将其映射到 `enqueueSystemEvent`，用于代理提示。

### 第 5 阶段：UI 优化
- Mac 应用：白名单编辑器、按代理切换器、询问政策 UI。
- 节点绑定控件（可选）。

## 测试计划
- 单元测试：白名单匹配（glob + 不区分大小写）。
- 单元测试：策略解析优先级（工具参数 → 代理覆盖 → 全局）。
- 集成测试：节点运行器的拒绝/允许/询问流程。
- Bridge 事件测试：节点事件 → 系统事件路由。

## 潜在风险
- UI 不可用：确保遵守 `askFallback`。
- 长时间运行的命令：依赖超时 + 输出上限。
- 多节点歧义：除非设置了节点绑定或明确指定了节点参数，否则会报错。

## 相关文档
- [执行工具](/tools/exec)
- [执行批准](/tools/exec-approvals)
- [节点](/nodes)
- [提升权限模式](/tools/elevated)
