---
summary: 'Matrix support status, capabilities, and configuration'
read_when:
  - Working on Matrix channel features
---
# 矩阵（插件）

Matrix是一种开放、去中心化的消息传递协议。OpenClaw允许Matrix**用户**连接到任何托管服务器，因此您需要为机器人创建一个Matrix账户。登录后，您可以直接向机器人发送私信，或将机器人邀请到聊天室（即Matrix中的“群组”）。Beeper也是一款可行的客户端选项，但必须启用端到端加密。

状态：通过插件支持（@vector-im/matrix-bot-sdk）。支持私信、聊天室、线程、媒体、反应、投票（以文本形式发送 + 投票开始）、位置以及端到端加密（需加密支持）。

## 需要插件

Matrix 作为插件提供，不包含在核心安装中。

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/matrix
```

本地检出（从 Git 仓库运行时）：

```bash
openclaw plugins install ./extensions/matrix
```

如果您在配置或引导过程中选择 Matrix，并且检测到本地检出，OpenClaw 将自动提供本地安装路径。

详情：[插件](/plugin)

## 设置

1) 安装 Matrix 插件：

- 从 npm：`openclaw plugins install @openclaw/matrix`
   - 从本地检出：`openclaw plugins install ./extensions/matrix`

2) 在homeserver上创建一个Matrix账户：

- 浏览托管选项：[https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/)
   - 或者自行托管。

3) 获取机器人账户的访问令牌：

- 使用您homeserver上的Matrix登录API和`curl`：

   ```bash
   curl --request POST \
     --url https://matrix.example.org/_matrix/client/v3/login \
     --header 'Content-Type: application/json' \
     --data '{
     "type": "m.login.password",
     "identifier": {
       "type": "m.id.user",
       "user": "your-user-name"
     },
     "password": "your-password"
   }'
   ```

- 将 `matrix.example.org` 替换为您的 homeserver URL。
- 或者设置 `channels.matrix.userId` + `channels.matrix.password`：OpenClaw 调用相同的登录端点，在 `~/.openclaw/credentials/matrix/credentials.json` 中存储访问令牌，并在下次启动时重复使用。

4) 配置凭据：

- 环境变量：`MATRIX_HOMESERVER`、`MATRIX_ACCESS_TOKEN`（或 `MATRIX_USER_ID` + `MATRIX_PASSWORD`）
   - 或配置文件：`channels.matrix.*`
   - 如果同时设置了环境变量和配置文件，则以配置文件为准。
   - 使用访问令牌时，用户 ID 会通过 `/whoami` 自动获取。
   - 如果已设置，`channels.matrix.userId` 应为完整的 Matrix 用户 ID（例如：`@bot:example.org`）。

5) 重启网关（或完成引导）。
6) 使用任何 Matrix 客户端（Element、Beeper 等；请参阅 https://matrix.org/ecosystem/clients/）与机器人发起私信或将其邀请到聊天室。Beeper）使用端到端加密时，需启用E2EE，因此请设置 `channels.matrix.encryption: true`），并验证设备。

最小配置（访问令牌，用户ID自动获取）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      dm: { policy: "pairing" }
    }
  }
}
```

E2EE配置（启用端到端加密）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      encryption: true,
      dm: { policy: "pairing" }
    }
  }
}
```

## 加密（端到端加密）

端到端加密通过 Rust 加密 SDK**支持**。

通过 `channels.matrix.encryption: true` 启用：

- 如果加密模块加载成功，加密聊天室中的消息将自动解密。
- 发送到加密聊天室的媒体将在发送时进行加密。
- 首次连接时，OpenClaw会提示您在其他会话中完成设备验证。
- 在另一个Matrix客户端（如Element）中验证设备，以启用密钥共享。
- 如果无法加载加密模块，端到端加密将被禁用，加密聊天室中的消息将无法解密；OpenClaw会记录一条警告日志。
- 如果您看到缺少加密模块的错误（例如，`@matrix-org/matrix-sdk-crypto-nodejs-*`），请允许构建脚本为 `@matrix-org/matrix-sdk-crypto-nodejs` 执行，并运行 `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs`，或使用 `node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js` 获取二进制文件。

加密状态按账户和访问令牌存储在 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/`（SQLite 数据库）中。同步状态与其并存于 `bot-storage.json` 中。如果访问令牌（设备）发生变化，将创建一个新的存储，并且机器人必须针对加密聊天室重新验证。

**设备验证：**
启用端到端加密后，机器人在启动时会要求您通过其他会话进行验证。请打开 Element（或其他客户端）并批准验证请求，以建立信任。验证完成后，机器人即可解密加密聊天室中的消息。

## 路由模型

- 回复始终返回到 Matrix。
- 私信共享代理的主要会话；聊天室映射到群组会话。

## 访问控制（私信）

