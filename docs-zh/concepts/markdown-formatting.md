---
summary: Markdown formatting pipeline for outbound channels
read_when:
  - You are changing markdown formatting or chunking for outbound channels
  - You are adding a new channel formatter or style mapping
  - You are debugging formatting regressions across channels
---
# Markdown 格式化

OpenClaw 通过将出站 Markdown 转换为共享的中间表示（IR），再生成特定渠道的输出，从而对 Markdown 进行格式化。IR 在保留源文本完整性的基础上，携带样式和链接范围信息，确保在不同渠道中进行分块和渲染时保持一致。

## 目标

- **一致性：** 一次解析步骤，多种渲染器。
- **安全分块：** 在渲染前分割文本，确保内联格式不会跨分块断裂。
- **渠道适配：** 将同一 IR 映射到 Slack mrkdwn、Telegram HTML 和 Signal 样式范围，而无需重新解析 Markdown。

## 流程

1. **解析 Markdown → IR**
   - IR 是纯文本加上样式跨度（粗体/斜体/删除线/代码/彩蛋）和链接跨度。
   - 偏移量以 UTF-16 代码单元为单位，以便 Signal 样式范围与其 API 对齐。
   - 表格仅在渠道选择启用表格转换时才会被解析。
2. **对 IR 进行分块（先格式化后分块）**
   - 分块操作在 IR 文本上完成，先于渲染。
   - 内联格式不会跨分块拆分；跨度会按每个分块进行切分。
3. **按渠道渲染**
   - **Slack：** mrkdwn 令牌（粗体/斜体/删除线/代码），链接作为 `<url|label>`。
   - **Telegram：** HTML 标签（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：** 纯文本 + `text-style` 范围；当标签与 URL 不同时，链接变为 `label (url)`。

## IR 示例

输入 Markdown：

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR（示意）：

```json
{
  "text": "Hello world — see docs.",
  "styles": [
    { "start": 6, "end": 11, "style": "bold" }
  ],
  "links": [
    { "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }
  ]
}
```

## 使用场景

- Slack、Telegram 和 Signal 的出站适配器均基于 IR 进行渲染。
- 其他渠道（WhatsApp、iMessage、MS Teams、Discord）仍使用纯文本或其自身的格式化规则，并在启用时于分块前应用 Markdown 表格转换。

## 表格处理

Markdown 表格在不同聊天客户端中的支持并不一致。使用 `markdown.tables` 可以控制各渠道（以及各账户）的表格转换行为。

- `code`：将表格渲染为代码块（大多数渠道的默认设置）。
- `bullets`：将每行转换为项目符号列表（Signal 和 WhatsApp 的默认设置）。
- `off`：禁用表格解析和转换；原始表格文本原样传递。

配置键：

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## 分块规则

- 分块限制来自渠道适配器或配置，并应用于 IR 文本。
- 代码围栏作为一个整体块保留，并在末尾添加换行符，以确保渠道能够正确渲染。
- 列表前缀和引用前缀属于 IR 文本的一部分，因此分块不会在前缀中间断开。
- 内联样式（粗体/斜体/删除线/内联代码/彩蛋）绝不会跨分块拆分；渲染器会在每个分块内部重新打开这些样式。

如需了解各渠道的分块行为详情，请参阅 [流式传输 + 分块](/concepts/streaming)。

## 链接策略

- **Slack：** `[label](url)` → `<url|label>`；裸 URL 保持原样。为避免重复链接，解析时禁用自动链接。
- **Telegram：** `[label](url)` → `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` → `label (url)`，除非标签与 URL 匹配。

## 彩蛋

彩蛋标记（`||spoiler||`）仅针对 Signal 进行解析，并映射到 SPOILER 样式范围。其他渠道将其视为纯文本。

## 如何添加或更新渠道格式化器

1. **一次解析：** 使用共享的 `markdownToIR(...)` 辅助函数，并传入适合渠道的选项（自动链接、标题样式、引用前缀）。
2. **渲染：** 实现一个带有 `renderMarkdownWithMarkers(...)` 和样式标记映射（或 Signal 样式范围）的渲染器。
3. **分块：** 在渲染前调用 `chunkMarkdownIR(...)`；逐个分块进行渲染。
4. **连接适配器：** 更新渠道出站适配器以使用新的分块器和渲染器。
5. **测试：** 如果渠道使用分块功能，则添加或更新格式测试以及出站交付测试。

## 常见陷阱

- Slack 的尖括号令牌（`<@U123>`、`<#C123>`、`<https://...>`）必须保留；请安全转义原始 HTML。
- Telegram HTML 要求对标签外的文本进行转义，以避免标记损坏。
- Signal 样式范围依赖于 UTF-16 偏移量；请勿使用代码点偏移量。
- 对于带围栏的代码块，务必保留尾部换行符，以确保结束标记位于单独一行上。
