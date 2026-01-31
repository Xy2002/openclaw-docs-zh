---
summary: >-
  Inbound image/audio/video understanding (optional) with provider + CLI
  fallbacks
read_when:
  - Designing or refactoring media understanding
  - Tuning inbound audio/video/image preprocessing
---
# 媒体理解（入站）— 2026-01-17

在回复管道运行之前，OpenClaw可以**总结入站媒体**（图像/音频/视频）。它会自动检测本地工具或提供商密钥是否可用，并且可以被禁用或自定义。如果媒体理解功能关闭，模型仍会照常接收原始文件/URL。

## 目标
- 可选：将入站媒体预先摘要为简短文本，以加快路由速度并提升命令解析效果。
- 始终保留向模型传递原始媒体的方式。
- 支持**提供商 API**和**CLI 备用方案**。
- 允许多个模型按顺序进行回退（基于错误、大小或超时）。

## 高级别行为
1) 收集入站附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
2) 对于每个启用的功能（图像/音频/视频），根据策略选择附件（默认：**第一个**）。
3) 选择首个符合条件的模型条目（基于大小、功能和认证）。
4) 如果某个模型失败或媒体过大，则**回退到下一个条目**。
5) 成功时：
   - `Body` 将变为 `[Image]`、`[Audio]` 或 `[Video]` 块。
   - 音频设置 `{{Transcript}}`；在存在字幕文本时，命令解析使用字幕文本，否则使用转录文本。
   - 字幕作为 `User text:` 在块内保留。

如果媒体理解失败或被禁用，**回复流程将继续**，使用原始正文和附件。

## 配置概览
`tools.media` 支持**共享模型**以及按功能覆盖：
- `tools.media.models`：共享模型列表（使用 `capabilities` 进行门控）。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`：
  - 默认值（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
  - 提供商覆盖（`baseUrl`、`headers`、`providerOptions`）
  - 通过 `tools.media.audio.providerOptions.deepgram` 支持 Deepgram 音频选项
  - 可选的**按功能 `models` 列表**（优先于共享模型）
  - `attachments` 策略（`mode`、`maxAttachments`、`prefer`）
  - `scope`（可选，按频道/聊天类型/会话密钥进行门控）
- `tools.media.concurrency`：最大并发功能运行数（默认 **2**）。

```json5
{
  tools: {
    media: {
      models: [ /* shared list */ ],
      image: { /* optional overrides */ },
      audio: { /* optional overrides */ },
      video: { /* optional overrides */ }
    }
  }
}
```

### 模型条目
每个 `models[]` 条目可以是**提供商**或**CLI**：

```json5
{
  type: "provider",        // default if omitted
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback"
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters."
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"]
}
```

CLI 模板还可以使用：
- `{{MediaDir}}`（包含媒体文件的目录）
- `{{OutputDir}}`（为此运行创建的临时目录）
- `{{OutputBase}}`（临时文件的基本路径，不含扩展名）

## 默认值和限制
推荐的默认值：
- `maxChars`：图像/视频为 **500**（简短，适合命令）
- `maxChars`：音频为 **未设置**（除非您设置限制，否则为完整转录）
- `maxBytes`：
  - 图像：**10MB**
  - 音频：**20MB**
  - 视频：**50MB**

规则：
- 如果媒体超过 `maxBytes`，则跳过该模型并**尝试下一个模型**。
- 如果模型返回的内容超过 `maxChars`，则对输出进行截断。
- `prompt` 默认为简单的“描述 {媒体}。”加上 `maxChars` 的指导（仅限图像/视频）。
- 如果 `<capability>.enabled: true` 但未配置任何模型，OpenClaw会尝试**活跃的回复模型**，前提是其提供商支持相应功能。

### 自动检测媒体理解（默认）
如果 `tools.media.<capability>.enabled` 未设置为 `false`，且您尚未配置模型，OpenClaw将按以下顺序自动检测，并**在找到第一个有效选项时停止**：

1) **本地 CLI**（仅限音频；如果已安装）
   - `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR` 包含编码器/解码器/合并器/标记）
   - `whisper-cli`（`whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或捆绑的小型模型）
   - `whisper`（Python CLI；自动下载模型）
2) **Gemini CLI**（`gemini`）使用 `read_many_files`
3) **提供商密钥**
   - 音频：OpenAI → Groq → Deepgram → Google
   - 图像：OpenAI → Anthropic → Google → MiniMax
   - 视频：Google

