---
summary: >-
  How inbound audio/voice notes are downloaded, transcribed, and injected into
  replies
read_when:
  - Changing audio transcription or media handling
---
# 音频/语音笔记 — 2026-01-17

## 工作原理
- **媒体理解（音频）**：如果已启用（或自动检测到）音频理解，OpenClaw会执行以下操作：
  1) 查找第一个音频附件（本地路径或URL），并在需要时下载它。
  2) 在将音频发送给每个模型条目之前，强制执行 `maxBytes`。
  3) 按顺序运行第一个符合条件的模型条目（提供商或CLI）。
  4) 如果该条目失败或因大小或超时而跳过，则尝试下一个条目。
  5) 如果成功，它会用一个 `[Audio]` 块替换 `Body`，并设置 `{{Transcript}}`。
- **命令解析**：当转录成功时，`CommandBody`/`RawBody` 会被设置为转录文本，因此斜杠命令仍能正常工作。
- **详细日志记录**：在 `--verbose` 中，我们会记录转录何时运行以及何时替换正文。

## 自动检测（默认）
如果您 **未配置模型** 且 `tools.media.audio.enabled` 未设置为 `false`，OpenClaw会按以下顺序进行自动检测，并在找到第一个可用选项时停止：

1) **本地 CLI**（如果已安装）
   - `sherpa-onnx-offline`（需要 `SHERPA_ONNX_MODEL_DIR`，包含编码器、解码器、连接器和标记）
   - `whisper-cli`（来自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或捆绑的微型模型）
   - `whisper`（Python CLI；自动下载模型）
2) **Gemini CLI** (`gemini`) 使用 `read_many_files`
3) **提供商密钥**（OpenAI → Groq → Deepgram → Google）

要禁用自动检测，请设置 `tools.media.audio.enabled: false`。要自定义，请设置 `tools.media.audio.models`。注意：二进制检测在 macOS/Linux/Windows 上属于尽力而为；请确保 CLI 在 `PATH` 上（我们会扩展 `~`），或者通过完整的命令路径显式指定 CLI 模型。

## 配置示例

### 提供商 + CLI 备用（OpenAI + Whisper CLI）
```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45
          }
        ]
      }
    }
  }
}
```

### 仅提供商模式，带作用域限制
```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [
            { action: "deny", match: { chatType: "group" } }
          ]
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" }
        ]
      }
    }
  }
}
```

### 仅提供商模式（Deepgram）
```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }]
      }
    }
  }
}
```

## 注意事项与限制
- 提供商身份验证遵循标准模型身份验证顺序（身份验证配置文件、环境变量、`models.providers.*.apiKey`）。
- 当使用 `provider: "deepgram"` 时，Deepgram 会采用 `DEEPGRAM_API_KEY`。
- Deepgram 设置详情：[Deepgram（音频转录）](/providers/deepgram)。
- 音频提供商可通过 `tools.media.audio` 覆盖 `baseUrl`、`headers` 和 `providerOptions`。
- 默认大小上限为 20MB（`tools.media.audio.maxBytes`）。超过此大小的音频将被跳过，并尝试下一个条目。
- 音频的默认 `maxChars` 设置为 **未设置**（完整转录）。设置 `tools.media.audio.maxChars` 或每条目的 `maxChars` 来裁剪输出。
- OpenAI 的自动默认值为 `gpt-4o-mini-transcribe`；若需更高精度，可设置 `model: "gpt-4o-transcribe"`。
- 使用 `tools.media.audio.attachments` 处理多个语音笔记（`mode: "all"` + `maxAttachments`）。
- 转录文本可作为 `{{Transcript}}` 提供给模板。
- CLI 标准输出有上限（5MB）；请保持 CLI 输出简洁。

## 需要注意的问题
- 作用域规则遵循“首次匹配优先”原则。`chatType` 会被规范化为 `direct`、`group` 或 `room`。
- 确保您的 CLI 以退出代码 0 结束，并输出纯文本；JSON 数据需要通过 `jq -r .text` 进行处理。
- 请设置合理的超时时间（`timeoutSeconds`，默认 60 秒），以避免阻塞回复队列。
