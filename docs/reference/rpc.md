---
summary: 'RPC adapters for external CLIs (signal-cli, imsg) and gateway patterns'
read_when:
  - Adding or changing external CLI integrations
  - 'Debugging RPC adapters (signal-cli, imsg)'
---
__HEADING_0__RPC适配器

OpenClaw通过JSON-RPC集成外部CLI。目前采用两种模式。

## 模式A：HTTP守护进程（signal-cli）

- `signal-cli` 以守护进程形式运行，并通过HTTP提供JSON-RPC服务。
- 事件流采用SSE（`/api/v1/events`）。
- 健康探测：`/api/v1/check`。
- 当`channels.signal.autoStart=true`时，OpenClaw负责管理其生命周期。

有关设置和端点，请参阅[Signal](/channels/signal)。

## 模式B：标准输入/输出子进程（imsg）

- OpenClaw将`imsg rpc`作为子进程启动。
- JSON-RPC通过标准输入/输出以换行分隔的方式传输（每行一个JSON对象）。
- 无需TCP端口，也不需要守护进程。

核心方法包括：

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（探测/诊断）

有关设置和寻址（建议使用`chat_id`），请参阅[iMessage](/channels/imessage)。

## 适配器指南

- 网关负责管理进程的生命周期，其启动和停止与提供商的生命周期紧密绑定。
- 保持RPC客户端的健壮性：设置超时机制，并在客户端退出时自动重启。
- 尽量使用稳定ID（如`chat_id`），而非直接使用显示字符串。
