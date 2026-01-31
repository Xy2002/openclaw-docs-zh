---
summary: >-
  Sub-agents: spawning isolated agent runs that announce results back to the
  requester chat
read_when:
  - You want background/parallel work via the agent
  - You are changing sessions_spawn or sub-agent tool policy
---
# 子代理

子代理是从现有代理运行中派生的后台代理运行。它们在自己的会话中运行（`agent:<agentId>:subagent:<uuid>`），并在完成时，将结果**宣布**回请求者聊天频道。

## 斜杠命令

使用 `/subagents` 来检查或控制**当前会话**的子代理运行：
- `/subagents list`
- `/subagents stop <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`

`/subagents info` 显示运行元数据（状态、时间戳、会话 ID、转录路径、清理）。

主要目标：
- 在不阻塞主运行的情况下，并行化“研究/长任务/慢速工具”工作。
- 默认情况下保持子代理隔离（会话分离 + 可选沙箱）。
- 使工具界面难以被误用：子代理默认**不**获取会话工具。
- 避免嵌套扇出：子代理不能再派生子代理。

成本说明：每个子代理都有其**独立**的上下文和令牌使用量。对于繁重或重复性任务，为子代理设置更便宜的模型，并让主代理使用更高质量的模型。您可以通过 `agents.defaults.subagents.model` 或按代理覆盖来配置这一点。

## 工具

使用 `sessions_spawn`：
- 启动子代理运行（`deliver: false`，全局通道：`subagent`）
- 然后运行一个宣布步骤，并将宣布回复发布到请求者聊天频道
- 默认模型：继承调用方，除非您设置 `agents.defaults.subagents.model`（或按代理 `agents.list[].subagents.model`）；显式 `sessions_spawn.model` 仍优先。

工具参数：
- `task`（必填）
- `label?`（可选）
- `agentId?`（可选；如果允许，则在另一个代理 ID 下启动）
- `model?`（可选；覆盖子代理模型；无效值将被忽略，子代理将以默认模型运行，并在工具结果中发出警告）
- `thinking?`（可选；覆盖子代理运行的思考级别）
- `runTimeoutSeconds?`（默认 `0`；设置后，子代理运行将在 N 秒后中止）
- `cleanup?`（`delete|keep`，默认 `keep`）

白名单：
- `agents.list[].subagents.allowAgents`：可通过 `agentId` 指定的目标代理 ID 列表（`["*"]` 允许任何）。默认：仅请求者代理。

发现：
- 使用 `agents_list` 查看当前哪些代理 ID 允许用于 `sessions_spawn`。

自动归档：
- 子代理会话在 `agents.defaults.subagents.archiveAfterMinutes` 后自动归档（默认：60）。
- 归档使用 `sessions.delete`，并将转录文件重命名为 `*.deleted.<timestamp>`（在同一文件夹中）。
- `cleanup: "delete"` 在宣布后立即归档（仍通过重命名保留转录文件）。
- 自动归档是尽力而为；如果网关重启，待处理的计时器将丢失。
- `runTimeoutSeconds` 不会自动归档；它只停止运行。会话将保留至自动归档。

## 身份验证

子代理的身份验证由**代理 ID**决定，而非会话类型：
- 子代理会话密钥是 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储从该代理的 `agentDir` 加载。
- 主代理的身份验证配置文件作为**后备**合并进来；在发生冲突时，代理配置文件优先于主配置文件。

注意：合并是累加性的，因此主配置文件始终可用作后备。目前尚不支持按代理完全隔离的身份验证。

## 宣布

子代理通过宣布步骤报告结果：
- 宣布步骤在子代理会话中运行（而非请求者会话）。
- 如果子代理回复的内容与 `ANNOUNCE_SKIP` 完全一致，则不会发布任何内容。
- 否则，宣布回复将通过后续的 `agent` 调用（`deliver=true`）发布到请求者聊天频道。
- 宣布回复在可用时保留线程/话题路由（Slack 线程、Telegram 话题、Matrix 线程）。
- 宣布消息被规范化为稳定的模板：
  - `Status:` 根据运行结果生成（`success`、`error`、`timeout` 或 `unknown`）。
  - `Result:` 是来自宣布步骤的摘要内容（或 `(not available)` 如果缺失）。
  - `Notes:` 包含错误详情和其他有用上下文。
- `Status` 不是从模型输出推断的；它是从运行时结果信号中得出的。

宣布负载在末尾包含一行统计数据（即使被包装）：
- 运行时（例如，`runtime 5m12s`）
- 令牌使用量（输入/输出/总计）
- 当已配置模型定价时的估算成本（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId` 和转录路径（以便主代理可以通过 `sessions_history` 获取历史记录，或在磁盘上检查文件）

## 工具政策（子代理工具）

默认情况下，子代理获得**除会话工具外的所有工具**：
- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

可通过配置进行覆盖：

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1
      }
    }
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      }
    }
  }
}
```

## 并发性

子代理使用专用的进程内队列通道：
- 通道名称：`subagent`
- 并发性：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 将中止请求者会话，并停止从中派生的所有活动子代理运行。

## 限制

- 子代理宣布是**尽力而为**的。如果网关重启，待处理的“宣布回”工作将丢失。
- 子代理仍然共享相同的网关进程资源；请将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它会立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理上下文仅注入 `AGENTS.md` + `TOOLS.md`（不包括 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
