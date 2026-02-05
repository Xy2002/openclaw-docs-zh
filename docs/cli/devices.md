---
summary: >-
  CLI reference for `openclaw devices` (device pairing + token
  rotation/revocation)
read_when:
  - You are approving device pairing requests
  - You need to rotate or revoke device tokens
---
# `openclaw devices`

管理设备配对请求和设备范围的令牌。

## 命令

### __INLINE_CODE_6__

列出待处理的配对请求和已配对的设备。

```
openclaw devices list
openclaw devices list --json
```

### __INLINE_CODE_7__

批准待处理的设备配对请求。

```
openclaw devices approve <requestId>
```

### __INLINE_CODE_8__

拒绝待处理的设备配对请求。

```
openclaw devices reject <requestId>
```

### __INLINE_CODE_9__

为特定角色轮换设备令牌（可选择更新作用域）。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### __INLINE_CODE_10__

撤销特定角色的设备令牌。

```
openclaw devices revoke --device <deviceId> --role node
```

## 常见选项

- __INLINE_CODE_11__: 网关 WebSocket URL（配置时默认为 __INLINE_CODE_12__)。
- __INLINE_CODE_13__: 网关令牌（如果需要）。
- __INLINE_CODE_14__: 网关密码（密码认证）。
- __INLINE_CODE_15__: RPC 超时。
- __INLINE_CODE_16__: JSON 输出（建议用于脚本）。

## 注意事项

- 令牌轮换会返回一个新的令牌（敏感信息），请将其视为秘密。
- 这些命令需要 __INLINE_CODE_17__（或 __INLINE_CODE_18__)作用域。
