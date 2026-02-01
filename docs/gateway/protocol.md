---
summary: 'Gateway WebSocket protocol: handshake, frames, versioning'
read_when:
  - Implementing or updating gateway WS clients
  - Debugging protocol mismatches or connect failures
  - Regenerating protocol schema/models
---
# 网关协议（WebSocket）

Gateway WS 协议是 OpenClaw 的**单一控制平面 + 节点传输**层。所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）都通过 WebSocket 连接，并在握手时声明其**角色**和**作用域**。

## 传输

- 使用 WebSocket，文本帧携带 JSON 负载。
- 第一个帧**必须**是 `connect` 请求。

## 握手（连接）

网关 → 客户端（连接前质询）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端 → 网关：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

网关 → 客户端：

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

当颁发设备令牌时，`hello-ok` 还包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### 节点示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## 帧结构

- **请求**：`{type:"req", id, method, params}`
- **响应**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

具有副作用的方法需要使用**幂等密钥**（参见模式）。

## 角色与作用域

### 角色
- `operator` = 控制平面客户端（CLI/UI/自动化）。
- __ INLINE_CODE_11__ = 功能宿主（摄像头/屏幕/画布/system.run）。

### 作用域（操作员）
常见作用域：
- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

### 功能/命令/权限（节点）
节点在连接时声明功能声明：
- `caps`：高层次功能类别。
- `commands`：用于调用的命令白名单。
- `permissions`：细粒度开关（例如 `screen.record`、`camera.capture`）。

网关将这些视为**声明**，并在服务器端强制执行白名单。

## 在线状态

- `system-presence` 返回以设备身份为键的条目。
- 在线状态条目包括 `deviceId`、`roles` 和 `scopes`，以便 UI 可以为每个设备显示一行，
  即使该设备同时作为**操作员**和**节点**连接。

### 节点辅助方法

- 节点可以调用 `skills.bins` 来获取当前技能可执行文件列表，
  以进行自动允许检查。

## 执行批准

- 当执行请求需要批准时，网关会广播 `exec.approval.requested`。
- 操作员客户端通过调用 `exec.approval.resolve` 来解决（需要 `operator.approvals` 作用域）。

## 版本管理

- `PROTOCOL_VERSION` 存在于 `src/gateway/protocol/schema.ts` 中。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器会拒绝版本不匹配的情况。
- 模式和模型由 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 认证

- 如果设置了 `OPENCLAW_GATEWAY_TOKEN`（或 `--token`），`connect.params.auth.token` 必须匹配，否则套接字将被关闭。
- 配对后，网关会颁发一个**设备令牌**，其作用域限定于连接角色和作用域。该令牌在 `hello-ok.auth.deviceToken` 中返回，客户端应将其持久化，以备将来连接使用。
- 设备令牌可通过 `device.token.rotate` 和 `device.token.revoke` 进行轮换或撤销（需要 `operator.pairing` 作用域）。

## 设备身份与配对

- 节诺应包含一个稳定的设备身份（`device.id`），该身份源自密钥对指纹。
- 网关按设备和角色颁发令牌。
- 对于新的设备 ID，除非启用了本地自动批准，否则需要批准才能配对。
- **本地**连接包括回环以及网关主机自身的 Tailnet 地址（因此同一主机上的 Tailnet 绑定仍可自动批准）。
- 所有 WS 客户ients在 `connect` 期间必须包含 `device` 身份（操作员 + 节诺）。
  控制 UI 只有在启用 `gateway.controlUi.allowInsecureAuth` 时才可省略它
  （或在紧急情况下使用 `gateway.controlUi.dangerouslyDisableDeviceAuth`）。
- 非本地连接必须签署由服务器提供的 `connect.challenge` 随机数。

## TLS + 证书固定

- WS 连接支持 TLS。
- 客户ients可以选择固定网关证书指纹（参见 `gateway.tls` 配置以及 `gateway.remote.tlsFingerprint` 或 CLI 中的 `--tls-fingerprint`）。

## 作用域

此协议公开了**完整的网关 API**（状态、通道、模型、聊天、代理、会话、节点、批准等）。确切的接口表面由 `src/gateway/protocol/schema.ts` 中的 TypeBox 模式定义。
