---
summary: Usage tracking surfaces and credential requirements
read_when:
  - You are wiring provider usage/quota surfaces
  - You need to explain usage tracking behavior or auth requirements
---
# 使用情况跟踪

## 什么是使用情况跟踪
- 直接从提供商的用量端点获取其使用量和配额数据。
- 不提供预估费用；仅显示提供商报告的时间窗口。

## 使用情况的展示位置
- 聊天中的`/status`：富含表情符号的状态卡片，显示会话令牌及预估费用（仅适用于 API 密钥）。在可用时，将显示**当前模型提供商**的用量信息。
- 聊天中的`/usage off|tokens|full`：每条回复下方的用量页脚（OAuth 仅显示令牌）。
- 聊天中的`/usage cost`：基于 OpenClaw 会话日志聚合的本地费用摘要。
- CLI：`openclaw status --usage` 打印完整的按提供商细分的用量明细。
- CLI：`openclaw channels list` 打印相同的用量快照，并附带提供商配置（可使用 `--no-usage` 跳过配置输出）。
- macOS 菜单栏：上下文菜单下的“使用情况”部分（仅在可用时显示）。

## 支持的提供商与凭证
- **Anthropic（Claude）**：认证配置文件中的 OAuth 令牌。
- **GitHub Copilot**：认证配置文件中的 OAuth 令牌。
- **Gemini CLI**：认证配置文件中的 OAuth 令牌。
- **Antigravity**：认证配置文件中的 OAuth 令牌。
- **OpenAI Codex**：认证配置文件中的 OAuth 令牌（如果存在，则使用 accountId）。
- **MiniMax**：API 密钥（编码计划密钥；`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_API_KEY`）；使用 5 小时编码计划时间窗口。
- **z.ai**：通过环境变量/配置/认证存储提供的 API 密钥。

如果没有匹配的 OAuth/API 凭证，使用情况将被隐藏。
