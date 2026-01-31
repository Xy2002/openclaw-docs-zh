---
summary: Gateway-owned node pairing (Option B) for iOS and other remote nodes
read_when:
  - Implementing node pairing approvals without macOS UI
  - Adding CLI flows for approving remote nodes
  - Extending gateway protocol with node management
---
# 网关拥有的配对（选项B）

在网关拥有的配对中，**网关**是决定哪些节点被允许加入的权威来源。UI（macOS 应用、未来客户端）只是批准或拒绝待处理请求的前端。

**重要提示：** WS 节点在 `connect` 期间使用 **设备配对**（角色 `node`）。`node.pair.*` 是一个独立的配对存储，**不**用于控制 WS 握手。只有显式调用 `node.pair.*` 的客户端才会使用此流程。

## 概念

- **待处理请求**：请求加入的节点；需要批准。
- **已配对节点**：已获批准并颁发了身份验证令牌的节点。
- **传输层**：网关 WS 端点会转发请求，但不决定成员资格。（旧版 TCP 桥接支持已被弃用或移除。）

## 配对的工作原理

1. 节点连接到网关 WS 并请求配对。
2. 网关存储一个 **待处理请求**，并发出 `node.pair.requested`。
3. 您通过 CLI 或 UI 批准或拒绝该请求。
4. 批准后，网关颁发一个 **新令牌**（重新配对时会轮换令牌）。
5. 节点使用该令牌重新连接，此时即为“已配对”。

待处理请求会在 **5 分钟** 后自动过期。

## CLI 工作流（无头友好）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 显示已配对/已连接的节点及其功能。

## API 表面（网关协议）

事件：
- `node.pair.requested` — 在创建新的待处理请求时触发。
- `node.pair.resolved` — 在请求被批准、拒绝或过期时触发。

方法：
- `node.pair.request` — 创建或重用待处理请求。
- `node.pair.list` — 列出待处理和已配对的节点。
- `node.pair.approve` — 批准待处理请求（颁发令牌）。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

注意事项：
- `node.pair.request` 对每个节点是幂等的：重复调用会返回相同的待处理请求。
- 批准 **始终** 生成新令牌；从未从 `node.pair.request` 返回任何现有令牌。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。

## 自动批准（macOS 应用）

macOS 应用可以选择尝试 **静默批准**，当满足以下条件时：
- 请求被标记为 `silent`，且
- 应用能够以相同用户验证与网关主机的 SSH 连接。

如果静默批准失败，则回退到正常的“批准/拒绝”提示。

## 存储（本地、私有）

配对状态存储在网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果您覆盖 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹也会随之移动。

安全注意事项：
- 令牌属于机密信息；请将 `paired.json` 视为敏感数据。
- 轮换令牌需要重新批准（或删除节点条目）。

## 传输行为

- 传输层是 **无状态的**；它不存储成员资格。
- 如果网关离线或配对功能被禁用，节点无法进行配对。
- 如果网关处于远程模式，配对仍会针对远程网关的存储执行。
