---
summary: Global voice wake words (Gateway-owned) and how they sync across nodes
read_when:
  - Changing voice wake words behavior or defaults
  - Adding new node platforms that need wake word sync
---
# 语音唤醒（全局唤醒词）

OpenClaw将**唤醒词视为由网关拥有的单一全局列表**。

- **不存在每个节点的自定义唤醒词**。
- **任何节点或应用界面均可编辑**该列表；更改由网关持久化并广播给所有设备。
- 每台设备仍保留自己的**语音唤醒启用/禁用开关**（本地用户体验和权限设置可能有所不同）。

## 存储（网关主机）

唤醒词存储在网关机器上，路径为：

- `~/.openclaw/settings/voicewake.json`

形状：

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 协议

### 方法

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set`，参数为 `{ triggers: string[] }` → `{ triggers: string[] }`

注意事项：
- 唤醒词会经过规范化处理（去除前后空格、删除空值）。空列表将回退到默认值。
- 为确保安全，会对数量和长度施加限制。

### 事件

- `voicewake.changed`，有效载荷为 `{ triggers: string[] }`

接收方：
- 所有 WebSocket 客户端（macOS 应用、WebChat 等）
- 所有已连接节点（iOS/Android），并在节点首次连接时作为初始“当前状态”推送。

## 客户端行为

### macOS 应用

- 使用全局列表来控制 `VoiceWakeRuntime` 触发器的启用与禁用。
- 在语音唤醒设置中编辑“触发词”会调用 `voicewake.set`，并通过广播机制使其他客户端保持同步。

### iOS 节点

- 使用全局列表进行 `VoiceWakeManager` 触发检测。
- 在设置中编辑唤醒词会通过网关 WebSocket 调用 `voicewake.set`，并确保本地唤醒词检测始终保持响应。

### Android 节点

- 在设置中提供唤醒词编辑器。
- 通过网关 WebSocket 调用 `voicewake.set`，以确保所有设备上的编辑内容实时同步。
