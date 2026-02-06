---
summary: 'Models CLI: list, set, aliases, fallbacks, scan, status'
read_when:
  - Adding or modifying models CLI (models list/set/scan/aliases/fallbacks)
  - Changing model fallback behavior or selection UX
  - Updating model scan probes (tools/images)
---
# 模型命令行界面

有关身份验证配置文件轮换、冷却时间及其与后备模型交互方式的详细信息，请参阅 [/concepts/model-failover](/concepts/model-failover)。
快速提供者概览 + 示例：[/concepts/model-providers](/concepts/model-providers)。

## 模型选择的工作原理

OpenClaw 按照以下顺序选择模型：

1) **主**模型（`agents.defaults.model.primary` 或 `agents.defaults.model`）。
2) `agents.defaults.model.fallbacks` 中的**后备模型**（按顺序）。
3) 在切换到下一个模型之前，提供者内部会进行**提供者身份验证故障转移**。

相关：

- `agents.defaults.models` 是 OpenClaw 可以使用的模型白名单/目录（包括别名）。
- `agents.defaults.imageModel` 仅在主模型无法接受图像时使用。
- 每个代理的默认设置可以通过 `agents.list[].model` 加上绑定来覆盖 `agents.defaults.model`（请参阅 [/concepts/multi-agent](/concepts/multi-agent)）。

## 快速模型推荐（经验之谈）

- **GLM**：在编码和工具调用方面略占优势。
- **MiniMax**：在写作和整体体验方面表现更佳。

## 设置向导（推荐）

如果您不想手动编辑配置，可以运行入门向导：

```bash
openclaw onboard
```

它可以为常见提供者设置模型和身份验证，包括 **OpenAI Code (Codex) 订阅**（OAuth）和 **Anthropic**（建议使用 API 密钥；也支持 `claude setup-token`）。

## 配置键（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models`（白名单 + 别名 + 提供者参数）
- `models.providers`（写入 `models.json` 的自定义提供者）

模型引用会被规范化为小写。提供者别名如 `z.ai/*` 会被规范化为 `zai/*`。

提供者配置示例（包括 OpenCode Zen）位于 [/gateway/configuration](/gateway/configuration#opencode-zen-multi-model-proxy)。

## “模型不允许”（以及回复停止的原因）

如果设置了 `agents.defaults.models`，它将成为 `/model` 以及会话覆盖的**白名单**。当用户选择的模型不在该白名单中时，OpenClaw 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

这发生在生成正常回复**之前**，因此消息可能会让人感觉“没有响应”。解决方法是：

- 将模型添加到 `agents.defaults.models`，
- 清除白名单（移除 `agents.defaults.models`），或
- 从 `/model list` 中选择一个模型。

白名单配置示例：

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-5" },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-5": { alias: "Opus" }
    }
  }
}
```

## 在聊天中切换模型（`/model`）

您可以在不重启的情况下为当前会话切换模型：

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

注意事项：

- `/model`（和 `/model list`）是一个紧凑的编号选择器，用于指定模型系列和可用提供者。
- `/model <#>` 从该选择器中提取具体选项。
- `/model status` 是详细视图，包含身份验证候选以及在配置时的提供者端点 `baseUrl` 和 `api` 模式。
- 模型引用通过分割**第一个** `/` 来解析。输入 `/model <ref>` 时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 样式），则必须包含提供者前缀（例如：`/model openrouter/moonshotai/kimi-k2`）。
- 如果省略提供者，OpenClaw 会将输入视为**默认提供者**的别名或模型（仅在模型 ID 中未包含 `/` 时有效）。

完整命令行/配置：[斜杠命令](/tools/slash-commands)。

__HEADING_0__CLI 命令

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`（无子命令）是 `models status` 的快捷方式。

### __内联代码_0__

默认显示已配置的模型。有用标志：

- `--all`：完整目录
- `--local`：仅本地提供者
- `--provider <name>`：按提供者筛选
- `--plain`：每行一个模型
- `--json`：机器可读输出

### __内联代码_0__

显示解析后的主模型、后备模型、图像模型以及已配置提供者的身份验证概览。它还会显示身份验证存储中找到的配置文件的 OAuth 过期状态（默认在到期前 24 小时发出警告）。`--plain` 仅打印解析后的主模型。
OAuth 状态始终显示（并包含在 `--json` 输出中）。如果已配置的提供者没有凭据，`models status` 会打印一个 **缺少身份验证** 部分。
JSON 包括 `auth.oauth`（警告窗口 + 配置文件）和 `auth.providers`（每个提供者的有效身份验证）。
使用 `--check` 进行自动化（当缺少或过期时退出 `1`，当即将到期时退出 `2`）。

Anthropic 推荐的身份验证方式是 Claude Code CLI setup-token（可在任何地方运行；如有需要，可粘贴到网关主机上）：

```bash
claude setup-token
openclaw models status
```

## 扫描（OpenRouter 免费模型）

`openclaw models scan` 检查 OpenRouter 的**免费模型目录**，并可以选择性地探测模型是否支持工具和图像。

关键标志：

- `--no-probe`：跳过实时探测（仅元数据）
- `--min-params <b>`：最小参数规模（十亿级别）
- `--max-age-days <days>`：跳过较旧的模型
- `--provider <name>`：提供者前缀过滤
- `--max-candidates <n>`：后备列表大小
- `--set-default`：将 `agents.defaults.model.primary` 设置为首次选择
- `--set-image`：将 `agents.defaults.imageModel.primary` 设置为首次图像选择

探测需要 OpenRouter API 密钥（来自身份验证配置文件或 `OPENROUTER_API_KEY`）。如果没有密钥，可以使用 `--no-probe` 仅列出候选模型。

扫描结果按以下顺序排名：
1) 图像支持
2) 工具延迟
3) 上下文大小
4) 参数数量

输入

- OpenRouter `/models` 列表（过滤 `:free`）
- 需要来自身份验证配置文件或 `OPENROUTER_API_KEY` 的 OpenRouter API 密钥（请参阅 [/environment](/environment)）
- 可选过滤器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制：`--timeout`、`--concurrency`

在 TTY 中运行时，您可以交互式选择后备模型。在非交互模式下，传递 `--yes` 以采用默认设置。

## 模型注册表（`models.json`）

`models.providers` 中的自定义提供者会将内容写入位于代理目录下（默认为 `~/.openclaw/agents/<agentId>/models.json`）的 `models.json`。此文件默认会被合并，除非 `models.mode` 被设置为 `replace`。
