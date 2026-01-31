---
summary: 'Testing kit: unit/e2e/live suites, Docker runners, and what each test covers'
read_when:
  - Running tests locally or in CI
  - Adding regressions for model/provider bugs
  - Debugging gateway + agent behavior
---
# 测试

OpenClaw 包含三个 Vitest 测试套件（单元/集成、端到端、实时）以及一组小型 Docker 运行器。

本文档是一份“我们如何测试”的指南：
- 每个测试套件涵盖的内容（以及它刻意不涵盖的内容）
- 常见工作流所需的命令（本地、推送前、调试）
- 实时测试如何发现凭据并选择模型/提供商
- 如何为现实世界中的模型/提供商问题添加回归测试

## 快速入门

大多数情况下：
- 完整门控检查（推送前必通过）：`pnpm lint && pnpm build && pnpm test`

当你修改测试代码或需要额外信心时：
- 覆盖率门控检查：`pnpm test:coverage`
- 端到端测试套件：`pnpm test:e2e`

当调试真实提供商/模型时（需要真实凭据）：
- 实时测试套件（模型 + 网关工具/镜像探针）：`pnpm test:live`

提示：如果你只需要一个失败用例，建议通过下面描述的白名单环境变量来缩小实时测试范围。

## 测试套件（各套件运行内容）

可以将这些套件视为“从低到高的真实感”（以及随之增加的不稳定性和成本）：

### 单元/集成测试（默认）

- 命令：`pnpm test`
- 配置：`vitest.config.ts`
- 文件：`src/**/*.test.ts`
- 范围：
  - 纯单元测试
  - 进程内集成测试（网关认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

### 端到端测试（网关冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`
- 范围：
  - 多实例网关的端到端行为
  - WebSocket/HTTP 接口、节点配对及更复杂的网络交互
- 预期：
  - 在 CI 中运行（在流水线中启用时）
  - 不需要真实密钥
  - 比单元测试有更多的活动部件（可能较慢）

### 实时测试（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型今天是否真的能使用真实凭据正常工作？”
  - 捕捉提供商格式变化、工具调用怪癖、认证问题以及速率限制行为
- 预期：
  - 本质上不适合 CI 稳定运行（真实网络、真实提供商策略、配额、宕机）
  - 需要付费 / 使用速率限制
  - 更倾向于运行缩小后的子集，而不是“全部”
  - 实时运行会从 `~/.profile` 获取缺失的 API 密钥
  - Anthropic 密钥轮换：设置 `OPENCLAW_LIVE_ANTHROPIC_KEYS="sk-...,sk-..."`（或 `OPENCLAW_LIVE_ANTHROPIC_KEY=sk-...`）或多组 `ANTHROPIC_API_KEY*` 变量；测试会在遇到速率限制时重试

## 我应该运行哪个测试套件？

请参考以下决策表：
- 编辑逻辑/测试代码：运行 `pnpm test`（如果改动较多，还应运行 `pnpm test:coverage`）
- 修改网关网络/WS 协议/配对：添加 `pnpm test:e2e`
- 调试“我的机器人挂了”/特定于提供商的故障/工具调用：运行缩小范围的 `pnpm test:live`

## 实时测试：模型冒烟测试（配置文件密钥）

实时测试分为两层，以便我们能够隔离故障：
- “直接模型”告诉我们，给定的密钥可以让提供商/模型至少作出响应。
- “网关冒烟测试”告诉我们，对于该模型，完整的网关+代理流程是有效的（会话、历史、工具、沙盒策略等）。

### 第一层：直接模型完成度测试（无网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 列出已发现的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭据的模型
  - 对每个模型运行一个小规模的完成度测试（并在必要时运行针对性的回归测试）
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或其别名 `all`，用于现代模型）以实际运行此套件；否则它将跳过，以使 `pnpm test:live` 专注于网关冒烟测试
- 选择模型的方式：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代白名单（Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.1、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代白名单的别名
  - 或者使用 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-5,..."`（逗号分隔的白名单）
- 选择提供商的方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的白名单）
- 密钥来源：
  - 默认：配置文件存储和环境回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制仅使用 **配置文件存储**
- 存在原因：
  - 将“提供商 API 出现问题/密钥无效”与“网关代理流程出现问题”区分开来
  - 包含小型、孤立的回归测试（例如：OpenAI Responses/Codex Responses 的推理回放 + 工具调用流程）

