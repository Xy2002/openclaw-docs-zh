---
summary: Text-to-speech (TTS) for outbound replies
read_when:
  - Enabling text-to-speech for replies
  - Configuring TTS providers or limits
  - Using /tts commands
---
# 文本转语音（TTS）

OpenClaw 可以使用 ElevenLabs、OpenAI 或 Edge TTS 将出站回复转换为音频。只要 OpenClaw 能够发送音频，此功能即可在任何地方使用；在 Telegram 中，它会显示为一个圆形的语音消息气泡。

## 支持的服务

- **ElevenLabs**（主要或备用提供商）
- **OpenAI**（主要或备用提供商；也用于摘要生成）
- **Edge TTS**（主要或备用提供商；使用 `node-edge-tts`，在未提供 API 密钥时为默认选项）

### Edge TTS 注意事项

Edge TTS 通过 `node-edge-tts` 库使用 Microsoft Edge 的在线神经网络 TTS 服务。这是一项托管服务（而非本地服务），使用 Microsoft 的端点，且无需 API 密钥。`node-edge-tts` 提供了语音配置选项和输出格式，但并非所有选项都受 Edge 服务支持。citeturn2search0

由于 Edge TTS 是一项公开的网络服务，没有正式的 SLA 或配额限制，因此应将其视为尽力而为的服务。如果您需要有保障的限制和支持，请使用 OpenAI 或 ElevenLabs。Microsoft 的 Speech REST API 文档中规定，每次请求的音频上限为 10 分钟；Edge TTS 并未公布明确的限制，因此可假设其限制与之相似或更低。citeturn0search3

## 可选密钥

若要使用 OpenAI 或 ElevenLabs：
- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `OPENAI_API_KEY`

Edge TTS **不需要** API 密钥。如果未找到任何 API 密钥，OpenClaw 默认使用 Edge TTS（除非通过 `messages.tts.edge.enabled=false` 禁用）。

如果配置了多个提供商，则优先使用首选提供商，其他提供商作为备用选项。自动摘要功能使用已配置的 `summaryModel`（或 `agents.defaults.model.primary`），因此如果您启用摘要功能，该提供商也必须经过身份验证。

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI 音频 API 参考](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs 文本转语音](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 身份验证](https://elevenlabs.io/docs/api-reference/authentication)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft 语音输出格式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## 是否默认启用？

否。自动 TTS 默认是关闭的。您可以通过 `messages.tts.auto` 在配置中启用它，或者通过 `/tts always`（别名： `/tts on`）在会话级别启用。

一旦 TTS 功能开启，Edge TTS 就会默认启用，并在没有 OpenAI 或 ElevenLabs API 密钥可用时自动使用。

## 配置

TTS 配置位于 `openclaw.json` 下的 `messages.tts` 中。完整模式可在 [网关配置](/gateway/configuration)中找到。

### 最小配置（启用 + 提供商）

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs"
    }
  }
}
```

### OpenAI 为主，ElevenLabs 为备

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true
      },
      openai: {
        apiKey: "openai_api_key",
        model: "gpt-4o-mini-tts",
        voice: "alloy"
      },
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0
        }
      }
    }
  }
}
```

### Edge TTS 为主（无 API 密钥）

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "edge",
      edge: {
        enabled: true,
        voice: "en-US-MichelleNeural",
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "+10%",
        pitch: "-5%"
      }
    }
  }
}
```

### 禁用 Edge TTS

```json5
{
  messages: {
    tts: {
      edge: {
        enabled: false
      }
    }
  }
}
```

### 自定义限制 + 偏好路径

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json"
    }
  }
}
```

### 仅在收到入站语音消息后才以音频回复

```json5
{
  messages: {
    tts: {
      auto: "inbound"
    }
  }
}
```

### 禁用对长回复的自动摘要

```json5
{
  messages: {
    tts: {
      auto: "always"
    }
  }
}
```

然后运行：

```
/tts summary off
```

### 字段说明

- `auto`: 自动 TTS 模式（`off`、`always`、`inbound`、`tagged`）。
  - `inbound` 仅在收到入站语音消息后发送音频。
  - `tagged` 仅在回复包含 `[[tts]]` 标签时发送音频。
- `enabled`: 旧版切换开关（医生会将其迁移到 `auto`）。
- `mode`: `"final"`（默认）或 `"all"`（包括工具/屏蔽回复）。
- `provider`: `"elevenlabs"`、`"openai"` 或 `"edge"`（备用选项自动生效）。
- 如果 `provider` 未设置，OpenClaw 优先选择 `openai`（如果有密钥），然后是 `elevenlabs`（如果有密钥），否则使用 `edge`。
- `summaryModel`: 自动摘要的可选廉价模型，默认为 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或已配置的模型别名。
- `modelOverrides`: 允许模型发出 TTS 指令（默认开启）。
- `maxTextLength`: TTS 输入的硬性上限（字符数）。超过此值将导致失败。
- `timeoutMs`: 请求超时（毫秒）。
- `prefsPath`: 覆盖本地偏好 JSON 路径（提供商/限制/摘要）。
- `apiKey` 的值会回退到环境变量（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`OPENAI_API_KEY`）。
- `elevenlabs.baseUrl`: 转换 ElevenLabs API 的基础 URL。
- `elevenlabs.voiceSettings`:
  - `stability`、`similarityBoost`、`style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0`（1.0 = 正常）
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: 2 位 ISO 639-1 语言代码（例如 `en`、 `de`）
- `elevenlabs.seed`: 整数 `0..4294967295`（尽力而为的确定性）
- `edge.enabled`: 允许使用 Edge TTS（默认 `true`；无需 API 密钥）。
- `edge.voice`: Edge 神经网络语音名称（例如 `en-US-MichelleNeural`）。
- `edge.lang`: 语言代码（例如 `en-US`）。
- `edge.outputFormat`: Edge 输出格式（例如 `audio-24khz-48kbitrate-mono-mp3`）。
  - 请参阅 Microsoft 语音输出格式以获取有效值；并非所有格式都受 Edge 支持。
