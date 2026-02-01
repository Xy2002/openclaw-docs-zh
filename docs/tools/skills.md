---
summary: 'Skills: managed vs workspace, gating rules, and config/env wiring'
read_when:
  - Adding or modifying skills
  - Changing skill gating or load rules
---
# 技能（OpenClaw）

OpenClaw 使用与 **[AgentSkills](https://agentskills.io)** 兼容的技能文件夹来教导智能体如何使用工具。每个技能都是一个目录，包含带有 YAML 前置元数据和说明的 `SKILL.md` 文件。OpenClaw 会加载**捆绑技能**以及可选的本地覆盖，并在加载时根据环境、配置和二进制文件的存在情况对它们进行过滤。

## 位置与优先级

技能从**三个**位置加载：

1) **捆绑技能**：随安装包一起提供（npm 包或 OpenClaw.app）
2) **托管/本地技能**：`~/.openclaw/skills`
3) **工作区技能**：`<workspace>/skills`

如果技能名称发生冲突，优先级如下：

`<workspace>/skills`（最高）→ `~/.openclaw/skills` → 捆绑技能（最低）

此外，您可以通过 `skills.load.extraDirs` 在 `~/.openclaw/openclaw.json` 中配置额外的技能文件夹（优先级最低）。

## 每个智能体专用技能与共享技能

在**多智能体**设置中，每个智能体都有自己的工作区。这意味着：

- **每个智能体专用技能**仅存在于该智能体的 `<workspace>/skills` 中。
- **共享技能**存在于 __ INLINE_CODE_14__（托管/本地）中，并对同一台机器上的**所有智能体**可见。
- 如果您希望多个智能体使用通用技能包，还可以通过 `skills.load.extraDirs` 添加**共享文件夹**（优先级最低）。

如果同一个技能名称存在于多个位置，则按常规优先级处理：工作区优先，其次是托管/本地，最后是捆绑技能。

## 插件 + 技能

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录来自带技能（路径相对于插件根目录）。插件技能在插件启用时加载，并参与正常的技能优先级规则。您可以通过插件配置条目中的 `metadata.openclaw.requires.config` 来控制这些技能的启用条件。有关发现和配置，请参阅 [插件](/plugin)；有关这些技能所教授的工具界面，请参阅 [工具](/tools)。

## ClawHub（安装 + 同步）

ClawHub 是 OpenClaw 的公共技能注册表。您可以在 https://clawhub.com. 上浏览它。使用它来发现、安装、更新和备份技能。完整指南：[ClawHub](/tools/clawhub)。

常见流程：

- 将技能安装到您的工作区：
  - `clawhub install <skill-slug>`
- 更新所有已安装技能：
  - `clawhub update --all`
- 同步（扫描 + 发布更新）：
  - `clawhub sync --all`

默认情况下，`clawhub` 会安装到您当前工作目录下的 `./skills` 中（或者回退到配置的 OpenClaw 工作区）。OpenClaw 在下一次会话中将其作为 `<workspace>/skills` 检测到。

## 安全注意事项

- 将第三方技能视为**受信代码**。启用前请仔细阅读。
- 对于不可信输入和高风险工具，建议使用沙箱运行。请参阅 [沙箱](/gateway/sandboxing)。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会在该智能体回合中将密钥注入到**主机**进程中（而不是沙箱）。请勿在提示和日志中泄露密钥。
- 更广泛的威胁模型和检查清单，请参阅 [安全](/gateway/security)。

## 格式（与 AgentSkills 和 Pi 兼容）

