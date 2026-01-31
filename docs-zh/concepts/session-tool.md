---
summary: >-
  Agent session tools for listing sessions, fetching history, and sending
  cross-session messages
read_when:
  - Adding or modifying session tools
---
# 会话工具

目标：一套小巧且不易误用的工具集，使代理能够列出会话、获取历史记录并将消息发送到另一个会话。

## 工具名称
- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## 关键模型
- 主要直接聊天桶始终是字面关键 `"main"`（解析为当前代理的主要密钥）。
- 群聊使用 `agent:<agentId>:<channel>:group:<id>` 或 `agent:<agentId>:<channel>:channel:<id>`（传递完整密钥）。
- 定时任务使用 `cron:<job.id>`。
- 钩子除非显式设置，否则使用 `hook:<uuid>`。
- 节点会话除非显式设置，否则使用 `node-<nodeId>`。

`global` 和 `unknown` 是保留值，从不列出。如果出现 `session.scope = "global"`，我们将其别名为 `main`，适用于所有工具，以便调用方永远不会看到 `global`。

## sessions_list
以行数组的形式列出会话。

参数：
- `kinds?: string[]` 过滤器：任何 `"main" | "group" | "cron" | "hook" | "node" | "other"`
- `limit?: number` 最大行数（默认：服务器默认值，例如限制为200）
- `activeMinutes?: number` 仅限在N分钟内更新的会话
- `messageLimit?: number` 0 = 无消息（默认0）；>0 = 包括最后N条消息

行为：
- `messageLimit > 0` 每个会话获取 `chat.history` 并包括最后N条消息。
- 工具结果在列表输出中被过滤掉；使用 `sessions_history` 获取工具消息。
- 在**沙盒化**代理会话中运行时，会话工具默认具有**仅由生成可见性**（见下文）。

行形状（JSON）：
- `key`: 会话密钥（字符串）
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName`（如有可用，则为群组显示标签）
- `updatedAt`（毫秒）
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy`（如已设置，则为会话覆盖）
- `lastChannel`, `lastTo`
- `deliveryContext`（当可用时，归一化的 `{ channel, to, accountId }`）
- `transcriptPath`（从存储目录 + sessionId派生的最佳努力路径）
- `messages?`（仅当 `messageLimit > 0` 时）

## sessions_history
获取一个会话的对话记录。

参数：
- `sessionKey`（必填；接受会话密钥或来自 `sessions_list` 的 `sessionId`）
- `limit?: number` 最大消息数（服务器限制）
- `includeTools?: boolean`（默认为假）

行为：
- `includeTools=false` 过滤 `role: "toolResult"` 条消息。
- 以原始对话格式返回消息数组。
- 当提供 `sessionId` 时，OpenClaw将其解析为相应的会话密钥（缺失ID则报错）。

## sessions_send
将消息发送到另一个会话。

参数：
- `sessionKey`（必填；接受会话密钥或来自 `sessions_list` 的 `sessionId`）
- `message`（必填）
- `timeoutSeconds?: number`（默认 >0；0 = 发送后即忘）

行为：
- `timeoutSeconds = 0`: 将消息加入队列并返回 `{ runId, status: "accepted" }`。
- `timeoutSeconds > 0`: 等待最多N秒完成，然后返回 `{ runId, status: "ok", reply }`。
- 如果等待超时：`{ runId, status: "timeout", error }`。运行继续；稍后调用 `sessions_history`。
- 如果运行失败：`{ runId, status: "error", error }`。
- 交付公告在主运行完成后执行，属于尽力而为；`status: "ok"` 不保证公告已被送达。
- 通过网关 `agent.wait` 等待（服务器端），因此重新连接不会导致等待中断。
- 主运行注入代理间消息上下文。
- 主运行完成后，OpenClaw运行一个**回复循环**：
  - 第2轮及以后在请求者和目标代理之间交替进行。
  - 回复恰好 `REPLY_SKIP` 以停止乒乓效应。
  - 最大回合数为 `session.agentToAgent.maxPingPongTurns`（0–5，默认5）。
- 循环结束后，OpenClaw运行**代理间公告步骤**（仅针对目标代理）：
  - 回复恰好 `ANNOUNCE_SKIP` 以保持沉默。
  - 其他任何回复都会发送到目标频道。
  - 公告步骤包括原始请求 + 第一轮回复 + 最新乒乓回复。

## 渠道字段
- 对于群组，`channel` 是会话条目上记录的渠道。
- 对于直接聊天， `channel` 映射自 `lastChannel`。
- 对于cron/钩子/节点， `channel` 是 `internal`。
- 如果缺失， `channel` 是 `unknown`。

## 安全 / 发送政策
基于渠道/聊天类型的策略性阻止（不按会话ID）。

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

运行时覆盖（按会话条目）：
- `sendPolicy: "allow" | "deny"`（未设置 = 继承配置）
- 可通过 `sessions.patch` 或仅限所有者的 `/send on|off|inherit`（独立消息）设置。

执行点：
- `chat.send` / `agent`（网关）
- 自动回复交付逻辑

## sessions_spawn
在一个隔离的会话中启动一个子代理运行，并将结果通知回请求者聊天频道。

参数：
- `task`（必填）
- `label?`（可选；用于日志/UI）
- `agentId?`（可选；如果允许，则在另一代理ID下启动）
- `model?`（可选；覆盖子代理模型；无效值则报错）
- `runTimeoutSeconds?`（默认0；设置后，在N秒后中止子代理运行）
- `cleanup?`（`delete|keep`，默认 `keep`）

白名单：
- `agents.list[].subagents.allowAgents`: 允许通过 `agentId` 列出的代理ID（`["*"]` 允许任何）。默认：仅请求者代理。

发现：
- 使用 `agents_list` 发现哪些代理ID被允许用于 `sessions_spawn`。

行为：
- 使用 `deliver: false` 启动一个新的 `agent:<agentId>:subagent:<uuid>` 会话。
- 子代理默认配备完整的工具集，**但不包括会话工具**（可通过 `tools.subagents.tools` 配置）。
- 子代理不允许调用 `sessions_spawn`（禁止子代理 → 子代理启动）。
- 始终非阻塞：立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 完成后，OpenClaw运行子代理**公告步骤**，并将结果发布到请求者聊天频道。
- 在公告步骤中，回复恰好 `ANNOUNCE_SKIP` 以保持沉默。
- 公告回复被归一化为 `Status`/`Result`/`Notes`；`Status` 来自运行时结果（而非模型文本）。
- 子代理会话在 `agents.defaults.subagents.archiveAfterMinutes`（默认：60）后自动归档。
- 公告回复包括统计行（运行时间、标记数、会话密钥/会话ID、对话路径以及可选成本）。

## 沙盒会话可见性

沙盒会话可以使用会话工具，但默认情况下，它们只能看到通过 `sessions_spawn` 生成的会话。

配置：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        // default: "spawned"
        sessionToolsVisibility: "spawned" // or "all"
      }
    }
  }
}
```