### 第二层：网关 + 开发代理冒烟测试（“@openclaw”实际执行的内容）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内网关
  - 创建/修补一个 `agent:dev:*` 会话（每次运行时可覆盖模型）
  - 遍历有密钥的模型并断言：
    - 得到“有意义”的响应（无工具）
    - 真实的工具调用有效（读取探针）
    - 可选的额外工具探针（执行+读取探针）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）仍然有效
- 探针细节（便于快速解释失败原因）：
  - `read` 探针：测试在工作区写入一个 nonce 文件，并要求代理将其 `read` 并将 nonce 原样返回。
  - `exec+read` 探针：测试要求代理将一个 nonce `exec` 写入临时文件，然后将其 `read` 读回。
  - 图像探针：测试附加一个生成的 PNG 图片（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
- 选择模型的方式：
  - 默认：现代白名单（Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.1、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代白名单的别名
  - 或者设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号分隔列表）以缩小范围
- 选择提供商的方式（避免“OpenRouter 全部”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的白名单）
- 工具 + 图像探针在此实时测试中始终开启：
  - `read` 探针 + `exec+read` 探针（工具压力测试）
  - 当模型声明支持图像输入时，图像探针也会运行
  - 流程（高层次）：
    - 测试生成一个带有“CAT”和随机代码的小型 PNG 图片（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` 和 `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送图片
    - 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式代理将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 代码（OCR 容差：允许轻微错误）

提示：要在你的机器上查看可以测试的内容（以及确切的 `provider/model` ID），运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时测试：Anthropic setup-token 冒烟测试

- 测试：`src/agents/anthropic.setup-token.live.test.ts`
- 目标：验证 Claude Code CLI setup-token（或粘贴的 setup-token 配置文件）是否能完成 Anthropic 提示。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- 令牌来源（任选其一）：
  - 配置文件：`OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - 原始令牌：`OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- 模型覆盖（可选）：
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-5`

设置示例：

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## 实时测试：CLI 后端冒烟测试（Claude Code CLI 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证网关 + 代理流程，而不影响你的默认配置。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时使用 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认：
  - 模型：`claude-cli/claude-sonnet-4-5`
  - 命令：`claude`
  - 参数：`["-p","--output-format","json","--dangerously-skip-permissions"]`
- 覆盖（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2-codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 用于发送真实的图像附件（路径注入到提示中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 用于将图像文件路径作为 CLI 参数传递，而不是注入提示。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制当 `IMAGE_ARG` 设置时，图像参数如何传递。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 用于发送第二轮对话并验证恢复流程。
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` 用于保持 Claude Code CLI MCP 配置启用（默认使用临时空文件禁用 MCP 配置）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### 推荐的实时测试配方

缩小范围的显式白名单速度最快且最稳定：

- 单一模型，直接测试（无网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单一模型，网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.1" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 专注（Gemini API 密钥 + Antigravity）：
  - Gemini（API 密钥）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-5-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注：
- `google/...` 使用 Gemini API（API 密钥）。
- `google-antigravity/...` 使用 Antigravity OAuth 桥接（Cloud Code Assist 风格的代理端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立的身份验证 + 工具调用怪癖）。
- Gemini API vs Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥 / 配置文件身份验证）；这是大多数用户所说的“Gemini”。
  - CLI：OpenClaw 调用本地 `gemini` 二进制文件；它有自己的身份验证机制，行为可能不同（流式传输/工具支持/版本差异）。

## 实时测试：模型矩阵（我们覆盖的内容）

没有固定的“CI 模型列表”（实时测试是可选的），但以下是在开发机器上定期使用密钥进行测试的 **推荐** 模型。

### 现代冒烟测试集（工具调用 + 图像）

这是我们期望持续运行的“常见模型”测试：
- OpenAI（非 Codex）：`openai/gpt-5.2`（可选：`openai/gpt-5.1`）
- OpenAI Codex：`openai-codex/gpt-5.2`（可选：`openai-codex/gpt-5.2-codex`）
- Anthropic：`anthropic/claude-opus-4-5`（或 `anthropic/claude-sonnet-4-5`）
- Google（Gemini API）：`google/gemini-3-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-5-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/minimax-m2.1`

