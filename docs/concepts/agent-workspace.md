---
summary: 'Agent workspace: location, layout, and backup strategy'
read_when:
  - You need to explain the agent workspace or its file layout
  - You want to back up or migrate an agent workspace
---
# 代理工作区

工作区是代理的“家”。它是用于文件工具和工作区上下文的唯一工作目录。请将其视为私密空间，并视其为代理的记忆。

这与存储配置、凭据和会话的 `~/.openclaw/` 是分开的。

**重要提示：** 工作区是 **默认的当前工作目录**，而非严格的沙箱。工具会基于工作区解析相对路径，但除非启用沙箱机制，否则绝对路径仍可访问主机上的其他位置。若需要隔离，请使用 [`agents.defaults.sandbox`](/gateway/sandboxing)（以及/或针对每个代理的沙箱配置）。

当沙箱已启用且 `workspaceAccess` 不等于 `"rw"` 时，工具将在 `~/.openclaw/sandboxes` 下的沙箱工作区中运行，而不是在您的主机工作区中。

## 默认位置

- 默认：`~/.openclaw/workspace`
- 如果 `OPENCLAW_PROFILE` 已设置且不等于 `"default"`，则默认变为 `~/.openclaw/workspace-<profile>`。
- 可在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace"
  }
}
```

如果工作区缺失必要的文件， `openclaw onboard`、`openclaw configure` 或 `openclaw setup` 将创建工作区并填充引导文件。

如果您已自行管理工作区文件，则可以禁用引导文件的自动创建：

```json5
{ agent: { skipBootstrap: true } }
```

## 额外的工作区文件夹

旧版本安装可能创建了 `~/openclaw`。同时保留多个工作区目录可能会导致身份验证混乱或状态漂移，因为同一时间只能有一个工作区处于活动状态。

**建议：** 保持单个工作区处于活动状态。如果您不再使用额外的文件夹，请将其归档或移至回收站（例如 `trash ~/openclaw`）。如果您有意保留多个工作区，请确保 `agents.defaults.workspace` 指向当前活动的工作区。

`openclaw doctor` 在检测到多余的工作区目录时会发出警告。

## 工作区文件映射（各文件的作用）

以下是 OpenClaw 在工作区内期望的标准文件：

- `AGENTS.md`
  - 代理的操作指南及其使用记忆的方式。
  - 在每个会案开始时加载。
  - 适合存放规则、优先级以及“行为准则”等详细信息。

- `SOUL.md`
  - 代理的角色、语气和行为边界。
  - 每个会话都会加载。

- `USER.md`
  - 用户的身份及如何称呼用户。
  - 每个会话都会加载。

- `IDENTITY.md`
  - 代理的名称、风格和表情符号。
  - 在引导仪式期间创建或更新。

- `TOOLS.md`
  - 关于本地工具和约定的备注。
  - 不影响工具的可用性；仅作为参考。

- `HEARTBEAT.md`
  - 心跳运行的可选小型检查清单。
  - 保持简短以避免消耗过多令牌。

- `BOOT.md`
  - 可选的启动检查清单，在启用内部钩子的情况下于网关重启时执行。
  - 保持简短；对于对外发送的消息，请使用消息工具。

- `BOOTSTRAP.md`
  - 一次性首次运行仪式。
  - 仅在全新工作区中创建。
  - 仪式完成后删除。

- `memory/YYYY-MM-DD.md`
  - 每日记忆日志（每天一个文件）。
  - 建议在会话开始时阅读当天和前一天的日志。

- `MEMORY.md`（可选）
  - 精选的长期记忆。
  - 仅在主会话（非共享或群组会话）中加载。

有关工作流程和自动记忆刷新，请参阅 [记忆](/concepts/memory)。

- `skills/`（可选）
  - 工作区特定技能。
  - 当名称冲突时，会覆盖托管或捆绑的技能。

- `canvas/`（可选）
  - 用于节点显示的画布 UI 文件（例如 `canvas/index.html`）。

如果任何引导文件缺失，OpenClaw 会在会话中注入“缺失文件”标记并继续运行。较大的引导文件在注入时会被截断；可通过 `agents.defaults.bootstrapMaxChars` 调整限制（默认：20000）。`openclaw setup` 可在不覆盖现有文件的情况下重新创建缺失的默认文件。

## 工作区中不包含的内容

以下内容位于 `~/.openclaw/` 下，不应提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/credentials/`（OAuth 令牌、API 密钥）
- `~/.openclaw/agents/<agentId>/sessions/`（会话记录 + 元数据）
- `~/.openclaw/skills/`（托管技能）

如果需要迁移会话或配置，请单独复制并将其排除在版本控制之外。

## Git 备份（推荐，私密）
将工作区视为私密记忆。将其放入 **私密** Git 仓库中，以便备份和恢复。

在运行 Gateway 的机器上执行以下步骤（工作区就位于该机器上）。

### 1) 初始化仓库

如果已安装 Git，全新工作区会自动初始化。如果此工作区尚未成为仓库，请执行：

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 添加私密远程（适合初学者的选项）

选项 A：GitHub Web UI

1. 在 GitHub 上创建一个新的 **私密** 仓库。
2. 不要使用 README 初始化（避免合并冲突）。
3. 复制 HTTPS 远程 URL。
4. 添加远程并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

选项 B：GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

选项 C：GitLab Web UI

1. 在 GitLab 上创建一个新的 **私密** 仓库。
2. 不要使用 README 初始化（避免合并冲突）。
3. 复制 HTTPS 远程 URL。
4. 添加远程并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) 持续更新

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## 请勿提交机密
即使在私密仓库中，也应避免在工作区中存储机密：

- API 密钥、OAuth 令牌、密码或私密凭证。
- 任何位于 `~/.openclaw/` 下的内容。
- 聊天记录或敏感附件的原始转储。

如果必须存储敏感引用，请使用占位符，并将真实机密保存在其他地方（密码管理器、环境变量或 `~/.openclaw/`）。

建议的 `.gitignore` 入门配置：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将工作区迁移到新机器

1. 将仓库克隆到所需路径（默认 `~/.openclaw/workspace`）。
2. 在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
3. 运行 `openclaw setup --workspace <path>` 以填充任何缺失的文件。
4. 如果需要会话，请从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。

## 高级说明

- 多代理路由可以为每个代理使用不同的工作区。有关路由配置，请参阅 [通道路由](/concepts/channel-routing)。
- 如果 `agents.defaults.sandbox` 已启用，非主会话可以使用位于 `agents.defaults.sandbox.workspaceRoot` 下的每会话沙箱工作区。
