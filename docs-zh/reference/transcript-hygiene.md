---
summary: 'Reference: provider-specific transcript sanitization and repair rules'
read_when:
  - You are debugging provider request rejections tied to transcript shape
  - You are changing transcript sanitization or tool-call repair logic
  - You are investigating tool-call id mismatches across providers
---
# 转录本卫生处理（提供商修复）

本文件描述了在运行前（构建模型上下文时）应用于转录本的**特定于提供商的修复措施**。这些是**内存中**的调整，用于满足严格的提供商要求。它们**不会**重写磁盘上存储的 JSONL 格式转录本。

适用范围包括：
- 工具调用 ID 的清理
- 工具结果配对修复
- 话轮验证与排序
- 思考签名清理
- 图像负载清理

如需了解转录本存储的详细信息，请参阅：
- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## 执行位置

所有转录本卫生处理都集中在一个嵌入式运行器中：
- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`sanitizeSessionHistory` 在 `src/agents/pi-embedded-runner/google.ts` 中

策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些修复。

---

## 全局规则：图像清理

图像负载始终会进行清理，以防止因大小限制而导致提供商端拒绝（对过大的 Base64 图像进行缩小或重新压缩）。

实现方式：
- `sanitizeSessionMessagesImages` 在 `src/agents/pi-embedded-helpers/images.ts` 中
- `sanitizeContentBlocksImages` 在 `src/agents/tool-images.ts` 中

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**
- 仅执行图像清理。
- 当模型切换到 OpenAI Responses 或 Codex 时，丢弃孤立的推理签名（即没有后续内容块的独立推理条目）。
- 不执行工具调用 ID 清理。
- 不执行工具结果配对修复。
- 不执行话轮验证或重新排序。
- 不生成合成工具结果。
- 不剥离思考签名。

**Google（Generative AI / Gemini CLI / Antigravity）**
- 工具调用 ID 清理：严格采用字母数字格式。
- 执行工具结果配对修复和合成工具结果。
- 执行话轮验证（Gemini 风格的话轮交替）。
- Google 话轮排序修复：如果历史记录以助手消息开头，则在最前面插入一条极小的用户引导消息。
- Antigravity Claude：规范化思考签名；丢弃未签名的思考块。

**Anthropic / Minimax（兼容 Anthropic）**
- 执行工具结果配对修复和合成工具结果。
- 执行话轮验证（合并连续的用户话轮以满足严格的交替规则）。

**Mistral（包括基于模型 ID 的检测）**
- 工具调用 ID 清理：strict9 格式（长度为 9 的字母数字字符串）。

**OpenRouter Gemini**
- 思考签名清理：移除非 Base64 的 `thought_signature` 值（保留 Base64）。

**其他所有提供商**
- 仅执行图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本发布之前，OpenClaw 会对转录本实施多层卫生处理：

- 每次构建上下文时都会运行一个 **转录本清理扩展**，该扩展可以：
  - 修复工具使用与结果的配对问题。
  - 清理工具调用 ID（包括一种非严格模式，可保留 `_`/`-`）。
- 运行器还会执行特定于提供商的清理工作，导致重复操作。
- 在提供商策略之外还发生了其他变更，包括：
  - 在持久化之前从助手文本中删除 `<final>` 标签。
  - 丢弃空的助手错误话轮。
  - 在工具调用之后修剪助手内容。

这种复杂性导致了跨提供商的回归问题（尤其是 `openai-responses` 和 `call_id|fc_id` 的配对问题）。在 2026.1.22 版本中，清理工作移除了该扩展，将逻辑集中到运行器中，并使 OpenAI 除了图像清理外“完全不干预”。
