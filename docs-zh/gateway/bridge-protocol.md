---
summary: 'Bridge protocol (legacy nodes): TCP JSONL, pairing, scoped RPC'
read_when:
  - Building or debugging node clients (iOS/Android/macOS node mode)
  - Investigating pairing or bridge auth failures
  - Auditing the node surface exposed by the gateway
---
# 桥接协议（旧版节点传输）

桥接协议是一种**旧版**节点传输协议（TCP JSONL）。新节点客户端应改用统一的网关 WebSocket 协议。

如果您正在构建运营商或节点客户端，请使用[网关协议](/gateway/protocol)。

**注意：** 当前的 OpenClaw 构建不再包含 TCP 桥监听器；本文档仅作为历史参考保留。旧版`bridge.*`配置键已不再属于配置模式的一部分。

## 为什么同时存在这两种协议

- **安全边界**：桥接协议暴露的是一个小型白名单，而非完整的网关 API 表面。
- **配对与节点身份**：节点准入由网关负责，并与每个节点的令牌绑定。
- **发现用户体验**：节点可通过局域网上的 Bonjour 发现网关，或直接通过 Tailnet 进行连接。
- **环回 WS**：完整的 WS 控制平面默认保留在本地，除非通过 SSH 隧道进行转发。

## 传输

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（当`bridge.tls.enabled`为真时）。
- 旧版默认监听端口为`18790`（当前构建不会启动 TCP 桥）。

启用 TLS 时，发现 TXT 记录包含`bridgeTls=1`以及`bridgeTlsSha256`，以便节点可以固定证书。

## 握手与配对

1) 客户端发送`hello`，携带节点元数据和令牌（如果已配对）。  
2) 如果未配对，网关回复`error`（`NOT_PAIRED`/`UNAUTHORIZED`）。  
3) 客户端发送`pair-request`。  
4) 网关等待批准，然后发送`pair-ok`和`hello-ok`。

`hello-ok`返回`serverName`，并可能包含`canvasHostUrl`。

## 帧

客户端 → 网关：
- `req` / `res`：作用域限定的网关 RPC（聊天、会话、配置、健康、语音唤醒、skills.bins）
- `event`：节点信号（语音转录、代理请求、聊天订阅、执行生命周期）

网关 → 客户端：
- `invoke` / `invoke-res`：节点命令(`canvas.*`, `camera.*`, `screen.record`,
`location.get`, `sms.send`)
- `event`：已订阅会话的聊天更新
- `ping` / `pong`：保活消息

旧版白名单强制实施功能位于`src/gateway/server-bridge.ts`中（已移除）。

## 执行生命周期事件

节点可发出`exec.finished`或`exec.denied`事件，以反映 system.run 活动。这些事件会被映射到网关中的系统事件。（旧版节点仍可能发出`exec.started`。）

有效载荷字段（除非另有说明，均为可选）：
- `sessionKey`（必填）：接收系统事件的代理会话。
- `runId`：用于分组的唯一执行 ID。
- `command`：原始或格式化的命令字符串。
- `exitCode`, `timedOut`, `success`, `output`：完成详情（仅在任务完成时提供）。
- `reason`：拒绝原因（仅在被拒绝时提供）。

## Tailnet 使用

- 将桥接绑定到 Tailnet IP：在`~/.openclaw/openclaw.json`中设置`bridge.bind: "tailnet"`。
- 客户端通过 MagicDNS 名称或 Tailnet IP 进行连接。
- Bonjour**不**跨网络；必要时请使用手动主机/端口或广域 DNS‑SD。

## 版本控制

目前，桥接协议为**隐式 v1**（无最小/最大版本协商）。预计具有向后兼容性；在引入任何破坏性变更之前，应添加桥接协议版本字段。
