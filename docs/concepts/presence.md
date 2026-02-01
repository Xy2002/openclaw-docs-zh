---
summary: 'How OpenClaw presence entries are produced, merged, and displayed'
read_when:
  - Debugging the Instances tab
  - Investigating duplicate or stale instance rows
  - Changing gateway WS connect or system-event beacons
---
# 在线状态

OpenClaw 的“在线状态”是一种轻量级、尽力而为的视图，用于展示：
- **网关本身**，以及
- **连接到网关的客户端**（mac 应用、WebChat、CLI 等）

在线状态主要用于渲染 macOS 应用的 **实例** 选项卡，并为操作员提供快速可见性。

## 在线状态字段（显示内容）

在线状态条目是结构化对象，包含以下字段：

- `instanceId`（可选但强烈推荐）：稳定的客户端标识（通常为 `connect.client.instanceId`）
- __ INLINE_CODE_2__：人性化的主机名
- `ip`：尽力而为的 IP 地址
- `version`：客户端版本字符串
- `deviceFamily` / `modelIdentifier`：硬件提示信息
- `mode`：`ui`、`webchat`、`cli`、`backend`、`probe`、`test`、`node`，等等
- `lastInputSeconds`：“自上次用户输入以来的秒数”（如果已知）
- `reason`：`self`、`connect`、`node-connected`、`periodic`，等等
- `ts`：上次更新的时间戳（自纪元以来的毫秒数）

## 数据来源（在线状态从何而来）

在线状态条目由多个来源生成，并被**合并**。

### 1) 网关自身条目

网关在启动时始终会生成一个“自身”条目，以便在任何客户端连接之前，UI 就能显示网关主机。

### 2) WebSocket 连接

每个 WS 客户端在连接时都会发送一个 `connect` 请求。握手成功后，网关会为该连接创建或更新一条在线状态条目。

#### 为什么一次性 CLI 命令不会显示

CLI 经常用于执行短暂的一次性命令。为了避免在实例列表中产生大量垃圾条目，`client.mode === "cli"` **不会** 被转换为在线状态条目。

### 3) `system-event` 信标

客户端可以通过 `system-event` 方法发送更丰富的周期性信标。mac 应用使用此功能报告主机名、IP 和 `lastInputSeconds`。

### 4) 节点连接（角色：节点）
当节点通过网关 WebSocket 使用 `role: node` 进行连接时，网关会为该节点创建或更新一条在线状态条目（与处理其他 WS 客户端的流程相同）。

## 合并与去重规则（为什么 `instanceId` 很重要）

在线状态条目存储在一个单一的内存映射中：

- 条目以**在线状态键**作为键。
- 最佳键是一个稳定的 `instanceId`（来自 `connect.client.instanceId`），可在重启后保持不变。
- 键不区分大小写。

如果客户端重新连接时没有提供稳定的 `instanceId`，它可能会显示为一条**重复**记录。

## TTL 和有限大小

在线状态是故意短暂的：

- **TTL：** 超过 5 分钟的条目会被清除
- **最大条目数：** 200（最早进入的条目优先被移除）

这有助于保持列表的新鲜度，并防止内存无限制增长。

## 遥远/隧道注意事项（环回 IP）

当客户端通过 SSH 隧道或本地端口转发连接时，网关可能会将远程地址视为 `127.0.0.1`。为了避免覆盖客户端报告的有效 IP，环回远程地址会被忽略。

## 消费者

### macOS 实例选项卡

macOS 应用会渲染 `system-presence` 的输出，并根据上次更新的时间长短应用一个小的状态指示器（活动/空闲/过时）。

## 调试提示

- 要查看原始列表，可对网关调用 `system-presence`。
- 如果发现重复条目：
  - 确认客户端在握手时发送了稳定的 `client.instanceId`
  - 确认周期性信贝使用相同的 `instanceId`
  - 检查是否缺少基于连接派生的条目中的 `instanceId`（出现重复条目是预期的）
