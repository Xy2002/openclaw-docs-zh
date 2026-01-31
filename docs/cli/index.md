---
summary: 'OpenClaw CLI reference for `openclaw` commands, subcommands, and options'
read_when:
  - Adding or modifying CLI commands or options
  - Documenting new command surfaces
---
# CLI 参考

本页面描述了当前 CLI 的行为。如果命令发生更改，请更新此文档。

## 命令页面

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`plugins`](/cli/plugins)（插件命令）
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`skills`](/cli/skills)
- [`voicecall`](/cli/voicecall)（插件；若已安装）

## 全局标志

- `--dev`：在 `~/.openclaw-dev` 下隔离状态，并调整默认端口。
- `--profile <name>`：在 `~/.openclaw-<name>` 下隔离状态。
- `--no-color`：禁用 ANSI 颜色。
- `--update`：是 `openclaw update` 的简写（仅适用于源码安装）。
- `-V`、`--version`、`-v`：打印版本并退出。

## 输出样式

- ANSI 颜色和进度指示器仅在 TTY 会话中渲染。
- OSC-8 超链接在支持的终端中显示为可点击链接；否则，我们回退到普通 URL。
- `--json`（以及在支持的情况下 `--plain`）禁用样式以获得简洁的输出。
- `--no-color` 禁用 ANSI 样式；同时也会尊重 `NO_COLOR=1`。
- 长时间运行的命令会显示进度指示器（在支持的情况下使用 OSC 9;4）。

## 色彩 palette

OpenClaw 在 CLI 输出中使用龙虾色 palette。

