---
summary: >-
  Voice Call plugin: outbound + inbound calls via Twilio/Telnyx/Plivo (plugin
  install + config + CLI)
read_when:
  - You want to place an outbound voice call from OpenClaw
  - You are configuring or developing the voice-call plugin
---
# 语音通话（插件）

通过插件为 OpenClaw 提供语音通话功能，支持外呼通知以及基于入站策略的多轮对话。

当前提供商：

- `twilio`（可编程语音 + 媒体流）
- __INLINE_CODE_10__（呼叫控制 v2）
- `plivo`（语音 API + XML 转移 + GetInput 语音）
- `mock`（开发/无网络）

快速理解模型：

- 安装插件
- 重启网关
- 在 `plugins.entries.voice-call.config` 下进行配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 运行位置（本地与远程）

语音通话插件在**网关进程内部**运行。

如果使用远程网关，请在**运行网关的机器上**安装并配置插件，然后重启网关以加载插件。

## 安装

### 选项 A：通过 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启网关。

### 选项B：从本地文件夹安装（开发，无需复制）

```bash
openclaw plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

之后重启网关。

## 配置

在 `plugins.entries.voice-call.config` 下设置配置：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "..."
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "..."
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook"
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify" // notify | conversation
          },

          streaming: {
            enabled: true,
            streamPath: "/voice/stream"
          }
        }
      }
    }
  }
}
```

注意事项：

- Twilio/Telnyx 需要一个**可公开访问**的 Webhook URL。
- Plivo 需要一个**可公开访问**的 Webhook URL。
- `mock` 是一个本地开发提供商（无需网络调用）。
- `skipSignatureVerification` 仅用于本地测试。
- 如果您使用 ngrok 免费层级，请将 `publicUrl` 设置为确切的 ngrok URL；签名验证始终强制执行。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 仅在 `tunnel.provider="ngrok"` 和 `serve.bind` 使用环回（ngrok 本地代理）时，允许带有无效签名的 Twilio Webhook。仅供本地开发使用。
- Ngrok 免费层级的 URL 可能会变化或引入插页式行为；如果 `publicUrl` 发生漂移，Twilio 签名将失败。对于生产环境，建议使用稳定的域名或 Tailscale 漏斗。

## 用于通话的TTS

语音通话使用核心 `messages.tts` 配置（OpenAI 或 ElevenLabs）在通话中进行流式语音输出。您可以在插件配置中以**相同结构**覆盖该配置——它会与 `messages.tts` 进行深度合并。

```json5
{
  tts: {
    provider: "elevenlabs",
    elevenlabs: {
      voiceId: "pMsXgVXv3BLzUgSXRplE",
      modelId: "eleven_multilingual_v2"
    }
  }
}
```

注意事项：

- 在语音通话中，边缘TTS会被忽略（电信音频需要PCM；边缘输出不可靠）。
- 启用Twilio媒体流时使用核心TTS；否则，通话将回退到提供商的原生语音。

### 更多示例

仅使用核心TTS（不覆盖）：

```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: { voice: "alloy" }
    }
  }
}
```

仅对通话覆盖为 ElevenLabs（其他地方保持核心默认）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            elevenlabs: {
              apiKey: "elevenlabs_key",
              voiceId: "pMsXgVXv3BLzUgSXRplE",
              modelId: "eleven_multilingual_v2"
            }
          }
        }
      }
    }
  }
}
```

仅适用于通话覆盖的 OpenAI 模型（深度合并示例）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            openai: {
              model: "gpt-4o-mini-tts",
              voice: "marin"
            }
          }
        }
      }
    }
  }
}
```

来电

入站策略默认为 `disabled`。要启用入站通话，请设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?"
}
```

自动回复使用代理系统。可通过以下参数进行调整：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

## 命令行界面

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall expose --mode funnel
```

## 代理工具

工具名称：`voice_call`

操作：

- `initiate_call`（消息，收件人？，模式？）
- `continue_call`（通话 ID，消息）
- `speak_to_user`（通话 ID，消息）
- `end_call`（通话 ID）
- `get_status`（通话 ID）

此仓库随附匹配的技能文档，位于 `skills/voice-call/SKILL.md`。

## 网关 RPC

- `voicecall.initiate`（`to?`、`message`、`mode?`）
- `voicecall.continue`（`callId`、`message`）
- `voicecall.speak`（`callId`、`message`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）
