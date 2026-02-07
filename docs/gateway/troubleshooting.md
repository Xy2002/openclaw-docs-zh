---
summary: Quick troubleshooting guide for common OpenClaw failures
read_when:
  - Investigating runtime issues or failures
---
# 故障排除 🔧

当 OpenClaw 行为异常时，以下是修复它的方法。

如果您只想快速排查问题，请先查看常见问题解答 [前60秒](/help/faq#first-60-seconds-if-somethings-broken)。本页面将深入探讨运行时故障和诊断。

特定提供商的快捷方式：[/channels/troubleshooting](/channels/troubleshooting)

## 状态与诊断

快速排查命令（按顺序）：

| 命令 | 提供的信息 | 使用场景 |
|---|---|---|
| `openclaw status` | 本地摘要：操作系统 + 更新、网关可达性/模式、服务、代理/会话、提供商配置状态 | 首次检查，快速概览 |
| `openclaw status --all` | 完整本地诊断（只读、可粘贴、相对安全），包括日志尾部 | 当您需要分享调试报告时 |
| `openclaw status --deep` | 运行网关健康检查（包括提供商探测；需要可访问的网关） | 当“已配置”并不意味着“正常工作”时 |
| `openclaw gateway probe` | 网关发现 + 可达性（本地 + 远程目标） | 当您怀疑正在探测错误的网关时 |
| `openclaw channels status --probe` | 向正在运行的网关请求通道状态（并可选择进行探测） | 当网关可访问但通道行为异常时 |
| `openclaw gateway status` | 监控器状态（launchd/systemd/schtasks）、运行时PID/退出、最近的网关错误 | 当服务“看起来已加载”但未运行任何内容时 |
| `openclaw logs --follow` | 实时日志（运行时问题的最佳信号） | 当您需要确切的失败原因时 |

**共享输出：** 优先使用 `openclaw status --all`（它会屏蔽令牌）。如果您粘贴 `openclaw status`，请先考虑设置 `OPENCLAW_SHOW_SECRETS=0`（令牌预览）。

另请参阅：[健康检查](/gateway/health)和[日志记录](/logging)。

## 常见问题

未找到提供商“anthropic”的API密钥

这意味着**代理的身份验证存储为空**，或者缺少Anthropic凭证。
身份验证是**按代理划分**的，因此新代理不会继承主代理的密钥。

修复选项：

- 重新运行入门流程，并为该代理选择 **Anthropic**。
- 或在 **网关主机** 上粘贴一个设置令牌：

  ```bash
  openclaw models auth setup-token --provider anthropic
  ```

- 或从主代理目录将`auth-profiles.json`复制到新代理目录。

验证：

```bash
openclaw models status
```

__HEADING_0__OAuth令牌刷新失败（Anthropic Claude订阅）

这意味着存储的 Anthropic OAuth 令牌已过期，且刷新操作失败。
如果您使用的是 Claude 订阅（无 API 密钥），最可靠的修复方法是切换到“Claude Code 设置令牌”，并将其粘贴到“网关主机”中。

**推荐（设置令牌）：**

```bash
# Run on the gateway host (paste the setup-token)
openclaw models auth setup-token --provider anthropic
openclaw models status
```

如果您在其他地方生成了令牌：

```bash
openclaw models auth paste-token --provider anthropic
openclaw models status
```

更多详情：[Anthropic](/providers/anthropic) 和 [OAuth](/concepts/oauth)。

### 在HTTP上控制UI失败（“需要设备身份”/“连接失败”）

如果您通过普通HTTP打开仪表板（例如 `http://<lan-ip>:18789/` 或 `http://<tailscale-ip>:18789/`），浏览器将在**非安全上下文中运行**，并阻止WebCrypto，因此无法生成设备身份。

**修复：**

- 优先通过 [Tailscale Serve](/gateway/tailscale) 使用HTTPS。
- 或在网关主机上本地打开：`http://127.0.0.1:18789/`。
- 如果您必须使用HTTP，启用 `gateway.controlUi.allowInsecureAuth: true` 并使用网关令牌（仅令牌；无设备身份/配对）。请参阅 [控制UI](/web/control-ui#insecure-http)。

__HEADING_0__CI秘密扫描失败

这意味着 `detect-secrets` 发现了尚未纳入基线的新候选者。请遵循 [秘密扫描](/gateway/security#secret-scanning-detect-secrets)。

### 服务已安装，但未运行任何内容

如果网关服务已安装，但进程立即退出，服务可能看似“已加载”，但实际上并未运行任何内容。

**检查：**

```bash
openclaw gateway status
openclaw doctor
```

医生/服务将显示运行时状态（PID/上次退出）和日志提示。

**日志：**

- 推荐：`openclaw logs --follow`
- 文件日志（始终）：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或您配置的 `logging.file`）
- macOS LaunchAgent（如果已安装）：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`
- Linux systemd（如果已安装）：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

**启用更多日志记录：**

- 提高文件日志详细程度（持久化JSONL）：

  ```json
  { "logging": { "level": "debug" } }
  ```

- 提高控制台冗余度（仅TTY输出）：

  ```json
  { "logging": { "consoleLevel": "debug", "consoleStyle": "pretty" } }
  ```

- 快速提示：`--verbose` 仅影响**控制台**输出。文件日志仍由 `logging.level` 控制。

有关格式、配置和访问的完整概述，请参阅 [/logging](/logging)。

### “网关启动被阻止：设置gateway.mode=local”

这意味着配置存在，但 `gateway.mode` 未设置（或不是 `local`），因此网关拒绝启动。

**修复（推荐）：**

- 运行向导并将网关运行模式设置为**本地**：

  ```bash
  openclaw configure
  ```

- 或直接设置：

  ```bash
  openclaw config set gateway.mode local
  ```

**如果您原本打算运行远程网关：**

- 设置远程URL并保持 `gateway.mode=remote`：

  ```bash
  openclaw config set gateway.mode remote
  openclaw config set gateway.remote.url "wss://gateway.example.com"
  ```

**仅限临时/开发用途：** 传递 `--allow-unconfigured` 以在没有 `gateway.mode=local` 的情况下启动网关。

**还没有配置文件？** 运行 `openclaw setup` 创建初始配置，然后重新运行网关。

### 服务环境（PATH + 运行时）

网关服务以“最小化PATH”模式运行，以避免Shell或管理器环境变得杂乱。

- macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
- Linux：`/usr/local/bin`、`/usr/bin`、`/bin`

这有意排除了版本管理器（nvm/fnm/volta/asdf）和包管理器（pnpm/npm），因为服务不会加载您的shell初始化。像 `DISPLAY` 这样的运行时变量应位于 `~/.openclaw/.env` 中（由网关提前加载）。
执行运行于 `host=gateway`，将您的登录shell `PATH` 合并到执行环境中，因此缺少工具通常意味着您的shell初始化未导出它们（或设置了 `tools.exec.pathPrepend`）。请参阅 [/tools/exec](/tools/exec)。

WhatsApp和Telegram频道需要**Node**；不支持Bun。如果您使用Bun或通过版本管理工具安装的Node路径来运行服务，请运行`openclaw doctor`，将其迁移到系统Node安装。

### 在沙盒中缺少API密钥

**症状：** 该技能在主机上运行正常，但在沙盒中因缺少API密钥而无法运行。

**原因：** 沙盒中的执行在Docker内部运行，`process.env` 主机。

**修复：**

- 设置 `agents.defaults.sandbox.docker.env`（或按代理设置 `agents.list[].sandbox.docker.env`）
- 或将密钥烘焙到您的自定义沙盒镜像中
- 然后运行 `openclaw sandbox recreate --agent <id>`（或 `--all`）

### 服务正在运行，但端口未监听

如果服务报告“正在运行”，但网关端口没有任何监听，网关很可能会拒绝绑定。

**此处“正在运行”的含义**

- `Runtime: running` 表示您的监控器（launchd/systemd/schtasks）认为进程还活着。
- `RPC probe` 表示 CLI 实际上可以连接到网关 WebSocket 并调用 `status`。
- 始终信任 `Probe target:` + `Config (service):`，将其视为“我们实际尝试了什么？”的线索。

**检查：**

- `gateway.mode` 必须是 `local`，以便 `openclaw gateway` 和服务能够正常运行。
- 如果您设置了 `gateway.mode=remote`，**CLI默认** 使用远程URL。服务可能仍在本地运行，但您的CLI可能正在探测错误的位置。使用 `openclaw gateway status` 查看服务解析后的端口 + 探测目标（或传递 `--url`）。
- `openclaw gateway status` 和 `openclaw doctor` 从日志中显示 **最近的网关错误**，即使服务看似运行，但端口已关闭。
- 非环回绑定（`lan`/`tailnet`/`custom`，或在无法使用环回时使用 `auto`）需要身份验证：

`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。

- `gateway.remote.token` 仅用于远程CLI调用；它 **不** 启用本地身份验证。
- `gateway.token` 被忽略；请使用 `gateway.auth.token`。

**如果 `openclaw gateway status` 显示配置不匹配**

- `Config (cli): ...` 和 `Config (service): ...` 通常应保持一致。
- 如果不一致，您很可能正在服务运行时编辑另一个配置。
- 修复方法：从您希望服务使用的同一 `--profile` / `OPENCLAW_STATE_DIR` 重新运行 `openclaw gateway install --force`。

**如果 `openclaw gateway status` 报告服务配置问题**

- 监控器配置（launchd/systemd/schtasks）缺少当前默认值。
- 修复：运行 `openclaw doctor` 更新配置（或 `openclaw gateway install --force` 进行完全重写）。

**如果 `Last gateway error:` 提及“拒绝绑定……没有身份验证”**

- 您已将 `gateway.bind` 设置为非环回模式（`lan`/`tailnet`/`custom`，或在无法使用环回时使用 `auto`），但未配置身份验证。
- 修复：设置 `gateway.auth.mode` + `gateway.auth.token`（或导出 `OPENCLAW_GATEWAY_TOKEN`）并重启服务。

**如果 `openclaw gateway status` 说 `bind=tailnet` 但未找到尾网接口**

- 网关尝试绑定到Tailscale IP（100.64.0.0/10），但在主机上未检测到任何IP。
- 修复：在该机器上启用Tailscale（或将 `gateway.bind` 更改为 `loopback`/`lan`）。

**如果 `Probe note:` 说探测使用环回**

- 对于 `bind=lan` 来说这是预期的：网关在 `0.0.0.0`（所有接口）上监听，环回仍然可以在本地连接。
- 对于远程客户端，使用真实的LAN IP（不是 `0.0.0.0`）加上端口，并确保已配置身份验证。

### 地址已被占用（端口18789）

这意味着网关端口上已经有东西在监听。

**检查：**

```bash
openclaw gateway status
```

它将显示监听者及其可能的原因（网关已在运行、SSH隧道）。如有必要，停止服务或选择其他端口。

### 检测到额外的工作区文件夹

如果您从旧版本升级，磁盘上可能仍有 `~/openclaw`。由于一次只能有一个工作区处于活动状态，多个工作区目录可能导致身份验证混乱或状态漂移。

**修复：** 保留一个活动的工作区，并归档或删除其余的工作区。请参阅 [代理工作区](/concepts/agent-workspace#extra-workspace-folders)。

### 主聊天在沙盒工作区中运行

症状：`pwd` 或文件工具显示 `~/.openclaw/sandboxes/...`，尽管您期望的是主机工作区。

**原因：** `agents.defaults.sandbox.mode: "non-main"` 依赖于 `session.mainKey`（默认 `"main"`）。
群组/频道会话使用自己的密钥，因此被视为非主会话，并获得沙盒工作区。

**修复选项：**

- 如果您希望代理使用主机工作区：设置 `agents.list[].sandbox.mode: "off"`。
- 如果您希望在沙盒中获得主机工作区访问权限：将 `workspaceAccess: "rw"` 设置为该代理。

### “代理被中止”

代理在回复过程中被中断。

**原因：**

- 用户发送了 `stop`、`abort`、`esc`、`wait` 或 `exit`
- 超时
- 进程崩溃

**修复：** 再发一条消息即可。会话将继续。

### “代理在回复前失败：未知模型：anthropic/claude-haiku-3-5”

OpenClaw会故意拒绝使用**较旧或不安全的模型**，尤其是那些更容易遭受提示注入攻击的模型。如果您看到此错误，说明该模型名称已不再受支持。

**修复：**

- 为提供商选择**最新**的模型，并更新您的配置或模型别名。
- 如果您不确定哪些模型可用，运行`openclaw models list`或`openclaw models scan`，并选择一个受支持的模型。
- 查看网关日志以获取详细的失败原因。

另请参阅：[模型CLI](/cli/models) 和 [模型提供商](/concepts/model-providers)。

### 消息未触发

**检查1：** 发件人是否被列入白名单？

```bash
openclaw status
```

在输出中查找 `AllowFrom: ...`。

**检查2：** 对于群聊，是否需要提及？

```bash
# The message must match mentionPatterns or explicit mentions; defaults live in channel groups/guilds.
# Multi-agent: `agents.list[].groupChat.mentionPatterns` overrides global patterns.
grep -n "agents\\|groupChat\\|mentionPatterns\\|channels\\.whatsapp\\.groups\\|channels\\.telegram\\.groups\\|channels\\.imessage\\.groups\\|channels\\.discord\\.guilds" \
  "${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"
```

**检查3：** 检查日志

```bash
openclaw logs --follow
# or if you want quick filters:
tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)" | grep "blocked\\|skip\\|unauthorized"
```

### 配对代码尚未到达

如果`dmPolicy`是`pairing`，未知发件人应收到代码，在批准之前其消息将被忽略。

**检查1：** 是否已有待处理的请求在等待？

```bash
openclaw pairing list <channel>
```

默认情况下，每个频道的待处理DM配对请求上限为**3个**。如果列表已满，新的请求将不会生成代码，直到其中一个请求被批准或过期。

**检查2：** 请求是否已创建但未收到回复？

```bash
openclaw logs --follow | grep "pairing request"
```

**检查3：** 确认 `dmPolicy` 不是该频道的 `open`/`allowlist`。

### 图片+提及不起作用

已知问题：当您仅发送带有提及的图片（没有其他文本）时，WhatsApp有时不会包含提及元数据。

**解决方法：** 在提及中添加一些文本：

- ❌ `@openclaw` + 图片
- ✅ `@openclaw check this` + 图片

### 会话无法恢复

**检查1：** 会话文件是否存在？

```bash
ls -la ~/.openclaw/agents/<agentId>/sessions/
```

**检查2：** 重置窗口是否太短？

```json
{
  "session": {
    "reset": {
      "mode": "daily",
      "atHour": 4,
      "idleMinutes": 10080  // 7 days
    }
  }
}
```

**检查3：** 是否有人发送了 `/new`、`/reset` 或重置触发器？

### 代理超时

默认超时为30分钟。对于长时间任务：

```json
{
  "reply": {
    "timeoutSeconds": 3600  // 1 hour
  }
}
```

或者使用 `process` 工具将长时间运行的命令放到后台执行。

__HEADING_0__WhatsApp已断开连接

```bash
# Check local status (creds, sessions, queued events)
openclaw status
# Probe the running gateway + channels (WA connect + Telegram + Discord APIs)
openclaw status --deep

# View recent connection events
openclaw logs --limit 200 | grep "connection\\|disconnect\\|logout"
```

**修复：** 通常，一旦网关运行，就会自动重新连接。如果您遇到卡顿，请重启网关进程（无论您以何种方式监控它），或在详细输出模式下手动运行：

```bash
openclaw gateway --verbose
```

如果您已注销/取消链接：

```bash
openclaw channels logout
trash "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/credentials" # if logout can't cleanly remove everything
openclaw channels login --verbose       # re-scan QR
```

### 媒体发送失败

**检查1：** 文件路径是否有效？

```bash
ls -la /path/to/your/image.jpg
```

**检查2：** 是否太大？

- 图片：最大6MB
- 音频/视频：最大16MB
- 文档：最大100MB

**检查3：** 检查媒体日志

```bash
grep "media\\|fetch\\|download" "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)" | tail -20
```

### 内存使用率高

OpenClaw在内存中保存对话历史。

**修复：** 定期重启或设置会话限制：

```json
{
  "session": {
    "historyLimit": 100  // Max messages to keep
  }
}
```

## 常见故障排除

### “网关无法启动——配置无效”

出于安全考虑，OpenClaw现在会在配置包含未知键、格式错误的值或无效类型时拒绝启动。

使用Doctor修复：

```bash
openclaw doctor
openclaw doctor --fix
```

注意事项：

- `openclaw doctor` 报告每个无效条目。
- `openclaw doctor --fix` 应用迁移/修复并重写配置。
- 即使配置无效，诊断命令如 `openclaw logs`、`openclaw health`、`openclaw status`、`openclaw gateway status` 和 `openclaw gateway probe` 仍可运行。

### “所有模型都失败”——我首先应该检查什么？

- **凭证** 是否适用于正在尝试的提供商（身份验证配置文件 + 环境变量）。
- **模型路由**：确认 `agents.defaults.model.primary` 和后备模型是您可以访问的模型。
- **网关日志** 在 `/tmp/openclaw/…` 中查看确切的提供商错误。
- **模型状态**：使用 `/model status`（聊天）或 `openclaw models status`（CLI）。

### 我使用个人WhatsApp号码——为什么自我聊天很奇怪？

启用自我聊天模式并将您自己的号码列入白名单：

```json5
{
  channels: {
    whatsapp: {
      selfChatMode: true,
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123"]
    }
  }
}
```

请参阅 [WhatsApp设置](/channels/whatsapp)。

__HEADING_0__WhatsApp让我注销了。我如何重新认证？

再次运行登录命令并扫描二维码：

```bash
openclaw channels login
```

### 在 `main` 上出现构建错误——标准修复路径是什么？

1) `git pull origin main && pnpm install`
2) `openclaw doctor`
3) 检查GitHub问题或Discord
4) 临时解决方案：检出较早的提交

