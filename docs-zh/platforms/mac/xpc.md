---
summary: >-
  macOS IPC architecture for OpenClaw app, gateway node transport, and
  PeekabooBridge
read_when:
  - Editing IPC contracts or menu bar app IPC
---
# OpenClaw macOS IPC 架构

**当前模型：** 一个本地 Unix 套接字将 **节点主机服务** 连接到 **macOS 应用程序**，用于执行批准以及 `system.run`。存在一个 `openclaw-mac` 调试 CLI，用于发现和连接检查；代理操作仍通过网关 WebSocket 和 `node.invoke` 流转。UI 自动化使用 PeekabooBridge。

## 目标
- 单一 GUI 应用实例负责所有面向 TCC 的工作（通知、屏幕录制、麦克风、语音、AppleScript）。
- 自动化的表面尽可能小：网关 + 节点命令，再加上用于 UI 自动化的 PeekabooBridge。
- 权限可预测：始终使用相同的签名捆绑包 ID，并由 launchd 启动，因此 TCC 授权会一直有效。

## 工作原理
### 网关 + 节点传输
- 应用运行网关（本地模式），并作为节点连接到网关。
- 代理操作通过 `node.invoke` 执行（例如 `system.run`、`system.notify`、`canvas.*`）。

### 节点服务 + 应用 IPC
- 一个无头节点主机服务连接到网关 WebSocket。
- `system.run` 请求通过本地 Unix 套接字转发到 macOS 应用程序。
- 应用在 UI 上下文中执行该操作，必要时提示用户，并返回输出。

图表（SCI）：
```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自动化）
- UI 自动化使用名为 `bridge.sock` 的独立 UNIX 套接字以及 PeekabooBridge JSON 协议。
- 主机优先级顺序（客户端侧）：Peekaboo.app → Claude.app → OpenClaw.app → 本地执行。
- 安全性：桥接主机需要具有允许的 TeamID；仅用于 DEBUG 的同 UID 绕过机制受到 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（Peekaboo 约定）的保护。
- 详情请参阅：[PeekabooBridge 使用说明](/platforms/mac/peekaboo)。

## 操作流程
- 重启/重建：`SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 终止现有实例
  - 使用 Swift 构建并打包
  - 写入/引导/启动 LaunchAgent
- 单一实例：如果已有具有相同捆绑包 ID 的实例正在运行，应用会提前退出。

## 强化注意事项
- 尽可能要求所有特权界面匹配 TeamID。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（仅用于 DEBUG）可能允许同 UID 调用者进行本地开发。
- 所有通信均保持本地隔离；不暴露任何网络套接字。
- TCC 提示仅来自 GUI 应用程序捆绑包；确保在重建过程中签名的捆绑包 ID 保持稳定。
- IPC 强化措施：套接字模式 `0600`、令牌、对端 UID 检查、HMAC 挑战/响应机制以及短 TTL。
