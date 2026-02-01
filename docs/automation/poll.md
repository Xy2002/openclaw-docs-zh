---
summary: Poll sending via gateway + CLI
read_when:
  - Adding or modifying poll support
  - Debugging poll sends from the CLI or gateway
---
# 投票


## 支持的渠道
- WhatsApp（网页渠道）
- Discord
- MS Teams（自适应卡片）

## CLI

```bash
# WhatsApp
openclaw message poll --target +15555550123 \
  --poll-question "Lunch today?" --poll-option "Yes" --poll-option "No" --poll-option "Maybe"
openclaw message poll --target 123456789@g.us \
  --poll-question "Meeting time?" --poll-option "10am" --poll-option "2pm" --poll-option "4pm" --poll-multi

# Discord
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Snack?" --poll-option "Pizza" --poll-option "Sushi"
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Plan?" --poll-option "A" --poll-option "B" --poll-duration-hours 48

# MS Teams
openclaw message poll --channel msteams --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" --poll-option "Pizza" --poll-option "Sushi"
```

选项：
- `--channel`: `whatsapp`（默认）、`discord` 或 `msteams`
- `--poll-multi`: 允许选择多个选项
- `--poll-duration-hours`: 仅限 Discord（省略时默认为 24）

## 网关 RPC

方法： `poll`

参数：
- `to`（字符串，必填）
- `question`（字符串，必填）
- `options`（字符串数组，必填）
- `maxSelections`（数字，可选）
- `durationHours`（数字，可选）
- `channel`（字符串，可选，默认为 `whatsapp`)
- `idempotencyKey`（字符串，必填）

## 各渠道差异
- WhatsApp：支持 2–12 个选项，`maxSelections` 必须在选项数量范围内，忽略 `durationHours`。
- Discord：支持 2–10 个选项，`durationHours` 被限制在 1–768 小时之间（默认值为 24）。`maxSelections > 1` 启用多选；Discord 不支持严格限定选项数量。
- MS Teams：使用由 OpenClaw 管理的自适应卡片投票。无原生投票 API；`durationHours` 被忽略。

## 代理工具（消息）
使用 `message` 工具，并指定 `poll` 操作（`to`、`pollQuestion`、`pollOption`，以及可选的 `pollMulti`、`pollDurationHours`、`channel`）。

注意：Discord 没有“精确选择 N 个”的模式；`pollMulti` 对应多选模式。Teams 投票以自适应卡片形式呈现，且需要网关保持在线，以便在 `~/.openclaw/msteams-polls.json` 中记录投票结果。