### npm install 失败（构建脚本被允许/缺少 tar 或 yargs）。现在该怎么办？

如果您是从源代码运行，使用仓库的包管理器：**pnpm**（推荐）。
仓库声明了 `packageManager: "pnpm@…"`。

典型恢复：

```bash
git status   # ensure you’re in the repo root
pnpm install
pnpm build
openclaw doctor
openclaw gateway restart
```

原因：pnpm是此仓库的配置包管理器。

### 如何在Git安装和npm安装之间切换？

使用**网站安装程序**并通过标志选择安装方法。它会就地升级，并将网关服务重定向到新安装。

切换到Git安装：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git --no-onboard
```

切换到npm全局：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

注意：

- Git流程仅在仓库干净时才会执行变基。请先提交或暂存更改。
- 切换后，运行：

  ```bash
  openclaw doctor
  openclaw gateway restart
  ```

__HEADING_0__Telegram块流无法在工具调用之间分割文本。为什么？

块流仅发送**已完成的文本块**。您看到单条消息的常见原因：

- `agents.defaults.blockStreamingDefault` 仍然是 `"off"`。
- `channels.telegram.blockStreaming` 被设置为 `false`。
- `channels.telegram.streamMode` 是 `partial` 或 `block` **且草案流处于活动状态**

（私人聊天 + 主题）。在这种情况下，草案流会禁用块流。

- 你的 `minChars` / 聚合设置过高，导致块被合并。
- 模型发出一个大文本块（没有中间回复刷新点）。

修复清单：
1) 将块流设置移至 `agents.defaults` 下，而非根级别。
2) 如果你需要真正的多消息块回复，请设置 `channels.telegram.streamMode: "off"`。
3) 在调试时使用更小的块/聚合阈值。

请参阅 [流式传输](/concepts/streaming)。

### 即使我的服务器中有 `requireMention: false`，Discord 也不回复。为什么？

`requireMention` 仅在频道通过白名单后才控制提及** gating**。
默认 `channels.discord.groupPolicy` 是 **白名单**，因此公会必须明确启用。
如果您设置了 `channels.discord.guilds.<guildId>.channels`，只有列出的频道才被允许；省略它以允许公会中的所有频道。

修复清单：
1) 设置 `channels.discord.groupPolicy: "open"` **或** 添加公会白名单条目（并可选添加频道白名单）。
2) 在 `channels.discord.guilds.<guildId>.channels` 中使用 **数字频道ID**。
3) 将 `requireMention: false` 放在 `channels.discord.guilds`（全局或每频道） **之下**。
   顶级 `channels.discord.requireMention` 不是支持的密钥。
4) 确保机器人具有 **消息内容意图** 和频道权限。
5) 运行 `openclaw channels status --probe` 获取审计提示。

文档：[Discord](/channels/discord)，[渠道故障排除](/channels/troubleshooting)。

### 云代码辅助API错误：无效工具模式（400）。现在该怎么办？

这几乎总是**工具模式兼容性**问题。Cloud Code Assist端点只接受JSON Schema的严格子集。OpenClaw会在当前 `main` 中清理或规范化工具模式，但相关修复尚未在最新版本中实现（截至2026年1月13日）。

修复清单：
1) **更新OpenClaw**：

- 如果您可以从源代码运行，请拉取 `main` 并重启网关。
   - 否则，请等待包含模式清理器的下一个版本。

2) 避免使用不支持的关键字，如 `anyOf/oneOf/allOf`、`patternProperties`、`additionalProperties`、`minLength`、`maxLength`、`format` 等。
3) 如果您定义自定义工具，请将顶级模式设置为 `type: "object"`，并使用 `properties` 和简单的枚举。

请参阅[工具](/tools)和[TypeBox模式](/concepts/typebox)。

## macOS 特有问题

### 应用在授予权限时崩溃（语音/麦克风）

如果应用在您点击隐私提示中的“允许”时消失，或显示“Abort trap 6”：

**修复1：重置TCC缓存**

```bash
tccutil reset All bot.molt.mac.debug
```

**修复2：强制使用新的捆绑ID**
如果重置无效，请更改 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中的 `BUNDLE_ID`（例如，添加一个 `.test` 后缀）并重新构建。这会强制 macOS 将其视为新应用。

### 网关卡在“启动中...”

该应用连接到本地网关，端口为 `18789`。如果它一直卡住：

**修复1：停止监控器（推荐）**
如果网关由launchd监控，杀死PID只会导致它重新启动。请先停止监控器：

```bash
openclaw gateway status
openclaw gateway stop
# Or: launchctl bootout gui/$UID/bot.molt.gateway (replace with bot.molt.<profile>; legacy com.openclaw.* still works)
```

**修复2：端口繁忙（查找监听者）**

```bash
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

