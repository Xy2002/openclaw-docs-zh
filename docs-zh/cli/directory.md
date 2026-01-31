---
summary: 'CLI reference for `openclaw directory` (self, peers, groups)'
read_when:
  - You want to look up contacts/groups/self ids for a channel
  - You are developing a channel directory adapter
---
# `openclaw directory`

支持该功能的渠道（联系人/对等方、群组和“我”）的目录查找。

## 常用标志
- `--channel <name>`: 渠道 ID/别名（配置了多个渠道时必填；仅配置一个渠道时自动）
- `--account <id>`: 账户 ID（默认：渠道默认值）
- `--json`: 输出 JSON

## 注意事项
- `directory` 旨在帮助您找到可粘贴到其他命令中的 ID（尤其是 `openclaw message send --target ...`）。
- 对于许多渠道，结果基于配置（白名单或已配置的群组），而非实时提供商目录。
- 默认输出为 `id`（有时还包括 `name`），以制表符分隔；脚本编写时请使用 `--json`。

## 将结果与 `message send` 结合使用

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## 各渠道的 ID 格式

- WhatsApp: `+15551234567`（私信）、`1234567890-1234567890@g.us`（群组）
- Telegram: `@username` 或数字聊天 ID；群组使用数字 ID
- Slack: `user:U…` 和 `channel:C…`
- Discord: `user:<id>` 和 `channel:<id>`
- Matrix（插件）: `user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams（插件）: `user:<id>` 和 `conversation:<id>`
- Zalo（插件）: 用户 ID（Bot API）
- Zalo Personal / `zalouser`（插件）: 线程 ID（私信/群组），来自 `zca`（`me`、`friend list`、`group list`）

## 自身（“我”）

```bash
openclaw directory self --channel zalouser
```

## 对等方（联系人/用户）

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 群组

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