要禁用自动检测，请设置：
```json5
{
  tools: {
    media: {
      audio: {
        enabled: false
      }
    }
  }
}
```
注意：二进制检测在 macOS/Linux/Windows 上尽最大努力；确保 CLI 在 `PATH` 上（我们会扩展 `~`），或使用完整的命令路径显式设置 CLI 模型。

## 功能（可选）
如果您设置 `capabilities`，该条目仅针对这些媒体类型运行。对于共享列表，OpenClaw可以推断默认值：
- `openai`、`anthropic`、`minimax`：**图像**
- `google`（Gemini API）：**图像 + 音频 + 视频**
- `groq`：**音频**
- `deepgram`：**音频**

对于 CLI 条目，**请显式设置 `capabilities`**，以避免意外匹配。如果您省略 `capabilities`，该条目将适用于其所在的列表。

## 提供商支持矩阵（OpenClaw 集成）
| 功能 | 提供商集成 | 备注 |
|------------|----------------------|-------|
| 图像 | OpenAI / Anthropic / Google / 其他通过 `pi-ai` | 注册表中任何支持图像的模型均可使用。 |
| 音频 | OpenAI、Groq、Deepgram、Google | 提供商转录（Whisper/Deepgram/Gemini）。 |
| 视频 | Google（Gemini API） | 提供商视频理解。 |

## 推荐的提供商
**图像**
- 如果您的活跃模型支持图像，请优先使用它。
- 好的默认值：`openai/gpt-5.2`、`anthropic/claude-opus-4-5`、`google/gemini-3-pro-preview`。

**音频**
- `openai/gpt-4o-mini-transcribe`、`groq/whisper-large-v3-turbo` 或 `deepgram/nova-3`。
- CLI 备用方案：`whisper-cli`（whisper-cpp）或 `whisper`。
- Deepgram 设置：[Deepgram（音频转录）](/providers/deepgram)。

**视频**
- `google/gemini-3-flash-preview`（快速），`google/gemini-3-pro-preview`（更丰富）。
- CLI 备用方案：`gemini` CLI（支持 `read_file` 处理视频/音频）。

## 附件策略
按功能 `attachments` 控制处理哪些附件：
- `mode`：`first`（默认）或 `all`
- `maxAttachments`：限制处理的附件数量（默认 **1**）
- `prefer`：`first`、`last`、`path`、`url`

当 `mode: "all"` 时，输出会被标记为 `[Image 1/2]`、`[Audio 2/2]` 等。

## 配置示例

### 1) 分享模型列表 + 覆盖
```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.2", capabilities: ["image"] },
        { provider: "google", model: "gemini-3-flash-preview", capabilities: ["image", "audio", "video"] },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters."
          ],
          capabilities: ["image", "video"]
        }
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 }
      },
      video: {
        maxChars: 500
      }
    }
  }
}
```

### 2) 仅音频 + 视频（图像关闭）
```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"]
          }
        ]
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters."
            ]
          }
        ]
      }
    }
  }
}
```

### 3) 可选图像理解
```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.2" },
          { provider: "anthropic", model: "claude-opus-4-5" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters."
            ]
          }
        ]
      }
    }
  }
}
```

### 4) 多模态单条目（明确指定功能）
```json5
{
  tools: {
    media: {
      image: { models: [{ provider: "google", model: "gemini-3-pro-preview", capabilities: ["image", "video", "audio"] }] },
      audio: { models: [{ provider: "google", model: "gemini-3-pro-preview", capabilities: ["image", "video", "audio"] }] },
      video: { models: [{ provider: "google", model: "gemini-3-pro-preview", capabilities: ["image", "video", "audio"] }] }
    }
  }
}
```

## 状态输出
当媒体理解运行时，`/status` 会包含一行简短摘要：

```
📎 Media: image ok (openai/gpt-5.2) · audio skipped (maxBytes)
```

这显示了按功能的结果，以及适用时所选的提供商/模型。

## 注意事项
- 媒体理解是**尽力而为**的。错误不会阻止回复。
- 即使媒体理解被禁用，附件仍会传递给模型。
- 使用 `scope` 限制媒体理解的适用范围（例如仅限私信）。

## 相关文档
- [配置](/gateway/configuration)
- [图像与媒体支持](/nodes/images)
