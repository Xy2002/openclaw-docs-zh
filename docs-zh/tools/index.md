---
summary: >-
  Agent tool surface for OpenClaw (browser, canvas, nodes, message, cron)
  replacing legacy `openclaw-*` skills
read_when:
  - Adding or modifying agent tools
  - Retiring or changing `openclaw-*` skills
---
# 工具（OpenClaw）

OpenClaw为浏览器、画布、节点和定时任务公开了**一流代理工具**。这些工具取代了旧的`openclaw-*`技能：工具具有类型安全，无需通过外壳执行，代理应直接依赖这些工具。

## 禁用工具

您可以通过`tools.allow`/`tools.deny`在`openclaw.json`中全局允许或禁止工具（禁止优先）。这可防止将未授权工具发送给模型提供商。

```json5
{
  tools: { deny: ["browser"] }
}
```

注意事项：
- 匹配不区分大小写。
- 支持`*`通配符（`"*"`表示所有工具）。
- 如果`tools.allow`仅引用未知或未加载的插件工具名称，OpenClaw会记录警告并忽略白名单，以确保核心工具仍然可用。

## 工具配置文件（基础白名单）

`tools.profile`在`tools.allow`/`tools.deny`之前设置**基础工具白名单**。每个代理可覆盖：`agents.list[].tools.profile`。

配置文件：
- `minimal`：仅`session_status`
- `coding`：`group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image`
- `messaging`：`group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`
- `full`：无限制（与未设置相同）

示例（默认仅支持消息传递，也允许Slack + Discord工具）：
```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"]
  }
}
```

示例（编码配置文件，但处处禁止执行/进程）：
```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"]
  }
}
```

示例（全局编码配置文件，仅支持消息传递的代理）：
```json5
{
  tools: { profile: "coding" },
  agents: {
    list: [
      {
        id: "support",
        tools: { profile: "messaging", allow: ["slack"] }
      }
    ]
  }
}
```

## 提供商特定的工具策略

使用`tools.byProvider`可以**进一步限制**特定提供商的工具
（或单个`provider/model`），而无需更改您的全局默认设置。每个代理可覆盖：`agents.list[].tools.byProvider`。

此策略在**基础工具配置文件之后**、**允许/禁止列表之前**应用，
因此只能缩小工具集。提供商密钥接受`provider`（例如`google-antigravity`）或
`provider/model`（例如`openai/gpt-5.2`）。

示例（保留全局编码配置文件，但为Google Antigravity提供最少的工具）：
```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" }
    }
  }
}
```

示例（针对不稳定端点的提供商/模型特定白名单）：
```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] }
    }
  }
}
```

示例（针对单个提供商的代理特定覆盖）：
```json5
{
  agents: {
    list: [
      {
        id: "support",
        tools: {
          byProvider: {
            "google-antigravity": { allow: ["message", "sessions_list"] }
          }
        }
      }
    ]
  }
}
```

## 工具组（简写）

工具策略（全局、代理、沙箱）支持扩展为多个工具的`group:*`条目。
在`tools.allow`/`tools.deny`中使用这些条目。

