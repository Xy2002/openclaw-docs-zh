---
summary: CLI reference for `openclaw voicecall` (voice-call plugin command surface)
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|status|tail|expose`
---
# `openclaw voicecall`

`voicecall` 是插件提供的命令。仅在已安装并启用语音通话插件时才会显示。

主要文档：
- 语音通话插件：[语音通话](/plugins/voice-call)

## 常用命令

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## 暴露 Webhook（Tailscale）

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall unexpose
```

安全提示：请仅将 Webhook 端点暴露给您信任的网络。在可能的情况下，优先使用 Tailscale Serve 而不是 Funnel。
