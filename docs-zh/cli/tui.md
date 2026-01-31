---
summary: CLI reference for `openclaw tui` (terminal UI connected to the Gateway)
read_when:
  - You want a terminal UI for the Gateway (remote-friendly)
  - You want to pass url/token/session from scripts
---
# `openclaw tui`

打开连接到网关的终端用户界面。

相关：
- TUI 指南：[TUI](/tui)

## 示例

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
```
