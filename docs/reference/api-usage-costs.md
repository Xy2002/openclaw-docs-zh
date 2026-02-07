---
summary: 'Audit what can spend money, which keys are used, and how to view usage'
read_when:
  - You want to understand which features may call paid APIs
  - 'You need to audit keys, costs, and usage visibility'
  - You’re explaining /status or /usage cost reporting
---
__HEADING_0__API 使用与费用

本文档列出了**可调用 API 密钥的功能**，并说明了费用的显示位置。重点介绍 OpenClaw 中能够产生提供商使用量或付费 API 调用的功能。

## 费用显示位置（聊天 + CLI）

**会话级费用快照**

- `/status` 显示当前会话使用的模型、上下文用量以及上一条回复的令牌数。
- 如果模型使用**API密钥认证**，`/status` 还会显示上一条回复的**预估费用**。

**每条消息的费用页脚**

- `/usage full` 会在每条回复中附加一个用量页脚，其中包含**预估费用**（仅适用于 API 密钥）。
- `/usage tokens` 仅显示令牌用量；OAuth 流程会隐藏美元费用。

**CLI用量窗口（提供商配额）**

- `openclaw status --usage` 和 `openclaw channels list` 显示提供商的**用量窗口**，

包括配额快照，但不显示每条消息的费用。

有关详细信息和示例，请参阅 [令牌使用与费用](/token-use)。

## 密钥的发现方式

OpenClaw 可从以下来源获取凭据：

- **认证配置文件**（按代理存储，位于 `auth-profiles.json`)。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`)。
- **配置**（`models.providers.*.apiKey`、`tools.web.search.*`、`tools.web.fetch.firecrawl.*`、

`memorySearch.*`、`talk.apiKey`)。

- **技能**（`skills.entries.<name>.apiKey`）可能会将密钥导出到技能进程的环境变量中。

## 可使用密钥的功能

### 1) 核心模型响应（聊天 + 工具）

每次回复或工具调用都会使用**当前模型提供商**（OpenAI、Anthropic等）。这是主要的用量和费用来源。

有关定价配置，请参阅 [模型](/providers/models)；有关显示信息，请参阅 [令牌使用与费用](/token-use)。

### 2) 媒体理解（音频/图像/视频）

在回复运行之前，传入的媒体可以先被总结或转录。这会使用模型或提供商的API。

- 音频：OpenAI / Groq / Deepgram（在提供密钥时**自动启用**）。
- 图像：OpenAI / Anthropic / Google。
- 视频：Google。

有关更多信息，请参阅 [媒体理解](/nodes/media-understanding)。

### 3) 内存嵌入 + 语义搜索

当为远程提供商配置时，语义内存搜索会使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI 嵌入
- `memorySearch.provider = "gemini"` → Gemini 嵌入
- 如果本地嵌入失败，可选择回退到 OpenAI。

您可以通过 `memorySearch.provider = "local"` 将其保留在本地（无需使用 API）。

有关更多信息，请参阅 [内存](/concepts/memory)。

### 4) 网络搜索工具（Brave / Perplexity 通过 OpenRouter）

`web_search` 使用 API 密钥，并可能产生用量费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `tools.web.search.apiKey`
- **Perplexity**（通过 OpenRouter）：`PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`

**Brave 免费层级（相当慷慨）：**

- 每月2,000次请求
- 每秒1次请求
- 需提供信用卡以进行验证（除非升级，否则不会收费）

有关更多信息，请参阅 [网络工具](/tools/web)。

### 5) 网络抓取工具（Firecrawl）

当存在 API 密钥时，`web_fetch` 可以调用**Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `tools.web.fetch.firecrawl.apiKey`

如果未配置 Firecrawl，该工具将回退到直接抓取 + 可读性分析（不涉及付费 API）。

有关更多信息，请参阅 [网络工具](/tools/web)。

### 6) 提供商用容量快照（状态/健康）

某些状态命令会调用**提供商用量端点**，以显示配额窗口或认证健康状况。这些通常是低用量调用，但仍会触及提供商的API：

- `openclaw status --usage`
- `openclaw models status --json`

有关更多信息，请参阅 [模型 CLI](/cli/models)。

### 7) 整理保护总结

整理保护功能可以使用**当前模型**对会话历史进行总结，从而在运行时调用提供商的API。

有关更多信息，请参阅 [会话管理 + 整理](/reference/session-management-compaction)。

### 8) 模型扫描/探测

`openclaw models scan` 可以探测 OpenRouter 模型，并在启用探测时使用 `OPENROUTER_API_KEY`。

有关更多信息，请参阅 [模型 CLI](/cli/models)。

### 9) 语音

在已配置的情况下，Talk 模式可以调用**ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.apiKey`

有关更多信息，请参阅 [对话模式](/nodes/talk)。

### 10) 技能（第三方API）

技能可以将 `apiKey` 存储在 `skills.entries.<name>.apiKey` 中。如果技能使用该密钥调用外部API，则可能根据技能所属的提供商产生费用。

有关更多信息，请参阅 [技能](/tools/skills)。
