---
summary: 'Doctor command: health checks, config migrations, and repair steps'
read_when:
  - Adding or modifying doctor migrations
  - Introducing breaking config changes
---
# 医生

`openclaw doctor` 是 OpenClaw 的修复与迁移工具。它可以修复过时的配置和状态，检查系统健康状况，并提供可操作的修复步骤。

## 快速入门

```bash
openclaw doctor
```

### 无头模式/自动化

```bash
openclaw doctor --yes
```

在无需提示的情况下接受默认设置（包括在适用时执行重启、服务或沙盒修复步骤）。

```bash
openclaw doctor --repair
```

在无需提示的情况下应用推荐的修复措施（在安全的情况下进行修复和重启）。

```bash
openclaw doctor --repair --force
```

同时应用激进的修复措施（覆盖自定义的 supervisor 配置）。

```bash
openclaw doctor --non-interactive
```

在不弹出提示的情况下运行，并仅应用安全的迁移操作（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启、服务或沙盒操作。
检测到旧版状态时会自动运行状态迁移。

```bash
openclaw doctor --deep
```

扫描系统服务以查找额外的网关安装（launchd/systemd/schtasks）。

如果您想在写入更改之前先查看更改，请先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

## 功能概览
- 可选的预飞行更新（仅适用于交互式 git 安装）。
- UI 协议新鲜度检查（当协议模式较新时重建 Control UI）。
- 健康检查 + 重启提示。
- 技能状态摘要（符合条件/缺失/被阻止）。
- 针对旧版值的配置规范化。
- OpenCode Zen 提供商覆盖警告（`models.providers.opencode`）。
- 旧版磁盘状态迁移（会话/代理目录/WhatsApp 认证）。
- 状态完整性和权限检查（会话、记录、状态目录）。
- 在本地运行时检查配置文件权限（chmod 600）。
- 模型认证健康：检查 OAuth 过期时间，可刷新即将到期的令牌，并报告认证配置文件的冷却期或禁用状态。
- 额外工作区目录检测（`~/openclaw`）。
- 启用沙盒时修复沙盒镜像。
- 旧版服务迁移和额外网关检测。
- 网关运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
- 渠道状态警告（从正在运行的网关探测）。
- Supervisor 配置审计（launchd/systemd/schtasks），并可选择修复。
- 网关运行时最佳实践检查（Node vs Bun，版本管理路径）。
- 网关端口冲突诊断（默认 `18789`）。
- 针对开放 DM 政策的安全警告。
- 当未设置 `gateway.auth.token` 时的网关认证警告（本地模式；提供令牌生成选项）。
- Linux 上的 systemd linger 检查。
- 源码安装检查（pnpm 工作区不匹配、缺少 UI 资产、缺少 tsx 二进制文件）。
- 写入更新后的配置 + 向导元数据。

## 详细行为与原理

### 0) 可选更新（git 安装）
如果这是 git 检出且 doctor 以交互方式运行，则会在运行 doctor 之前提供更新选项（fetch/rebase/build）。

### 1) 配置规范化
如果配置中包含旧版值结构（例如 `messages.ackReaction` 且没有针对特定渠道的覆盖），doctor 会将其规范化为当前模式。

### 2) 旧版配置键迁移
当配置中包含已弃用的键时，其他命令会拒绝运行，并要求您运行 `openclaw doctor`。

Doctor 将：
- 解释发现的旧版键。
- 显示所应用的迁移。
- 使用更新后的模式重写 `~/.openclaw/openclaw.json`。

Gateway 在启动时也会自动运行 doctor 迁移，以检测到旧版配置格式，因此过时的配置会在无需手动干预的情况下得到修复。