可用组：
- `group:runtime`：`exec`、`bash`、`process`
- `group:fs`：`read`、`write`、`edit`、`apply_patch`
- `group:sessions`：`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- `group:memory`：`memory_search`、`memory_get`
- `group:web`：`web_search`、`web_fetch`
- `group:ui`：`browser`、`canvas`
- `group:automation`：`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:openclaw`：所有内置OpenClaw工具（不包括提供商插件）

示例（仅允许文件工具 + 浏览器）：
```json5
{
  tools: {
    allow: ["group:fs", "browser"]
  }
}
```

## 插件 + 工具

插件可以在核心工具集之外注册**额外的工具**（以及CLI命令）。
有关安装 + 配置，请参阅[插件](/plugin)；有关如何将工具使用指南注入提示的信息，请参阅[技能](/tools/skills)。某些插件在提供工具的同时还提供自己的技能（例如语音通话插件）。

可选插件工具：
- [Lobster](/tools/lobster)：带可恢复批准的类型化工作流运行时（需要在网关主机上安装Lobster CLI）。
- [LLM Task](/tools/llm-task)：用于结构化工作流输出的仅JSON LLM步骤（可选模式验证）。

## 工具清单

### `apply_patch`
在一份或多份文件中应用结构化的补丁。适用于多块编辑。
实验性：通过`tools.exec.applyPatch.enabled`启用（仅限OpenAI模型）。

### `exec`
在工作区中运行shell命令。

核心参数：
- `command`（必填）
- `yieldMs`（超时后自动后台运行，默认10000）
- `background`（立即后台运行）
- `timeout`（秒；超过此值则终止进程，默认1800）
- `elevated`（布尔值；如果启用了提升模式，则在主机上运行；仅当代理处于沙箱模式时才会改变行为）
- `host`（`sandbox | gateway | node`）
- `security`（`deny | allowlist | full`）
- `ask`（`off | on-miss | always`）
- `node`（用于`host=node`的节点ID/名称）
- 需要真正的TTY？设置`pty: true`。

注意事项：
- 后台运行时返回带有`sessionId`的`status: "running"`。
- 使用`process`轮询/记录/写入/终止/清除后台会话。
- 如果`process`被禁止，`exec`将同步运行，并忽略`yieldMs`/`background`。
- `elevated`受`tools.elevated`以及任何`agents.list[].tools.elevated`覆盖的约束（两者都必须允许），并且是`host=gateway` + `security=full`的别名。
- `elevated`仅在代理处于沙箱模式时才会改变行为（否则无效）。
- `host=node`可以针对macOS伴侣应用或无头节点主机（`openclaw node run`）。
- 网关/节点批准和白名单：[执行批准](/tools/exec-approvals)。

### `process`
管理后台执行会话。

核心动作：
- `list`、`poll`、`log`、`write`、`kill`、`clear`、`remove`

注意事项：
- 当完成时，`poll`会返回新的输出和退出状态。
- `log`支持基于行的`offset`/`limit`（省略`offset`以获取最后N行）。
- `process`按代理划分；其他代理的会话不可见。

### `web_search`
使用Brave Search API搜索网络。

核心参数：
- `query`（必填）
- `count`（1–10；默认来自`tools.web.search.maxResults`）

注意事项：
- 需要Brave API密钥（推荐：`openclaw configure --section web`，或设置`BRAVE_API_KEY`）。
- 通过`tools.web.search.enabled`启用。
- 响应会被缓存（默认15分钟）。
- 设置请参见[网络工具](/tools/web)。

### `web_fetch`
从URL获取并提取可读内容（HTML → markdown/文本）。

核心参数：
- `url`（必填）
- `extractMode`（`markdown` | `text`）
- `maxChars`（截断长页面）

注意事项：
- 通过`tools.web.fetch.enabled`启用。
- 响应会被缓存（默认15分钟）。
- 对于JS密集型网站，建议使用浏览器工具。
- 设置请参见[网络工具](/tools/web)。
- 可选的反机器人后备方案请参见[Firecrawl](/tools/firecrawl)。

### `browser`
控制专用的由OpenClaw管理的浏览器。

核心动作：
- `status`、`start`、`stop`、`tabs`、`open`、`focus`、`close`
- `snapshot`（aria/ai）
- `screenshot`（返回图像块 + `MEDIA:<path>`）
- `act`（UI操作：点击/输入/按下/悬停/拖动/选择/填充/调整大小/等待/评估）
- `navigate`、`console`、`pdf`、`upload`、`dialog`

配置文件管理：
- `profiles` — 列出所有浏览器配置文件及其状态
- `create-profile` — 创建新配置文件并自动分配端口（或`cdpUrl`）
- `delete-profile` — 停止浏览器，删除用户数据，从配置中移除（仅本地）
- `reset-profile` — 杀死配置文件端口上的孤儿进程（仅本地）

常见参数：
- `profile`（可选；默认为`browser.defaultProfile`）
- `target`（`sandbox` | `host` | `node`）
- `node`（可选；选择特定的节点ID/名称）

注意事项：
- 需要`browser.enabled=true`（默认是`true`；设置`false`可禁用）。
- 所有操作都接受可选的`profile`参数，以支持多实例。
- 当`profile`被省略时，使用`browser.defaultProfile`（默认为“chrome”）。
- 配置文件名称：仅小写字母数字和连字符（最多64个字符）。
- 端口范围：18800-18899（最多约100个配置文件）。
- 远程配置文件仅可附加（无法启动/停止/重置）。
- 如果连接了具备浏览器功能的节点，该工具可能会自动路由到该节点（除非您固定`target`）。
- 当安装了Playwright时，`snapshot`默认为`ai`；使用`aria`来获取无障碍树。
- `snapshot`还支持角色快照选项（`interactive`、`compact`、`depth`、`selector`），这些选项会返回类似于`e12`的引用。
- `act`需要来自`snapshot`的`ref`（来自AI快照的数值`12`，或来自角色快照的`e12`）；对于罕见的CSS选择器需求，使用`evaluate`。
- 默认情况下避免使用`act` → `wait`；仅在特殊情况下使用（没有可靠的UI状态可供等待）。
- `upload`可以选择传递一个`ref`，以便在武装后自动点击。
- `upload`还支持`inputRef`（aria引用）或`element`（CSS选择器），以直接设置`<input type="file">`。

### `canvas`
驱动节点Canvas（呈现、评估、快照、A2UI）。

核心动作：
- `present`、`hide`、`navigate`、`eval`
- `snapshot`（返回图像块 + `MEDIA:<path>`）
- `a2ui_push`、`a2ui_reset`

注意事项：
- 底层使用网关`node.invoke`。
- 如果没有提供`node`，该工具会选择一个默认值（单个连接的节点或本地mac节点）。
- A2UI仅限v0.8版本（没有`createSurface`）；CLI会拒绝含有行错误的v0.9 JSONL。
- 快速测试：`openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"`。

