---
summary: 'Reference: provider-specific transcript sanitization and repair rules'
read_when:
  - You are debugging provider request rejections tied to transcript shape
  - You are changing transcript sanitization or tool-call repair logic
  - You are investigating tool-call id mismatches across providers
---
# 转录本卫生处理（提供商修复）

本文件描述了在运行前（构建模型上下文时）应用于转录本的**特定于提供商的修复措施**。这些是在**内存中**进行的调整，用于满足严格的提供商要求。它们**不会**覆盖磁盘上以 JSONL 格式存储的转录本。

适用范围包括：

- 工具调用ID净化
- 工具结果配对修复
- 话轮验证与排序
- 思考签名清理
- 图像负载净化

如需了解转录本存储的详细信息，请参阅：

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## 执行位置

所有转录本的卫生处理都集中在一个嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 净化/修复应用：在 `src/agents/pi-embedded-runner/google.ts` 中的 `sanitizeSessionHistory`

策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些修复。

---

## 全局规则：图像净化

图像负载始终会进行净化，以防止因大小限制而导致提供商端拒绝（例如，对过大的Base64图像进行缩小或重新压缩）。

实现方式：

- `sanitizeSessionMessagesImages` 在 `src/agents/pi-embedded-helpers/images.ts` 中
- `sanitizeContentBlocksImages` 在 `src/agents/tool-images.ts` 中

---

## 供应商矩阵（当前行为）

**OpenAI / OpenAI 编码器**

- 仅执行图像净化。
- 当模型切换到 OpenAI Responses 或 Codex 时，丢弃孤立的推理签名（即没有后续内容块的独立推理条目）。
- 不执行工具调用 ID 净化。
- 不执行工具结果配对修复。
- 不进行话轮验证或重新排序。
- 不生成合成工具结果。
- 不剥离思考签名。

**谷歌（生成式人工智能 / Gemini CLI / 反重力）**

- 工具调用ID净化：严格采用字母数字格式。
- 执行工具结果配对修复，并合成工具结果。
- 进行话轮验证（遵循Gemini风格的话轮交替规则）。
- Google话轮排序修复：如果对话历史以助手发言开头，则在开头插入一个极小的用户引导话轮。
- Antigravity Claude：规范化思考签名；丢弃未签名的思考块。

**Anthropic / Minimax（兼容 Anthropic）**

- 执行工具结果配对修复和合成工具结果。
- 进行话轮验证（合并连续的用户话轮，以满足严格的交替规则）。

**Mistral（包括基于模型ID的检测）**

- 工具调用ID净化：严格模式，长度为9的字母数字字符串。

**开放路由器双子星**

- 思考签名清理：剥离非 Base64 的 `thought_signature` 值（保留 Base64）。

**其他所有提供商**

- 仅执行图像净化。

---

## 历史行为（2026年1月22日之前）

在2026年1月22日版本发布之前，OpenClaw将对转录本实施多层卫生处理：

- 每次构建上下文时，都会运行一个**转录本净化扩展**，该扩展能够：
  - 修复工具使用与结果之间的配对问题。
  - 净化工具调用 ID（包括一种非严格模式，可保留 `_`/`-`）。
- 运行器还会执行特定于提供商的净化操作，从而导致工作重复。
- 除了提供商策略之外，还发生了其他变更，包括：
  - 在持久化之前从助手文本中剥离 `<final>` 标记。
  - 丢弃空的助手错误话轮。
  - 在工具调用后修剪助手内容。

这种复杂性导致了跨提供商的回归问题（尤其是 `openai-responses` 和 `call_id|fc_id` 的配对问题）。在 2026.1.22 版本中，相关扩展被移除，逻辑被集中到运行器中，并且除了图像净化外，OpenAI 被设为“无需干预”。