- 默认：`channels.matrix.dm.policy = "pairing"`。未知发件人会收到配对码。
- 通过以下方式批准：
  - `openclaw pairing list matrix`
  - `openclaw pairing approve matrix <CODE>`
- 公开私信：`channels.matrix.dm.policy="open"` 加上 `channels.matrix.dm.allowFrom=["*"]`。
- `channels.matrix.dm.allowFrom` 接受用户 ID 或显示名称。当目录搜索可用时，向导会将显示名称解析为用户 ID。

## 聊天室（群组）

- 默认：`channels.matrix.groupPolicy = "allowlist"`（提及限制）。未设置时，使用 `channels.defaults.groupPolicy` 覆盖默认值。
- 使用 `channels.matrix.groups` 对聊天室进行白名单管理（聊天室 ID、别名或名称）：

```json5
{
  channels: {
    matrix: {
      groupPolicy: "allowlist",
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true }
      },
      groupAllowFrom: ["@owner:example.org"]
    }
  }
}
```

- `requireMention: false` 在该聊天室中启用自动回复。
- `groups."*"` 可以为不同聊天室的提及限制设置默认值。
- `groupAllowFrom` 可选地限制哪些发件人可以在聊天室中触发机器人。
- 每个聊天室的 `users` 白名单可进一步限制特定聊天室内的发件人。
- 配置向导会提示输入聊天室白名单（聊天室 ID、别名或名称），并在可能的情况下解析名称。
- 启动时，OpenClaw 会将白名单中的聊天室/用户名称解析为 ID，并记录映射；未解析的条目将保留为原始输入。
- 默认情况下自动接受邀请；可通过 `channels.matrix.autoJoin` 和 `channels.matrix.autoJoinAllowlist` 进行控制。
- 若要允许 **不加入任何聊天室**，请设置 `channels.matrix.groupPolicy: "disabled"`（或保持白名单为空）。
- 旧版密钥：`channels.matrix.rooms`（与 `groups` 形状相同）。

## 线程

- 支持回复线程化。
- `channels.matrix.threadReplies` 控制回复是否保留在线程中：
  - `off`、`inbound`（默认）、`always`
- `channels.matrix.replyToMode` 控制不在线程中回复时的回复元数据：
  - `off`（默认）、`first`、`all`

## 功能

| 功能 | 状态 |
|---------|--------|
| 直接消息 | ✅ 支持 |
| 聊天室 | ✅ 支持 |
| 线程 | ✅ 支持 |
| 媒体 | ✅ 支持 |
| E2EE | ✅ 支持（需加密模块） |
| 反应 | ✅ 支持（通过工具发送/读取） |
| 投票 | ✅ 支持发送；传入的投票开始会被转换为文本（忽略响应/结束） |
| 位置 | ✅ 支持（geo URI；忽略海拔） |
| 原生命令 | ✅ 支持 |

## 配置参考（矩阵）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.matrix.enabled`：启用或禁用频道启动。
- `channels.matrix.homeserver`：homeserver URL。
- `channels.matrix.userId`：Matrix 用户 ID（可选，需访问令牌）。
- `channels.matrix.accessToken`：访问令牌。
- `channels.matrix.password`：用于登录的密码（存储令牌）。
- `channels.matrix.deviceName`：设备显示名称。
- `channels.matrix.encryption`：启用 E2EE（默认：否）。
- `channels.matrix.initialSyncLimit`：初始同步限制。
- `channels.matrix.threadReplies`：`off | inbound | always`（默认：入站）。
- `channels.matrix.textChunkLimit`：出站文本分块大小（字符数）。
- `channels.matrix.chunkMode`：`length`（默认）或 `newline` 在长度分块之前按空行（段落边界）拆分。
- `channels.matrix.dm.policy`：`pairing | allowlist | open | disabled`（默认：配对）。
- `channels.matrix.dm.allowFrom`：DM 白名单（用户 ID 或显示名称）。`open` 需要 `"*"`。向导会在可能的情况下将名称解析为 ID。
- `channels.matrix.groupPolicy`：`allowlist | open | disabled`（默认：白名单）。
- `channels.matrix.groupAllowFrom`：群组消息的白名单发件人。
- `channels.matrix.allowlistOnly`：强制执行 DM 和聊天室的白名单规则。
- `channels.matrix.groups`：群组白名单 + 每个聊天室的设置映射。
- `channels.matrix.rooms`：旧版群组白名单/配置。
- `channels.matrix.replyToMode`：线程/标签的回复模式。
- `channels.matrix.mediaMaxMb`：入站/出站媒体上限（MB）。
- `channels.matrix.autoJoin`：邀请处理（`always | allowlist | off`，默认：始终）。
- `channels.matrix.autoJoinAllowlist`：允许自动加入的房间 ID/别名。
- `channels.matrix.actions`：每项操作的工具门控（反应/消息/钉住/成员信息/频道信息）。