### `nodes`
发现并定位配对节点；发送通知；捕获摄像头/屏幕。

核心动作：
- `status`、`describe`
- `pending`、`approve`、`reject`（配对）
- `notify`（macOS `system.notify`）
- `run`（macOS `system.run`）
- `camera_snap`、`camera_clip`、`screen_record`
- `location_get`

注意事项：
- 摄像头/屏幕命令要求节点应用处于前台。
- 图片返回图像块 + `MEDIA:<path>`。
- 视频返回`FILE:<path>`（mp4）。
- 位置返回一个JSON负载（纬度/经度/精度/时间戳）。
- `run`参数：`command` argv数组；可选`cwd`、`env`（`KEY=VAL`）、`commandTimeoutMs`、`invokeTimeoutMs`、`needsScreenRecording`。

示例（`run`）：
```json
{
  "action": "run",
  "node": "office-mac",
  "command": ["echo", "Hello"],
  "env": ["FOO=bar"],
  "commandTimeoutMs": 12000,
  "invokeTimeoutMs": 45000,
  "needsScreenRecording": false
}
```

### `image`
使用配置的图像模型分析图像。

核心参数：
- `image`（必填路径或URL）
- `prompt`（可选；默认为“描述图像。”）
- `model`（可选覆盖）
- `maxBytesMb`（可选大小上限）

注意事项：
- 仅在配置了`agents.defaults.imageModel`（主模型或备用模型）时可用，或者当可以从您的默认模型 + 配置的身份验证中推断出隐式图像模型时可用（尽力匹配）。
- 直接使用图像模型（独立于主聊天模型）。

### `message`
在Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams之间发送消息和频道操作。

核心动作：
- `send`（文本 + 可选媒体；MS Teams还支持`card`用于自适应卡片）
- `poll`（WhatsApp/Discord/MS Teams轮询）
- `react`/`reactions`/`read`/`edit`/`delete`
- `pin`/`unpin`/`list-pins`
- `permissions`
- `thread-create`/`thread-list`/`thread-reply`
- `search`
- `sticker`
- `member-info`/`role-info`
- `emoji-list`/`emoji-upload`/`sticker-upload`
- `role-add`/`role-remove`
- `channel-info`/`channel-list`
- `voice-status`
- `event-list`/`event-create`
- `timeout`/`kick`/`ban`

注意事项：
- `send`通过网关路由WhatsApp；其他渠道直接发送。
- `poll`对WhatsApp和MS Teams使用网关；Discord轮询直接进行。
- 当消息工具调用与活跃的聊天会话绑定时，发送被限制在该会话的目标范围内，以避免跨上下文泄漏。

### `cron`
管理网关的cron作业和唤醒。

核心动作：
- `status`、`list`
- `add`、`update`、`remove`、`run`、`runs`
- `wake`（排队系统事件 + 可选即时心跳）