当前迁移：
- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 顶级 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`

### 2b) OpenCode Zen 提供商覆盖
如果您手动添加了 `models.providers.opencode`（或 `opencode-zen`），它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode Zen 目录。这可能会强制所有模型使用单个 API 或将成本降至零。Doctor 会发出警告，以便您可以删除覆盖并恢复按模型的 API 路由和成本。

### 3) 旧版状态迁移（磁盘布局）
Doctor 可以将较旧的磁盘布局迁移到当前结构：
- 会话存储 + 记录：
  - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
- 代理目录：
  - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（除 `oauth.json` 外）
  - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 ID：`default`）

这些迁移是尽力而为且幂等的；当 doctor 留下任何旧版文件夹作为备份时，它会发出警告。Gateway/CLI 也会在启动时自动迁移旧版会话 + 代理目录，因此历史/认证/模型会自动进入按代理划分的路径，无需手动运行 doctor。WhatsApp 认证则有意仅通过 `openclaw doctor` 进行迁移。

### 4) 状态完整性检查（会话持久性、路由和安全性）
状态目录是运行的核心。如果它消失，您将丢失会话、凭据、日志和配置（除非您在其他地方有备份）。

Doctor 检查：
- **状态目录缺失**：警告灾难性的状态丢失，提示重新创建目录，并提醒您无法恢复丢失的数据。
- **状态目录权限**：验证是否可写；提供修复权限的选项（并在检测到所有者/组不匹配时发出 `chown` 提示）。
- **会话目录缺失**：`sessions/` 和会话存储目录是保持历史记录和避免 `ENOENT` 崩溃所必需的。
- **记录不匹配**：当最近的会话条目缺少记录文件时发出警告。
- **主会话“1 行 JSONL”**：当主记录只有一行时发出警告（历史未累积）。
- **多个状态目录**：当多个 `~/.openclaw` 文件夹存在于不同的主目录中，或当 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史可能在不同安装之间分散）。
- **远程模式提醒**：如果设置了 `gateway.mode=remote`，doctor 提醒您在远程主机上运行（状态位于那里）。
- **配置文件权限**：如果 `~/.openclaw/openclaw.json` 对组/世界可读，发出警告，并提供将其收紧至 `600` 的选项。

### 5) 模型认证健康（OAuth 过期）
Doctor 检查认证存储中的 OAuth 配置文件，当令牌即将到期或已到期时发出警告，并在安全的情况下可以刷新它们。如果 Anthropic Claude Code 配置文件已过时，它建议运行 `claude setup-token`（或粘贴一个设置令牌）。刷新提示仅在交互式运行时（TTY）显示；`--non-interactive` 会跳过刷新尝试。

Doctor 还会报告因以下原因暂时无法使用的认证配置文件：
- 短暂的冷却期（速率限制/超时/认证失败）
- 更长时间的禁用（计费/信用失败）

### 6) 模型验证钩子
如果设置了 `hooks.gmail.model`，doctor 会根据目录和白名单验证模型引用，并在无法解析或被禁止时发出警告。

### 7) 沙盒镜像修复
当启用沙盒时，doctor 检查 Docker 镜像，如果当前镜像缺失，则提供构建或切换到旧版名称的选项。

### 8) 网关服务迁移和清理提示
Doctor 检测旧版网关服务（launchd/systemd/schtasks），并提供移除这些服务以及使用当前网关端口安装 OpenClaw 服务的选项。它还可以扫描是否存在额外的类似网关的服务，并给出清理提示。以个人命名的 OpenClaw 网关服务被视为一流服务，不会被标记为“额外”。

### 9) 安全警告
当提供商对 DM 开放且未设置白名单，或者策略配置存在危险时，doctor 会发出警告。

### 10) systemd linger（Linux）
如果作为 systemd 用户服务运行，doctor 确保启用了 lingering，以便网关在注销后仍保持运行。

### 11) 技能状态
Doctor 打印当前工作区符合条件/缺失/被阻止技能的快速摘要。

### 12) 网关认证检查（本地令牌）
当本地网关缺少 `gateway.auth` 时，doctor 会发出警告，并提供生成令牌的选项。在自动化中，使用 `openclaw doctor --generate-gateway-token` 强制创建令牌。

### 13) 网关健康检查 + 重启
Doctor 运行健康检查，并在网关看起来不健康时提供重启建议。

### 14) 渠道状态警告
如果网关健康，doctor 会运行渠道状态探测，并报告带有建议修复措施的警告。

### 15) Supervisor 配置审计 + 修复
Doctor 检查已安装的 supervisor 配置（launchd/systemd/schtasks），以查找缺失或过时的默认设置（例如 systemd network-online 依赖项和重启延迟）。当发现不匹配时，它会建议更新，并可根据当前默认值重写服务文件/任务。

注意：
- `openclaw doctor` 在重写 supervisor 配置前会提示。
- `openclaw doctor --yes` 接受默认的修复提示。
- `openclaw doctor --repair` 在无需提示的情况下应用推荐的修复。
- `openclaw doctor --repair --force` 覆盖自定义的 supervisor 配置。
- 您始终可以通过 `openclaw gateway install --force` 强制进行完全重写。

### 16) 网关运行时 + 端口诊断
Doctor 检查服务运行时（PID、上次退出状态），并在服务已安装但未实际运行时发出警告。它还会检查网关端口（默认 `18789`）是否存在端口冲突，并报告可能的原因（网关已在运行、SSH 隧道）。

### 17) 网关运行时最佳实践
Doctor 警告网关服务是否在 Bun 或版本管理的 Node 路径上运行（`nvm`、`fnm`、`volta`、`asdf` 等）。WhatsApp 和 Telegram 渠道需要 Node，而版本管理路径在升级后可能会出现问题，因为服务不会加载您的 shell 初始化脚本。Doctor 提供在可用时迁移到系统 Node 安装的选项（Homebrew/apt/choco）。

### 18) 配置写入 + 向导元数据
Doctor 会保存任何配置更改，并加盖向导元数据戳，以记录 doctor 运行。

### 19) 工作区提示（备份 + 内存系统）
当缺少工作区内存系统时，doctor 会提出建议；如果工作区尚未纳入 git 管理，它会给出备份提示。

有关工作区结构和 git 备份的完整指南（推荐使用私有 GitHub 或 GitLab），请参阅 [/concepts/agent-workspace](/concepts/agent-workspace)。