运行网关冒烟测试，包含工具 + 图像：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-5-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.1" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（读取 + 可选执行）

每个提供商家族至少选择一个：
- OpenAI：`openai/gpt-5.2`（或 `openai/gpt-5-mini`）
- Anthropic：`anthropic/claude-opus-4-5`（或 `anthropic/claude-sonnet-4-5`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/minimax-m2.1`

可选的额外覆盖（锦上添花）：
- xAI：`xai/grok-4`（或最新可用的）
- Mistral：`mistral/`…（选择一个你已启用的“工具”能力模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### 视觉：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude/Gemini/OpenAI 支持视觉的变体等），以测试图像探针。

### 聚合器 / 替代网关

如果你启用了密钥，我们还支持通过以下方式进行测试：
- OpenRouter：`openrouter/...`（数百种模型；使用 `openclaw models scan` 查找具备工具+图像能力的候选者）
- OpenCode Zen：`opencode/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 进行身份验证）

更多你可以纳入实时矩阵的提供商（如果你有凭据/配置）：
- 内置：`openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何兼容 OpenAI/Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表是你机器上 `discoverModels(...)` 返回的内容 + 当前可用的密钥。

## 凭据（切勿提交）

实时测试以与 CLI 相同的方式发现凭据。实际影响：
- 如果 CLI 能正常工作，实时测试也应该能找到相同的密钥。
- 如果实时测试显示“没有凭据”，请按照调试 `openclaw models list` / 模型选择的相同方法进行排查。

- 配置文件存储：`~/.openclaw/credentials/`（首选；测试中“配置文件密钥”的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）

如果你想依赖环境密钥（例如在你的 `~/.profile` 中导出），请在 `source ~/.profile` 之后运行本地测试，或使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram 实时测试（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Docker 运行器（可选的“在 Linux 中运行”检查）

这些运行 `pnpm test:live` 在仓库的 Docker 镜像内，挂载你的本地配置目录和工作区（并在挂载时获取 `~/.profile`）：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- 网关 + 开发代理：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 入门向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- 网关网络（两个容器，WS 认证 + 健康）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 插件（自定义扩展加载 + 注册表冒烟测试）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前获取
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭据来自配置文件存储（而非环境）

## 文档健全性检查

在编辑文档后运行文档检查：`pnpm docs:list`。

## 离线回归测试（CI 安全）

这些是无需真实提供商的“真实管道”回归测试：
- 网关工具调用（模拟 OpenAI，真实网关 + 代理循环）：`src/gateway/gateway.tool-calling.mock-openai.test.ts`
- 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制执行认证）：`src/gateway/gateway.wizard.e2e.test.ts`

## 代理可靠性评估（技能）

我们已经有一些类似于“代理可靠性评估”的 CI 安全测试：
- 通过真实网关 + 代理循环进行模拟工具调用（`src/gateway/gateway.tool-calling.mock-openai.test.ts`）。
- 验证会话布线和配置效果的端到端向导流程（`src/gateway/gateway.wizard.e2e.test.ts`）。

技能方面仍需完善（参见 [Skills](/tools/skills))：
- **决策**：当提示中列出技能时，代理是否会选择正确的技能（或避免无关技能）？
- **合规**：代理在使用前是否读取 `SKILL.md` 并遵循必要的步骤/参数？
- **工作流契约**：多轮场景是否能确保工具顺序、会话历史传递和沙盒边界？

未来的评估应首先保持确定性：
- 使用模拟提供商的场景运行器，以验证工具调用 + 顺序、技能文件读取和会话布线。
- 一套小型的以技能为中心的场景（使用 vs 避免、门控、提示注入）。
- 可选的实时评估（可选，受环境变量控制）仅在 CI 安全套件就绪后进行。

## 添加回归测试（指导）

当你修复实时测试中发现的提供商/模型问题时：
- 如果可能，添加 CI 安全的回归测试（模拟/存根提供商，或捕获精确的请求形状转换）
- 如果问题本质上只能在实时环境中解决（速率限制、认证策略），则保持实时测试范围较小，并通过环境变量实现可选运行
- 尽量针对能够捕捉该缺陷的最小层次：
  - 提供商请求转换/回放缺陷 → 直接模型测试
  - 网关会话/历史/工具流程缺陷 → 网关实时冒烟测试或 CI 安全的网关模拟测试