`SKILL.md` 至少应包含以下内容：

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
---
```

注意事项：
- 我们遵循 AgentSkills 规范来定义布局和意图。
- 内嵌智能体使用的解析器仅支持**单行**前置元数据键。
- `metadata` 应为**单行 JSON 对象**。
- 在说明中使用 `{baseDir}` 来引用技能文件夹路径。
- 可选的前置元数据键：
  - `homepage` — URL 在 macOS Skills UI 中显示为“网站”（也通过 `metadata.openclaw.homepage` 支持）。
  - `user-invocable` — `true|false`（默认：`true`）。当 `true` 时，该技能会作为用户斜杠命令公开。
  - `disable-model-invocation` — `true|false`（默认：`false`）。当 `true` 时，该技能会被排除在模型提示之外（但仍可通过用户调用访问）。
  - `command-dispatch` — `tool`（可选）。当设置为 `tool` 时，斜杠命令会绕过模型，直接调度到工具。
  - `command-tool` — 当 `command-dispatch: tool` 设置时要调用的工具名称。
  - `command-arg-mode` — `raw`（默认）。对于工具调度，原始参数字符串会转发给工具（不进行核心解析）。

    工具以以下参数调用：
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## 过滤（加载时的筛选器）

OpenClaw 在加载时使用 `metadata`（单行 JSON）对技能进行**加载时过滤**：

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
metadata: {"openclaw":{"requires":{"bins":["uv"],"env":["GEMINI_API_KEY"],"config":["browser.enabled"]},"primaryEnv":"GEMINI_API_KEY"}}
---
```

`metadata.openclaw` 下的字段：
- `always: true` — 始终包含该技能（跳过其他门控）。
- `emoji` — macOS Skills UI 使用的可选表情符号。
- `homepage` — macOS Skills UI 中显示为“网站”的可选 URL。
- `os` — 可选的平台列表（`darwin`、`linux`、`win32`）。如果设置，该技能仅适用于这些操作系统。
- `requires.bins` — 列表；每个条目必须存在于 `PATH` 中。
- `requires.anyBins` — 列表；至少有一个条目必须存在于 `PATH` 中。
- `requires.env` — 列表；环境变量必须存在**或**在配置中提供。
- `requires.config` — 必须为真的 `openclaw.json` 路径列表。
- `primaryEnv` — 与 `skills.entries.<name>.apiKey` 关联的环境变量名称。
- `install` — macOS Skills UI 使用的可选安装程序规范数组（brew/node/go/uv/download）。

关于沙箱的注意事项：
- 在技能加载时，会在**主机**上检查 `requires.bins`。
- 如果智能体处于沙箱中，二进制文件也必须存在于**容器内**。通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）安装它。
  `setupCommand` 在容器创建后运行一次。
  软件包安装还需要网络出口、可写的根文件系统以及沙箱中的 root 用户。例如，`summarize` 技能（`skills/summarize/SKILL.md`）需要在沙箱容器中具有 `summarize` CLI才能运行。

安装程序示例：

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata: {"openclaw":{"emoji":"♊️","requires":{"bins":["gemini"]},"install":[{"id":"brew","kind":"brew","formula":"gemini-cli","bins":["gemini"],"label":"Install Gemini CLI (brew)"}]}}
---
```

注意事项：
- 如果列出了多个安装程序，网关会选择**一个**首选选项（如果有 brew，则优先使用 brew，否则使用 node）。
- 如果所有安装程序都为 `download`，OpenClaw 会列出每一条目，以便您可以看到可用的工件。
- 安装程序规范可以包括 `os: ["darwin"|"linux"|"win32"]`，以按平台过滤选项。
- Node 安装尊重 `skills.install.nodeManager` 在 `openclaw.json` 中的规定（默认：npm；选项：npm/pnpm/yarn/bun）。这仅影响**技能安装**；网关运行时仍应为 Node
  （不建议在 WhatsApp/Telegram 中使用 Bun）。
- Go 安装：如果 `go` 不存在且 `brew` 可用，网关会先通过 Homebrew 安装 Go，并在可能的情况下将 `GOBIN` 设置为 Homebrew 的 `bin`。
- 下载安装：`url`（必需），`archive`（`tar.gz` | `tar.bz2` | `zip`），`extract`（默认：检测到存档时自动启用），`stripComponents`，`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

如果没有 `metadata.openclaw`，该技能始终符合条件（除非在配置中被禁用或因 `skills.allowBundled` 而被阻止用于捆绑技能）。