注意事项：
- `add`期望一个完整的cron作业对象（与`cron.add` RPC相同的模式）。
- `update`使用`{ id, patch }`。

### `gateway`
重启或在运行中更新网关进程。

核心动作：
- `restart`（授权并发送`SIGUSR1`以进行进程内重启；`openclaw gateway`进行原地重启）
- `config.get`/`config.schema`
- `config.apply`（验证 + 写入配置 + 重启 + 唤醒）
- `config.patch`（合并部分更新 + 重启 + 唤醒）
- `update.run`（运行更新 + 重启 + 唤醒）

注意事项：
- 使用`delayMs`（默认2000）以避免中断正在进行的回复。
- `restart`默认关闭；通过`commands.restart: true`启用。

### `sessions_list`/`sessions_history`/`sessions_send`/`sessions_spawn`/`session_status`
列出会话、检查对话历史或转发到另一个会话。

核心参数：
- `sessions_list`：`kinds?`、`limit?`、`activeMinutes?`、`messageLimit?`（0 = 无）
- `sessions_history`：`sessionKey`（或`sessionId`）、`limit?`、`includeTools?`
- `sessions_send`：`sessionKey`（或`sessionId`）、`message`、`timeoutSeconds?`（0 = 即发即弃）
- `sessions_spawn`：`task`、`label?`、`agentId?`、`model?`、`runTimeoutSeconds?`、`cleanup?`
- `session_status`：`sessionKey?`（默认当前；接受`sessionId`），`model?`（`default`清除覆盖）

注意事项：
- `main`是规范的直接聊天密钥；全球/未知密钥被隐藏。
- `messageLimit > 0`按会话获取最近N条消息（已过滤工具消息）。
- `sessions_send`在`timeoutSeconds > 0`完成后等待最终完成。
- 发送/公告在完成之后进行，且为尽力而为；`status: "ok"`确认代理运行已完成，而非公告已送达。
- `sessions_spawn`启动子代理运行，并向请求者聊天发布一条公告回复。
- `sessions_spawn`是非阻塞的，会立即返回`status: "accepted"`。
- `sessions_send`运行一次回信乒乓（回复`REPLY_SKIP`以停止；最大回合数通过`session.agentToAgent.maxPingPongTurns`设定，0–5）。
- 在乒乓结束后，目标代理运行一个**公告步骤**；回复`ANNOUNCE_SKIP`以抑制公告。

### `agents_list`
列出当前会话可能通过`sessions_spawn`指向的代理ID。

注意事项：
- 结果受每代理白名单限制（`agents.list[].subagents.allowAgents`）。
- 当`["*"]`被配置时，该工具包括所有配置的代理，并标记`allowAny: true`。

## 参数（通用）

网关支持的工具（`canvas`、`nodes`、`cron`）：
- `gatewayUrl`（默认为`ws://127.0.0.1:18789`）
- `gatewayToken`（如果启用了身份验证）
- `timeoutMs`

浏览器工具：
- `profile`（可选；默认为`browser.defaultProfile`）
- `target`（`sandbox` | `host` | `node`）
- `node`（可选；固定特定的节点ID/名称）

## 推荐的代理流程

浏览器自动化：
1) `browser` → `status`/`start`
2) `snapshot`（ai或aria）
3) `act`（点击/输入/按下）
4) 如果需要视觉确认，使用`screenshot`

画布渲染：
1) `canvas` → `present`
2) `a2ui_push`（可选）
3) `snapshot`

节点定位：
1) `nodes` → `status`
2) 在选定的节点上使用`describe`
3) 使用`notify`/`run`/`camera_snap`/`screen_record`

## 安全

- 避免直接使用`system.run`；仅在获得明确用户同意的情况下使用`nodes` → `run`。
- 尊重用户对摄像头/屏幕捕获的同意。
- 使用`status/describe`在调用媒体命令前确保已获得权限。

## 工具如何呈现给代理

工具通过两个并行渠道呈现：

1) **系统提示文本**：人类可读的列表 + 指导。
2) **工具模式**：发送给模型API的结构化函数定义。

这意味着代理可以看到“有哪些工具”以及“如何调用它们”。如果某个工具未出现在系统提示或模式中，模型就无法调用它。