- `accent` (#FF5A2D)：标题、标签、主要高亮。
- `accentBright` (#FF7A3D)：命令名称、强调。
- `accentDim` (#D14A22)：次要高亮文本。
- `info` (#FF8A5B)：信息性数值。
- `success` (#2FBF71)：成功状态。
- `warn` (#FFB020)：警告、回退、注意。
- `error` (#E23D2D)：错误、失败。
- `muted` (#8B7F77)：弱化、元数据。

Palette 的权威来源：`src/terminal/palette.ts`（又称“龙虾缝”）。

## 命令树

```
openclaw [--dev] [--profile <name>] <command>
  setup
  onboard
  configure
  config
    get
    set
    unset
  doctor
  security
    audit
  reset
  uninstall
  update
  channels
    list
    status
    logs
    add
    remove
    login
    logout
  skills
    list
    info
    check
  plugins
    list
    info
    install
    enable
    disable
    doctor
  memory
    status
    index
    search
  message
  agent
  agents
    list
    add
    delete
  acp
  status
  health
  sessions
  gateway
    call
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth add|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
  devices
  node
    run
    status
    install
    uninstall
    start
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  pairing
    list
    approve
  docs
  dns
    setup
  tui
```

注意：插件可以添加额外的顶级命令（例如 `openclaw voicecall`）。

## 安全

- `openclaw security audit` — 审计配置 + 本地状态，以防范常见的安全漏洞。
- `openclaw security audit --deep` — 尽力而为的实时网关探测。
- `openclaw security audit --fix` — 加强安全默认设置，并调整状态/配置的权限。

## 插件

管理扩展及其配置：

- `openclaw plugins list` — 发现插件（使用 `--json` 获取机器可读输出）。
- `openclaw plugins info <id>` — 显示插件的详细信息。
- `openclaw plugins install <path|.tgz|npm-spec>` — 安装插件（或将插件路径添加到 `plugins.load.paths`）。
- `openclaw plugins enable <id>`/`disable <id>` — 切换 `plugins.entries.<id>.enabled`。
- `openclaw plugins doctor` — 报告插件加载错误。

大多数插件更改需要重启网关。请参阅 [/plugin](/plugin)。

## 内存

对 `MEMORY.md` + `memory/*.md` 进行向量搜索：

- `openclaw memory status` — 显示索引统计信息。
- `openclaw memory index` — 重新索引内存文件。
- `openclaw memory search "<query>"` — 对内存进行语义搜索。

## 聊天斜杠命令

聊天消息支持 `/...` 命令（文本和原生）。请参阅 [/tools/slash-commands](/tools/slash-commands)。

亮点：
- `/status` 用于快速诊断。
- `/config` 用于持久化的配置更改。
- `/debug` 用于仅在运行时生效的配置覆盖（内存而非磁盘；需要 `commands.debug: true`）。

## 设置 + 上手

### `setup`
初始化配置 + 工作区。

选项：
- `--workspace <dir>`：代理工作区路径（默认 `~/.openclaw/workspace`）。
- `--wizard`：运行上手向导。
- `--non-interactive`：在没有提示的情况下运行向导。
- `--mode <local|remote>`：向导模式。
- `--remote-url <url>`：远程网关 URL。
- `--remote-token <token>`：远程网关令牌。

当存在任何向导标志时（`--non-interactive`、`--mode`、`--remote-url`、`--remote-token`），向导会自动运行。

### `onboard`
交互式向导，用于设置网关、工作区和技能。

选项：
- `--workspace <dir>`
- `--reset`（在向导之前重置配置 + 凭证 + 会话 + 工作区）
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>`（manual 是 advanced 的别名）
- `--auth-choice <setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|ai-gateway-api-key|moonshot-api-key|kimi-code-api-key|synthetic-api-key|venice-api-key|gemini-api-key|zai-api-key|apiKey|minimax-api|minimax-api-lightning|opencode-zen|skip>`
- `--token-provider <id>`（非交互式；与 `--auth-choice token` 一起使用）
- `--token <token>`（非交互式；与 `--auth-choice token` 一起使用）
- `--token-profile-id <id>`（非交互式；默认：`<provider>:manual`）
- `--token-expires-in <duration>`（非交互式；例如 `365d`、`12h`）
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon`（别名：`--skip-daemon`）
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-health`
- `--skip-ui`
- `--node-manager <npm|pnpm|bun>`（推荐使用 pnpm；不推荐在 Gateway 运行时使用 bun）
- `--json`

### `configure`
交互式配置向导（模型、渠道、技能、网关）。

### `config`
非交互式配置助手（获取/设置/取消设置）。运行 `openclaw config` 且不带子命令时，将启动向导。

子命令：
- `config get <path>`：打印配置值（点/方括号路径）。
- `config set <path> <value>`：设置值（JSON5 或原始字符串）。
- `config unset <path>`：删除一个值。

### `doctor`
健康检查 + 快速修复（配置 + 网关 + 旧版服务）。

选项：
- `--no-workspace-suggestions`：禁用工作区内存提示。
- `--yes`：接受默认设置而不提示（无头模式）。
- `--non-interactive`：跳过提示；仅应用安全迁移。
- `--deep`：扫描系统服务，查找额外的网关安装。

## 渠道助手

### `channels`
管理聊天渠道账户（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/MS Teams）。

子命令：
- `channels list`：显示已配置的渠道和认证资料。
- `channels status`：检查网关可达性和渠道健康状况（`--probe` 执行额外的检查；使用 `openclaw health` 或 `openclaw status --deep` 进行网关健康探测）。
- 提示：`channels status` 在检测到常见配置错误时，会打印警告并提供修复建议（然后引导您前往 `openclaw doctor`）。
- `channels logs`：从网关日志文件中显示最近的渠道日志。
- `channels add`：在未传递任何标志时，采用向导式设置；标志切换到非交互式模式。
- `channels remove`：默认禁用；传递 `--delete` 可以在不提示的情况下移除配置条目。
- `channels login`：交互式渠道登录（仅限 WhatsApp Web）。
- `channels logout`：注销渠道会话（如果支持）。

常见选项：
- `--channel <name>`：`whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`：渠道账户 ID（默认 `default`）
- `--name <label>`：账户的显示名称

`channels login` 选项：
- `--channel <channel>`（默认 `whatsapp`；支持 `whatsapp`/`web`）
- `--account <id>`
- `--verbose`

`channels logout` 选项：
- `--channel <channel>`（默认 `whatsapp`）
- `--account <id>`

`channels list` 选项：
- `--no-usage`：跳过模型提供商使用情况/配额快照（仅 OAuth/API 支持）。
- `--json`：输出 JSON（包括使用情况，除非设置了 `--no-usage`）。

`channels logs` 选项：
- `--channel <name|all>`（默认 `all`）
- `--lines <n>`（默认 `200`）
- `--json`

更多详情：[/concepts/oauth](/concepts/oauth)

示例：
```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `skills`
列出并检查可用技能及就绪信息。

子命令：
- `skills list`：列出技能（无子命令时默认）。
- `skills info <name>`：显示单个技能的详细信息。
- `skills check`：总结已满足与缺失的要求。

选项：
- `--eligible`：仅显示已就绪的技能。
- `--json`：输出 JSON（无样式）。
- `-v`、`--verbose`：包含缺失要求的详细信息。

提示：使用 `npx clawhub` 来搜索、安装和同步技能。

### `pairing`
批准跨渠道的 DM 配对请求。

子命令：
- `pairing list <channel> [--json]`
- `pairing approve <channel> <code> [--notify]`

### `webhooks gmail`
Gmail Pub/Sub 钩子设置 + 运行器。请参阅 [/automation/gmail-pubsub](/automation/gmail-pubsub)。

子命令：
- `webhooks gmail setup`（需要 `--account <email>`；支持 `--project`、`--topic`、`--subscription`、`--label`、`--hook-url`、`--hook-token`、`--push-token`、`--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、`--renew-minutes`、`--tailscale`、`--tailscale-path`、`--tailscale-target`、`--push-endpoint`、`--json`）
- `webhooks gmail run`（针对相同标志的运行时覆盖）

### `dns setup`
广域发现 DNS 助手（CoreDNS + Tailscale）。请参阅 [/gateway/discovery](/gateway/discovery)。

选项：
- `--apply`：安装/更新 CoreDNS 配置（需要 sudo；仅适用于 macOS）。

## 消息传递 + 代理

### `message`
统一的出站消息传递 + 渠道操作。

详情：[/cli/message](/cli/message)

子命令：
- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

示例：
- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`
通过网关运行一次代理回合（或嵌入 `--local`）。

必需：
- `--message <text>`

选项：
- `--to <dest>`（用于会话密钥和可选交付）
- `--session-id <id>`
- `--thinking <off|minimal|low|medium|high|xhigh>`（仅 GPT-5.2 + Codex 模型）
- `--verbose <on|full|off>`
- `--channel <whatsapp|telegram|discord|slack|mattermost|signal|imessage|msteams>`
- `--local`
- `--deliver`
- `--json`
- `--timeout <seconds>`

### `agents`
管理隔离的代理（工作区 + 认证 + 路由）。

#### `agents list`
列出已配置的代理。

选项：
- `--json`
- `--bindings`

#### `agents add [name]`
添加一个新的隔离代理。除非传递了标志（或 `--non-interactive`），否则会运行引导向导；在非交互式模式下，必须使用 `--workspace`。

选项：
- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（可重复）
- `--non-interactive`
- `--json`

绑定规范使用 `channel[:accountId]`。当 WhatsApp 缺少 `accountId` 时，将使用默认账户 ID。

#### `agents delete <id>`
删除代理并清理其工作区 + 状态。

选项：
- `--force`
- `--json`

### `acp`
运行连接 IDE 和网关的 ACP 桥。

完整选项和示例请参见 [`acp`](/cli/acp)。

### `status`
显示关联会话的健康状况和最近的接收者。

选项：
- `--json`
- `--all`（全面诊断；只读，可粘贴）
- `--deep`（探测渠道）
- `--usage`（显示模型提供商的使用情况/配额）
- `--timeout <ms>`
- `--verbose`
- `--debug`（是 `--verbose` 的别名）

注释：
- 概览包括网关 + 节点主机服务的状态（如有）。

### 使用跟踪
当有 OAuth/API 凭据时，OpenClaw 可以显示提供商的使用情况/配额。

显示内容：
- `/status`（在可用时添加一行简短的提供商使用情况）
- `openclaw status --usage`（打印完整的提供商细分）
- macOS 菜单栏（上下文中的“使用”部分）

注释：
- 数据直接来自提供商的使用端点（无估算）。
- 提供商：Anthropic、GitHub Copilot、OpenAI Codex OAuth，以及 Gemini CLI/Antigravity，前提是这些提供商插件已启用。
- 如果没有匹配的凭据，使用情况将被隐藏。
- 更多详情请参阅 [使用跟踪](/concepts/usage-tracking)。

### `health`
从正在运行的网关获取健康信息。

选项：
- `--json`
- `--timeout <ms>`
- `--verbose`

### `sessions`
列出存储的对话会话。

选项：
- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`

## 重置 / 卸载

### `reset`
重置本地配置/状态（保留 CLI 安装）。

选项：
- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

注释：
- `--non-interactive` 需要 `--scope` 和 `--yes`。

### `uninstall`
卸载网关服务 + 本地数据（CLI 保留）。

选项：
- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

注释：
- `--non-interactive` 需要 `--yes` 和明确的范围（或 `--all`）。

## 网关

### `gateway`
运行 WebSocket 网关。

选项：
- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset`（重置开发配置 + 凭证 + 会话 + 工作区）
- `--force`（终止端口上的现有监听器）
- `--verbose`
- `--claude-cli-logs`
- `--ws-log <auto|full|compact>`
- `--compact`（是 `--ws-log compact` 的别名）
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`
管理网关服务（launchd/systemd/schtasks）。

子命令：
- `gateway status`（默认探测网关 RPC）
- `gateway install`（安装服务）
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

注释：
- `gateway status` 默认使用服务解析的端口/配置来探测网关 RPC（可用 `--url/--token/--password` 进行覆盖）。
- `gateway status` 支持 `--no-probe`、`--deep` 和 `--json` 用于脚本编写。
- `gateway status` 还会在检测到时显示遗留或额外的网关服务（`--deep` 添加系统级扫描）。以 Profile 命名的 OpenClaw 服务被视为一流服务，不会被标记为“额外”。
- `gateway status` 打印 CLI 使用的配置路径与服务可能使用的配置路径（服务环境），以及解析后的探测目标 URL。
- `gateway install|uninstall|start|stop|restart` 支持 `--json` 用于脚本编写（默认输出保持人性化）。
- `gateway install` 默认使用 Node 运行时；不推荐使用 bun（WhatsApp/Telegram 错误）。
- `gateway install` 选项：`--port`、`--runtime`、`--token`、`--force`、`--json`。

### `logs`
通过 RPC 尾部查看网关文件日志。

注释：
- TTY 会话会呈现彩色、结构化的视图；非 TTY 则回退到纯文本。
- `--json` 输出分隔行的 JSON（每行一个日志事件）。

示例：
```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

### `gateway <subcommand>`
网关 CLI 助手（使用 `--url`、`--token`、`--password`、`--timeout`、`--expect-final` 处理 RPC 子命令）。

子命令：
- `gateway call <method> [--params <json>]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

常见 RPC：
- `config.apply`（验证 + 写入配置 + 重启 + 唤醒）
- `config.patch`（合并部分更新 + 重启 + 唤醒）
- `update.run`（执行更新 + 重启 + 唤醒）

提示：直接调用 `config.set`/`config.apply`/`config.patch` 时，如果已有配置，应从 `config.get` 传递 `baseHash`。

## 模型

有关回退行为和扫描策略，请参阅 [/concepts/models](/concepts/models)。

首选 Anthropic 认证（设置令牌）：

```bash
claude setup-token
openclaw models auth setup-token --provider anthropic
openclaw models status
```

### `models`（根）
`openclaw models` 是 `models status` 的别名。

根选项：
- `--status-json`（是 `models status --json` 的别名）
- `--status-plain`（是 `models status --plain` 的别名）

### `models list`
选项：
- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`
选项：
- `--json`
- `--plain`
- `--check`（退出 1=已过期/缺失，2=即将到期）
- `--probe`（对已配置的认证资料进行实时探测）
- `--probe-provider <name>`
- `--probe-profile <id>`（可重复或用逗号分隔）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`

始终包括认证概览以及认证库中资料的 OAuth 到期状态。
`--probe` 执行实时请求（可能会消耗令牌并触发速率限制）。

### `models set <model>`
设置 `agents.defaults.model.primary`。

### `models set-image <model>`
设置 `agents.defaults.imageModel.primary`。

### `models aliases list|add|remove`
选项：
- `list`: `--json`、`--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`
选项：
- `list`: `--json`、`--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`
选项：
- `list`: `--json`、`--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`
选项：
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|setup-token|paste-token`
选项：
- `add`：交互式认证助手
- `setup-token`：`--provider <name>`（默认 `anthropic`）、`--yes`
- `paste-token`：`--provider <name>`、`--profile-id <id>`、`--expires-in <duration>`

### `models auth order get|set|clear`
选项：
- `get`：`--provider <name>`、`--agent <id>`、`--json`
- `set`：`--provider <name>`、`--agent <id>`、`<profileIds...>`
- `clear`：`--provider <name>`、`--agent <id>`

## 系统

### `system event`
排队一个系统事件，并可选择触发心跳（网关 RPC）。

必需：
- `--text <text>`

选项：
- `--mode <now|next-heartbeat>`
- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

### `system heartbeat last|enable|disable`
心跳控制（网关 RPC）。

选项：
- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

### `system presence`
列出系统存在的条目（网关 RPC）。

选项：
- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

## Cron
管理计划任务（网关 RPC）。请参阅 [/automation/cron-jobs](/automation/cron-jobs)。

子命令：
- `cron status [--json]`
- `cron list [--all] [--json]`（默认输出表格；使用 `--json` 获取原始数据）
- `cron add`（别名：`create`；需要 `--name` 并且必须精确地选择 `--at` | `--every` | `--cron`，以及精确地选择一个有效载荷 `--system-event` | `--message`）
- `cron edit <id>`（修补字段）
- `cron rm <id>`（别名：`remove`、`delete`）
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--force]`

所有 `cron` 命令都接受 `--url`、`--token`、`--timeout`、`--expect-final`。

## 节点主机

`node` 运行 **无头节点主机** 或将其作为后台服务进行管理。请参阅 [`openclaw node`](/cli/node)。

子命令：
- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

## 节点

`nodes` 与网关通信，并瞄准配对的节点。请参阅 [/nodes](/nodes)。

常见选项：
- `--url`、`--token`、`--timeout`、`--json`

子命令：
- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes run --node <id|name|ip> [--cwd <path>] [--env KEY=VAL] [--command-timeout <ms>] [--needs-screen-recording] [--invoke-timeout <ms>] <command...>`（mac 节点或无头节点主机）
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]`（仅适用于 mac）

相机：
- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality 小于 0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

画布 + 屏幕：
- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality 小于 0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

位置：
- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## 浏览器

浏览器控制 CLI（专用 Chrome/Brave/Edge/Chromium）。请参阅 [`openclaw browser`](/cli/browser) 和 [浏览器工具](/tools/browser)。

常见选项：
- `--url`、`--token`、`--timeout`、`--json`
- `--browser-profile <name>`

管理：
- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>]`
- `browser delete-profile --name <name>`

检查：
- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

行动：
- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## 文档搜索

### `docs [query...]`
搜索实时文档索引。

## TUI

### `tui`
打开与网关相连的终端用户界面。

选项：
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>`（默认为 `agents.defaults.timeoutSeconds`）
