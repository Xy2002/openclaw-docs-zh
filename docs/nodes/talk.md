---
summary: 'Talk mode: continuous speech conversations with ElevenLabs TTS'
read_when:
  - Implementing Talk mode on macOS/iOS/Android
  - Changing voice/TTS/interrupt behavior
---
# 交谈模式

交谈模式是一个持续的语音对话循环：
1) 监听语音
2) 将转录文本发送给模型（主会话，chat.send）
3) 等待响应
4) 通过 ElevenLabs 播放该响应（流式播放）

## 行为（macOS）
- 当交谈模式启用时，始终显示一个**始终可见的叠加层**。
- 在“聆听 → 思考 → 说话”之间进行阶段转换。
- 在出现**短暂停顿**（静音窗口）时，当前转录文本会被发送。
- 回复会**写入 WebChat**（与手动输入相同）。
- **语音打断功能**（默认开启）：如果助手正在讲话时用户开始说话，我们会立即停止播放，并记录打断时间戳，以便在下一次提示中使用。

## 回复中的语音指令
助手可以在回复前添加**单行 JSON**来控制语音：

```json
{"voice":"<voice-id>","once":true}
```

规则：
- 只允许第一行非空内容。
- 未知键将被忽略。
- `once: true` 仅适用于当前回复。
- 如果没有 `once`，该语音将成为交谈模式的新默认语音。
- 在 TTS 播放之前，JSON 行会被剥离。

支持的键：
- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate`（WPM）、`stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 配置 (`~/.openclaw/openclaw.json`)
```json5
{
  "talk": {
    "voiceId": "elevenlabs_voice_id",
    "modelId": "eleven_v3",
    "outputFormat": "mp3_44100_128",
    "apiKey": "elevenlabs_api_key",
    "interruptOnSpeech": true
  }
}
```

默认值：
- `interruptOnSpeech`: true
- `voiceId`: 默认回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或在提供 API 密钥时使用第一个 ElevenLabs 语音）
- `modelId`: 未设置时默认为 `eleven_v3`
- `apiKey`: 默认回退到 `ELEVENLABS_API_KEY`（或在可用时使用网关 shell 配置文件）
- `outputFormat`: macOS/iOS 上默认为 `pcm_44100`，Android 上默认为 `pcm_24000`（设置 `mp3_*` 可强制使用 MP3 流式传输）

## macOS 用户界面
- 菜单栏切换按钮：**交谈**
- 配置选项tab：**交谈模式**组（语音 ID + 打断开关）
- 叠加层：
  - **聆听**：云图标随麦克风音量脉动
  - **思考**：下沉动画
  - **说话**：辐射状光圈
  - 单击云图标：停止说话
  - 单击 X：退出交谈模式

## 备注
- 需要语音和麦克风权限。
- 使用 `chat.send` 对会话密钥 `main` 进行验证。
- TTS 使用 ElevenLabs 流式 API，并在 macOS/iOS/Android 上采用 `ELEVENLABS_API_KEY` 和增量播放以降低延迟。
- `stability` 对于 `eleven_v3` 的验证范围为 `0.0`、 `0.5` 或 `1.0`；其他模型接受 `0..1`。
- 如果设置了 `latency_tier`，则会对其有效性进行验证，确保其符合 `0..4` 的要求。
- Android 支持 `pcm_16000`、 `pcm_22050`、 `pcm_24000` 和 `pcm_44100` 输出格式，以实现低延迟的 AudioTrack 流式传输。
