---
title: Outbound Session Mirroring Refactor (Issue
description: >-
  Track outbound session mirroring refactor notes, decisions, tests, and open
  items.
---
# 出站会话镜像重构（问题 #1520）

## 状态
- 正在进行中。
- 为出站镜像更新了核心和插件的通道路由。
- 网关发送现在会在省略 sessionKey 时推导目标会话。

## 背景
此前，出站发送被镜像到*当前*代理会话（工具会话密钥），而不是目标通道会话。由于入站路由使用通道/对等会话密钥，出站响应会进入错误的会话，导致首次联系目标通常缺少会话条目。

## 目标
- 将出站消息镜像到目标通道会话密钥。
- 在出站时缺失会话条目时创建会话条目。
- 保持线程/话题范围与入站会话密钥一致。
- 涵盖核心通道以及捆绑扩展。

## 实现摘要
- 新的出站会话路由辅助函数：
  - `src/infra/outbound/outbound-session.ts`
  - `resolveOutboundSessionRoute` 使用 `buildAgentSessionKey`（dmScope + identityLinks）构建目标 sessionKey。
  - `ensureOutboundSessionEntry` 通过 `recordSessionMetaFromInbound` 写入最小化的 `MsgContext`。
- `runMessageAction`（发送）推导目标 sessionKey，并将其传递给 `executeSendAction` 进行镜像。
- `message-tool` 不再直接镜像；它仅从当前会话密钥解析 agentId。
- 插件发送路径通过 `appendAssistantMessageToSessionTranscript` 使用推导出的 sessionKey 进行镜像。
- 网关发送在未提供目标会话密钥时推导一个目标会话密钥（默认代理），并确保创建会话条目。

## 线程/话题处理
- Slack：replyTo/threadId -> `resolveThreadSessionKeys`（后缀）。
- Discord：threadId/replyTo -> `resolveThreadSessionKeys` 结合 `useSuffix=false`，以匹配入站逻辑（线程频道 ID 已经限定会话范围）。
- Telegram：主题 ID 通过 `buildTelegramGroupPeerId` 映射到 `chatId:topic:<id>`。

## 涵盖的扩展
- Matrix、MS Teams、Mattermost、BlueBubbles、Nextcloud Talk、Zalo、Zalo Personal、Nostr、Tlon。
- 注意事项：
  - Mattermost 目标现在会剥离 `@`，以便进行 DM 会话密钥路由。
  - Zalo Personal 对于 1:1 目标使用 DM 对等类型（仅当 `group:` 存在时才视为群组）。
  - BlueBubbles 群组目标会剥离 `chat_*` 前缀，以匹配入站会话密钥。
  - Slack 自动线程镜像以不区分大小写的方式匹配频道 ID。
  - 网关发送在镜像之前会将提供的会话密钥转换为小写。

## 决策
- **网关发送会话推导**：如果提供了 `sessionKey`，则使用它。如果省略，则根据目标 + 默认代理推导 sessionKey 并在此处进行镜像。
- **会话条目创建**：始终使用 `recordSessionMetaFromInbound`，且 `Provider/From/To/ChatType/AccountId/Originating*` 与入站格式保持一致。
- **目标规范化**：出站路由在可用时使用解析后的目标（post `resolveChannelTarget`）。
- **会话密钥大小写**：在写入和迁移过程中，将会话密钥规范为小写。

## 添加或更新的测试
- `src/infra/outbound/outbound-session.test.ts`
  - Slack 线程会话密钥。
  - Telegram 主题会话密钥。
  - 包含 Discord 的 dmScope identityLinks 测试。
- `src/agents/tools/message-tool.test.ts`
  - 从会话密钥推导 agentId（不传递会话密钥）。
- `src/gateway/server-methods/send.test.ts`
  - 在省略会话密钥时推导会话密钥并创建会话条目。

## 待办事项 / 后续工作
- 语音通话插件使用自定义的 `voice:<phone>` 会话密钥。此处尚未标准化出站映射；如果 message-tool 应该支持语音通话发送，请添加明确的映射。
- 确认是否有任何外部插件使用超出捆绑集的非标准 `From/To` 格式。

## 涉及的文件
- `src/infra/outbound/outbound-session.ts`
- `src/infra/outbound/outbound-send-service.ts`
- `src/infra/outbound/message-action-runner.ts`
- `src/agents/tools/message-tool.ts`
- `src/gateway/server-methods/send.ts`
- 测试位于：
  - `src/infra/outbound/outbound-session.test.ts`
  - `src/agents/tools/message-tool.test.ts`
  - `src/gateway/server-methods/send.test.ts`
