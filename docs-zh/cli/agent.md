---
summary: CLI reference for `openclaw agent` (send one agent turn via the Gateway)
read_when:
  - You want to run one agent turn from scripts (optionally deliver reply)
---
# `openclaw agent`

通过网关运行代理回合（嵌入式使用__ INLINE_CODE_2__）。
使用__ INLINE_CODE_3__直接定位已配置的代理。

相关：
- 代理发送工具：[代理发送](/tools/agent-send)

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```