如果是无监督进程，先尝试优雅地停止，然后再采取更激进的措施：

```bash
kill -TERM <PID>
sleep 1
kill -9 <PID> # last resort
```

**修复3：检查CLI安装**
确保已全局安装 `openclaw`CLI，并且其版本与应用版本匹配：

```bash
openclaw --version
npm install -g openclaw@<version>
```

## 调试模式

获取详细日志：

```bash
# Turn on trace logging in config:
#   ${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json} -> { logging: { level: "trace" } }
#
# Then run verbose commands to mirror debug output to stdout:
openclaw gateway --verbose
openclaw channels login --verbose
```

## 日志位置

| 日志 | 位置 |
|-----|----------|
| 网关文件日志（结构化） | `/tmp/openclaw/openclaw-YYYY-MM-DD.log`（或 `logging.file`） |
| 网关服务日志（监控器） | macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` + `gateway.err.log`（默认：`~/.openclaw/logs/...`；配置文件使用 `~/.openclaw-<profile>/logs/...`）<br />Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`<br />Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST` |
| 会话文件 | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/` |
| 媒体缓存 | `$OPENCLAW_STATE_DIR/media/` |
| 基准测试结果 | `$OPENCLAW_STATE_DIR/credentials/` |

## 健康检查

```bash
# Supervisor + probe target + config paths
openclaw gateway status
# Include system-level scans (legacy/extra services, port listeners)
openclaw gateway status --deep

# Is the gateway reachable?
openclaw health --json
# If it fails, rerun with connection details:
openclaw health --verbose

# Is something listening on the default port?
lsof -nP -iTCP:18789 -sTCP:LISTEN

# Recent activity (RPC log tail)
openclaw logs --follow
# Fallback if RPC is down
tail -20 /tmp/openclaw/openclaw-*.log
```

## 重置一切

终极方案：

```bash
openclaw gateway stop
# If you installed a service and want a clean install:
# openclaw gateway uninstall

trash "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
openclaw channels login         # re-pair WhatsApp
openclaw gateway restart           # or: openclaw gateway
```

⚠️ 这将丢失所有会话，并需要重新配对WhatsApp。

## 获取帮助

1. 先查看日志：`/tmp/openclaw/`（默认：`openclaw-YYYY-MM-DD.log`，或您配置的 `logging.file`）
2. 在GitHub上搜索现有问题
3. 打开新问题，提供：
   - OpenClaw版本
   - 相关日志片段
   - 复现步骤
   - 您的配置（请隐藏敏感信息！）

---

*“你试过关机再开机吗？”* — 每一位IT人员都会这么说

龙虾🔧

### 浏览器无法启动（Linux）

如果您看到 `"Failed to start Chrome CDP on port 18800"`：

**最可能的原因：** 在Ubuntu上，Chromium是通过Snap打包的。

**快速修复：** 安装Google Chrome代替：

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

然后在配置中设置：

```json
{
  "browser": {
    "executablePath": "/usr/bin/google-chrome-stable"
  }
}
```

**完整指南：** 请参阅 [browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