## 配置覆盖（`~/.openclaw/openclaw.json`）

捆绑/托管技能可以切换状态并提供环境值：

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE"
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro"
        }
      },
      peekaboo: { enabled: true },
      sag: { enabled: false }
    }
  }
}
```

注意：如果技能名称包含连字符，请用引号括住键（JSON5 允许使用带引号的键）。

默认情况下，配置键与**技能名称**匹配。如果技能定义了 `metadata.openclaw.skillKey`，应在 `skills.entries` 下使用该键。

规则：
- `enabled: false` 即使技能是捆绑的或已安装的，也会禁用该技能。
- `env`：仅在进程中尚未设置该变量时注入。
- `apiKey`：为声明了 `metadata.openclaw.primaryEnv` 的技能提供便利。
- `config`：为自定义技能特定字段提供的可选容器；自定义键必须在此处定义。
- `allowBundled`：仅为**捆绑**技能提供的可选白名单。如果设置，只有名单中的捆绑技能才符合条件（托管/工作区技能不受影响）。

## 环境注入（每个智能体运行时）

当智能体运行开始时，OpenClaw 会执行以下操作：
1) 读取技能元数据。
2) 将任何 `skills.entries.<key>.env` 或 `skills.entries.<key>.apiKey` 应用于 `process.env`。
3) 使用**符合条件**的技能构建系统提示。
4) 在运行结束后恢复原始环境。

此操作**仅限于智能体运行**，而非全局 shell 环境。

## 会话快照（性能）
OpenClaw 在**会社开始时**对符合条件的技能进行快照，并在同一会社的后续回合中重复使用该列表。技能或配置的更改将在下一个新会社中生效。

如果启用了技能监视器，或者出现了新的符合条件的远程节点，技能也可以在会社中途刷新（见下文）。您可以将其视为**热重载**：刷新后的列表将在下一个智能体回合中被采用。

## 遠程 macOS 节點（Linux 網關）
如果網關在 Linux 上運行，但**macOS 节点**已連接**且允許 `system.run`**（未將 Exec 批准的安全設為 `deny`），則當該節點上存在所需的二進制文件時，OpenClaw 可以將僅適用於 macOS 的技能視為符合條件。智能體應通過 `nodes` 工具（通常是 `nodes.run`）執行這些技能。

這依賴於節點报告其命令支援，並通过 `system.run`进行二進制探測。如果 macOS 节点随后离线，技能仍然可见；调用可能会失败，直到节点重新连接。

## 技能監視器（自動刷新）
默認情況下，OpenClaw 会監視技能文件夾，並在 `SKILL.md` 文件發生變化時更新技能快照。您可以通過 `skills.load`进行配置：

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250
    }
  }
}
```

## 令牌影響（技能列表）
当技能符合条件时，OpenClaw 会将一个紧凑的可用技能 XML 列表注入系统提示中（通过 `formatSkillsForPrompt` 在 `pi-coding-agent` 中）。成本是确定性的：

- **基礎开销（仅当 ≥1 技能时）：** 195 个字符。
- **每项技能：** 97 个字符加上 XML 转义的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（字符数）：

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

注意事项：
- XML 转义会将 `& < > " '` 扩展为实体（`&amp;`、`&lt;`等），从而增加长度。
- 不同模型的分词器计算的令牌数量有所不同。粗略的 OpenAI 式估算约为 4 个字符/令牌，因此**每项技能约 97 个字符 ≈ 24 个令牌**，再加上您实际字段的长度。

## 托管技能生命周期
OpenClaw 随安装包（npm 包或 OpenClaw.app）提供一組基准技能作为**捆绑技能**。`~/.openclaw/skills` 用于本地覆盖（例如，在不更改变捆绑副本的情况下修复或补丁某个技能）。工作区技能由用户拥有，并在名称冲突时覆盖其他技能。

## 配置参考
有关完整的配置模式请参阅 [技能配置](/tools/skills-config)。

## 寻找更多技能？

请浏览 https://clawhub.com.
