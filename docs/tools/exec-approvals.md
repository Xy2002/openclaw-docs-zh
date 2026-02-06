---
summary: 'Exec approvals, allowlists, and sandbox escape prompts'
read_when:
  - Configuring exec approvals or allowlists
  - Implementing exec approval UX in the macOS app
  - Reviewing sandbox escape prompts and implications
---
# 执行审批

Exec 审批是一种**配套应用/节点主机护栏**，用于在沙箱代理上运行命令时允许其在真实主机上执行命令（`gateway` 或 `node`）。您可以将其视为一种安全联锁机制：只有当策略、白名单以及（可选）用户批准全部同意时，命令才会被允许。Exec 审批是**对工具策略和提升权限门控的补充**（除非提升权限设置为 `full`，此时会跳过审批）。

有效策略是 `tools.exec.*` 和审批默认值中**更严格**的一个；如果省略审批字段，则使用 `tools.exec` 值。

如果配套应用界面**不可用**，任何需要提示的请求都将由**询问回退**处理（默认：拒绝）。

## 适用范围

执行审批在执行主机上本地强制实施：

- **网关主机** → 网关机器上的 `openclaw` 进程
- **节点主机** → 节点运行器（macOS 配套应用或无头节点主机）

macOS 分离：

- **节点主机服务** 通过本地 IPC 将 `system.run` 转发到 **macOS 应用程序**。
- **macOS 应用程序** 在 UI 上下文中执行审批并执行命令。

## 设置与存储

审批信息存储在执行主机上的本地JSON文件中：

`~/.openclaw/exec-approvals.json`

示例模式：

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 策略控件

### 安全性 (`exec.security`)

- **拒绝**：阻止所有主机执行请求。
- **白名单**：仅允许白名单中的命令。
- **完全放行**：允许一切（等同于提升权限）。

### 询问 (`exec.ask`)

- **关闭**：从不提示。
- **未命中时提示**：仅在白名单不匹配时提示。
- **始终提示**：对每条命令都提示。

### 查询回退 (`askFallback`)

如果需要提示但无法访问UI，回退决定：

- **拒绝**：阻止。
- **白名单**：仅在白名单匹配时允许。
- **完全放行**：允许。

## 白名单（按代理）

白名单是**按代理设置**的。如果有多个代理，您只需在 macOS 应用中切换要编辑的代理即可。模式采用**不区分大小写的通配符匹配**。模式应解析为**二进制路径**（仅包含基名的条目将被忽略）。旧版 `agents.default` 条目将在加载时迁移到 `agents.main`。

示例：

- `~/Projects/**/bin/bird`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

每个白名单条目跟踪：

- **ID**：用于 UI 标识的稳定 UUID（可选）
- **上次使用时间戳**
- **上次使用的命令**
- **上次解析的路径**

## 自动允许技能 CLI

当启用**自动允许技能 CLI**时，已知技能引用的可执行文件在节点上被视为已列入白名单（macOS节点或无头节点主机）。通过网关 RPC 使用 `skills.bins` 获取技能二进制列表。如果您希望采用严格的手动白名单，请禁用此功能。

## 安全二进制文件（仅限标准输入）

`tools.exec.safeBins` 定义了一个小型的**仅限标准输入**的二进制文件列表（例如 `jq`），这些二进制文件可以在白名单模式下运行，**无需** 显式白名单条目。安全二进制文件会拒绝位置文件参数和类似路径的标记，因此它们只能处理传入的数据流。在白名单模式下，Shell 链接和重定向不会被自动允许。

当每个顶级段都符合白名单要求时（包括安全二进制文件或技能自动允许），Shell 链接（`&&`、`||`、`;`）是允许的。在白名单模式下，重定向仍然不受支持。

默认安全二进制文件：`jq`、`grep`、`cut`、`sort`、`uniq`、`head`、`tail`、`tr`、`wc`。

## 控制UI编辑

使用**控制 UI → 节诺 → Exec 审批**卡片来编辑默认值、按代理的覆盖设置和白名单。选择作用域（默认或某个代理），调整策略，添加或删除白名单模式，然后**保存**。UI 会显示每个模式的**上次使用**元数据，以便您保持列表整洁。

目标选择器可以选择**网关**（本地审批）或**节点**。节点必须公开 `system.execApprovals.get/set`（macOS 应用或无头节点主机）。如果节点尚未公开 exec 审批，请直接编辑其本地 `~/.openclaw/exec-approvals.json`。

CLI：`openclaw approvals` 支持网关或节点编辑（参见 [审批 CLI](/cli/approvals)）。

## 审批流程

当需要提示时，网关会向操作员客户端广播 `exec.approval.requested`。控制 UI 和 macOS 应用通过 `exec.approval.resolve` 解决该问题，然后网关将批准的请求转发给节点主机。

在需要审批时，exec 工具会立即返回一个审批 ID。您可以使用该 ID 将后续系统事件关联起来（`Exec finished` / `Exec denied`）。如果在超时前未收到审批决定，请求将被视为审批超时，并以拒绝为原因上报。

确认对话框包括：

- 命令 + 参数
- 当前工作目录
- 代理ID
- 解析后的可执行文件路径
- 主机 + 策略元数据

操作选项：

- **允许一次** → 立即运行
- **始终允许** → 添加到白名单并运行
- **拒绝** → 阻止

## 审批转发至聊天频道

您可以将 exec 审批提示转发到任何聊天频道（包括插件频道），并通过 `/approve` 进行批准。这会使用正常的出站传递管道。

配置：

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" }
      ]
    }
  }
}
```

在聊天中回复：

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

### macOS IPC 流程

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + approvals + system.run)
```

安全注意事项：

- Unix套接字模式`0600`，令牌存储在`exec-approvals.json`中。
- 进行同UID对等检查。
- 挑战/响应（随机数 + HMAC令牌 + 请求哈希）+ 短TTL。

## 系统事件

Exec生命周期以系统消息的形式呈现：

- `Exec running`（仅当命令超过运行通知阈值时）
- `Exec finished`
- `Exec denied`

这些消息会在节点报告事件后发布到代理的会话中。网关主机上的 exec 审批在命令完成时会发出相同的生命周期事件（并且在运行时间超过阈值时也会发出事件）。受审批约束的 exec 会将审批 ID 作为这些消息中的 `runId`，以便于关联。

## 意义

- **完全放行** 功能强大；在可能的情况下优先使用白名单。
- **询问** 让您保持参与，同时仍能快速批准。
- 按代理设置的白名单可防止一个代理的审批泄露到其他代理。
- 审批仅适用于来自**授权发送者**的主机执行请求。未经授权的发送者无法发出 `/exec`。
- `/exec security=full` 是为授权操作员提供的会话级便利功能，默认设计为跳过审批。若要硬性阻止主机执行，请将审批安全性设置为 `deny`，或通过工具策略拒绝 `exec` 工具。

相关：

- [Exec 工具](/tools/exec)
- [提升权限模式](/tools/elevated)
- [技能](/tools/skills)
