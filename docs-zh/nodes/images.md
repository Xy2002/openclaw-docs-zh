---
summary: 'Image and media handling rules for send, gateway, and agent replies'
read_when:
  - Modifying media pipeline or attachments
---
# 图片与媒体支持 — 2025-12-05

WhatsApp 频道通过 **Baileys Web** 运行。本文档记录了当前在发送、网关和客服回复中处理媒体的规则。

## 目标
- 通过 `openclaw message send --media` 发送带有可选标题的媒体。
- 允许来自网页收件箱的自动回复在文本之外包含媒体。
- 保持每种类型限制合理且可预测。

## CLI 界面
- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 为可选项；仅发送媒体时，标题可以为空。
  - `--dry-run` 打印解析后的有效载荷；`--json` 输出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 频道行为
- 输入：本地文件路径 **或** HTTP(S) URL。
- 流程：加载到缓冲区，检测媒体类型，并构建正确的有效载荷：
  - **图片：** 调整大小并重新压缩为 JPEG（最长边 2048px），目标为 `agents.defaults.mediaMaxMb`（默认 5 MB），上限为 6 MB。
  - **音频/语音/视频：** 直通传输，上限为 16 MB；音频以语音消息形式发送 (`ptt: true`)。
  - **文档：** 其他任何类型的文件，上限为 100 MB，如果提供文件名则保留文件名。
- WhatsApp GIF 样式播放：发送带有 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），以便移动客户端在内嵌中循环播放。
- MIME 检测优先使用魔数字节，其次使用头信息，最后使用文件扩展名。
- 标题来自 `--message` 或 `reply.text`；允许空标题。
- 日志记录：非详细模式显示 `↩️`/`✅`；详细模式包括文件大小以及源路径/URL。

## 自动回复流程
- `getReplyFromConfig` 返回 `{ text?, mediaUrl?, mediaUrls? }`。
- 当存在媒体时，网页发送器使用与 `openclaw message send` 相同的流程解析本地路径或 URL。
- 如果提供多个媒体条目，则按顺序依次发送。

## 入站媒体到命令（Pi）
- 当入站网页消息包含媒体时，OpenClaw 会将其下载到临时文件，并公开模板变量：
  - `{{MediaUrl}}` 是入站媒体的伪 URL。
  - `{{MediaPath}}` 是在运行命令之前写入的本地临时路径。
- 当启用了会话级 Docker 沙盒时，入站媒体会被复制到沙盒工作区，并且 `MediaPath`/`MediaUrl` 会被重写为类似 `media/inbound/<filename>` 的相对路径。
- 媒体理解（如果通过 `tools.media.*` 或共享 `tools.media.models` 配置）在模板化之前运行，并可在 `Body` 中插入 `[Image]`、`[Audio]` 和 `[Video]` 块。
  - 音频设置 `{{Transcript}}`，并使用转录内容进行命令解析，因此斜杠命令仍能正常工作。
  - 视频和图片描述会保留任何标题文本，用于命令解析。
- 默认情况下，仅处理第一个匹配的图片/音频/视频附件；设置 `tools.media.<cap>.attachments` 可以处理多个附件。

## 限制与错误
**出站发送上限（WhatsApp 网页发送）**
- 图片：重新压缩后上限约为 6 MB。
- 音频/语音/视频：上限为 16 MB；文档：上限为 100 MB。
- 大于上限或无法读取的媒体 → 日志中显示明确错误，回复将被跳过。

**媒体理解上限（转录/描述）**
- 图片默认上限：10 MB (`tools.media.image.maxBytes`)。
- 音频默认上限：20 MB (`tools.media.audio.maxBytes`)。
- 视频默认上限：50 MB (`tools.media.video.maxBytes`)。
- 大于上限的媒体会跳过理解步骤，但回复仍会使用原始正文发送。

## 测试注意事项
- 覆盖图片、音频和文档场景的发送 + 回复流程。
- 验证图片的重新压缩（大小限制）以及音频的语音消息标志。
- 确保多媒体回复以顺序发送的方式展开。
