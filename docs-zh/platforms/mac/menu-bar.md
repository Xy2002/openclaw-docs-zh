---
summary: Menu bar status logic and what is surfaced to users
read_when:
  - Tweaking mac menu UI or status logic
---
# 菜单栏状态逻辑

## 显示内容
- 我们在菜单栏图标以及菜单中的第一行状态中显示当前代理的工作状态。
- 当工作处于活动状态时，健康状态会被隐藏；只有在所有会话都处于空闲状态时，健康状态才会重新显示。
- 菜单中的“节点”区块仅列出**设备**（通过`node.list`配对的节点），而不包括客户端或在线状态条目。
- 当提供者使用情况快照可用时，“上下文”下方会显示一个“使用情况”部分。

## 状态模型
- 会话：事件通过`runId`（每运行一次）以及负载中的`sessionKey`到达。其中，“主”会话是关键的`main`；如果不存在，则回退到最近更新的会话。
- 优先级：主会话始终优先。如果主会话处于活动状态，其状态会立即显示。如果主会话处于空闲状态，则显示最近活跃的非主会话。我们不会在活动过程中频繁切换状态；只有当当前会话进入空闲状态或主会话变为活动状态时，才会进行切换。
- 活动类型：
  - `job`：高级命令执行（`state: started|streaming|done|error`）。
  - `tool`：带有`toolName`和`meta/args`的`phase: start|result`。

## IconState 枚举（Swift）
- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（调试覆盖）

### 活动类型 → 图标
- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- 默认 → 🛠️

### 可视化映射
- `idle`：普通生物形象。
- `workingMain`：带有图标的徽章，全色调，腿部呈现“工作”动画。
- `workingOther`：带有图标的徽章，色调柔和，无快速移动动画。
- `overridden`：无论活动状态如何，均使用所选图标和色调。

## 菜单状态行文本
- 工作处于活动状态时：`<Session role> · <activity label>`
  - 示例：`Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- 处于空闲状态时：回退到健康摘要。

## 事件处理
- 来源：控制通道中的`agent`事件（`ControlChannel.handleAgentEvent`）。
- 解析字段：
  - `stream: "job"`搭配`data.state`用于记录开始/停止时间。
  - `stream: "tool"`搭配`data.phase`、`name`，以及可选的`meta`/`args`。
- 标签：
  - `exec`：`args.command`的第一行。
  - `read`/`write`：缩短的路径。
  - `edit`：路径加上从`meta`/差异计数推断出的变更类型。
  - 回退：工具名称。

## 教程覆盖
- 设置 ▸ 调试 ▸ “图标覆盖”选择器：
  - `System (auto)`（默认）
  - `Working: main`（按工具类型）
  - `Working: other`（按工具类型）
  - `Idle`
- 通过`@AppStorage("iconOverride")`存储；映射到`IconState.overridden`。

## 测试检查清单
- 触发主会话任务：验证图标是否立即切换，且状态行显示主标签。
- 在主会话空闲时触发非主会话任务：图标和状态应显示非主会话，并保持稳定直到任务完成。
- 在其他会话处于活动状态时启动主会话：图标应立即切换为显示主会话。
- 快速工具调用：确保徽章不会闪烁（对工具结果设置 TTL 宽限期）。
- 当所有会话都处于空闲状态时，健康行将重新出现。