- `edge.rate` / `edge.pitch` / `edge.volume`: 百分比字符串（例如 `+10%`、 `-5%`）。
- `edge.saveSubtitles`: 在音频文件旁边写入 JSON 字幕。
- `edge.proxy`: Edge TTS 请求的代理 URL。
- `edge.timeoutMs`: 请求超时覆盖（毫秒）。

## 模型驱动的覆盖（默认开启）

默认情况下，模型 **可以** 为单个回复发出 TTS 指令。当 `messages.tts.auto` 设置为 `tagged` 时，这些指令是触发音频所必需的。

启用后，模型可以发出 `[[tts:...]]` 指令来覆盖单个回复的语音，还可以添加一个可选的 `[[tts:text]]...[[/tts:text]]` 块，以提供表情标签（如笑声、歌唱提示等），这些标签只应在音频中出现。

示例回复负载：

```
Here you go.

[[tts:provider=elevenlabs voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

启用时可用的指令键：
- `provider`（`openai` | `elevenlabs` | `edge`）
- `voice`（OpenAI 语音）或 `voiceId`（ElevenLabs）
- `model`（OpenAI TTS 模型或 ElevenLabs 模型 ID）
- `stability`、 `similarityBoost`、 `style`、 `speed`、 `useSpeakerBoost`
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

禁用所有模型覆盖：

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false
      }
    }
  }
}
```

可选白名单（禁用特定覆盖，同时保持标签启用）：

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: false,
        allowSeed: false
      }
    }
  }
}
```

## 用户级偏好

斜杠命令会将本地覆盖写入 `prefsPath`（默认： `~/.openclaw/settings/tts.json`，可通过 `OPENCLAW_TTS_PREFS` 或 `messages.tts.prefsPath` 覆盖）。

存储的字段：
- `enabled`
- `provider`
- `maxLength`（摘要阈值；默认 1500 字符）
- `summarize`（默认 `true`）

这些设置会覆盖该主机的 `messages.tts.*`。

## 输出格式（固定）

- **Telegram**: Opus 语音消息（来自 ElevenLabs 的 `opus_48000_64`，来自 OpenAI 的 `opus`）。
  - 48kHz / 64kbps 是语音消息的良好折衷，也是圆形气泡所必需的。
- **其他渠道**: MP3（来自 ElevenLabs 的 `mp3_44100_128`，来自 OpenAI 的 `mp3`）。
  - 44.1kHz / 128kbps 是语音清晰度的默认平衡。
- **Edge TTS**: 使用 `edge.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - `node-edge-tts` 接受 `outputFormat`，但并非所有格式都可从 Edge 服务获得。citeturn2search0
  - 输出格式值遵循 Microsoft 语音输出格式（包括 Ogg/WebM Opus）。citeturn1search0
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果您需要有保障的 Opus 语音消息，请使用 OpenAI/ElevenLabs。citeturn1search1
  - 如果配置的 Edge 输出格式无效，OpenClaw 会尝试使用 MP3。

OpenAI/ElevenLabs 的格式是固定的；Telegram 对于语音消息的用户体验要求使用 Opus。

## 自动 TTS 行为

启用后，OpenClaw：
- 如果回复已经包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过非常短的回复（少于 10 个字符）。
- 在启用摘要功能时，使用 `agents.defaults.model.primary`（或 `summaryModel`）对长回复进行摘要。
- 将生成的音频附加到回复中。

如果回复超过 `maxLength` 且摘要功能关闭（或摘要模型没有 API 密钥），则会跳过音频，发送普通的文本回复。

## 流程图

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## 斜杠命令使用

只有一个命令： `/tts`。有关启用详情，请参阅 [斜杠命令](/tools/slash-commands)。

Discord 注意事项： `/tts` 是 Discord 内置命令，因此 OpenClaw 在那里注册了 `/voice` 作为原生命令。文本 `/tts ...` 仍然有效。

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

注意事项：
- 命令需要授权发送者（白名单/所有者规则仍然适用）。
- 必须启用 `commands.text` 或原生命令注册。
- `off|always|inbound|tagged` 是会话级别的切换开关（`/tts on` 是 `/tts always` 的别名）。
- `limit` 和 `summary` 存储在本地偏好中，而不是主配置中。
- `/tts audio` 生成一次性音频回复（不会切换 TTS 开启状态）。

## 代理工具

`tts` 工具可将文本转换为语音，并返回一个 `MEDIA:` 路径。当结果与 Telegram 兼容时，该工具会包含 `[[audio_as_voice]]`，以便 Telegram 发送语音气泡。

## 网关 RPC

网关方法：
- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
