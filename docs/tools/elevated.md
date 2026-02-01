---
summary: Elevated exec mode and /elevated directives
read_when:
  - 'Adjusting elevated mode defaults, allowlists, or slash command behavior'
---
# 提升模式（/elevated 指令）

## 功能说明
- `/elevated on` 在网关主机上运行，并保留 exec 批准（与 `/elevated ask` 相同）。
- __ INLINE_CODE_2__ 在网关主机上运行 **且** 自动批准 exec（跳过 exec 批准）。
- `/elevated ask` 在网关主机上运行，但保留 exec 批准（与 `/elevated on` 相同）。
- `on`/`ask` 不强制 `exec.security=full`；配置的安全性/询问策略仍然适用。
- 仅在代理处于 **沙箱环境** 时才会改变行为（否则 exec 已在主机上运行）。
- 指令形式：`/elevated on|off|ask|full`、`/elev on|off|ask|full`。
- 只有 `on|off|ask|full` 被接受；其他指令会返回提示，且不会改变状态。

## 控制内容（及不控制的内容）
- **可用性闸门**：`tools.elevated` 是全局基线。`agents.list[].tools.elevated` 可进一步按代理限制提升权限（两者都必须允许）。
- **会话级状态**：`/elevated on|off|ask|full` 设置当前会话密钥的提升级别。
- **内联指令**：消息中的 `/elevated on|ask|full` 仅适用于该消息。
- **群组**：在群聊中，提升指令仅在代理被提及时才生效。绕过提及要求的纯命令消息被视为已提及。
- **主机执行**：提升会强制 `exec` 应用于网关主机；`full` 还会设置 `security=full`。
- **批准**：`full` 跳过 exec 批准；`on`/`ask` 在白名单/询问规则要求时仍会遵守批准。
- **未沙箱化的代理**：对位置无影响；仅影响闸门控制、日志记录和状态。
- **工具策略仍然适用**：如果 `exec` 被工具策略拒绝，提升权限将无法使用。
- **与 `/exec` 分离**：`/exec` 调整授权发件人的会话默认设置，且无需提升权限。

## 解析顺序
1. 消息中的内联指令（仅适用于该消息）。
2. 会话覆盖（通过发送仅包含指令的消息来设置）。
3. 全局默认值（配置中的 `agents.defaults.elevatedDefault`)。

## 设置会话默认值
- 发送一条 **仅包含** 指令的消息（允许空格），例如 `/elevated full`。
- 系统会发送确认回复（`Elevated mode set to full...` / `Elevated mode disabled.`)。
- 如果提升访问被禁用，或发件人不在批准的白名单中，指令会以可操作的错误回复，并且不会改变会话状态。
- 发送 `/elevated`（或 `/elevated:`)且不带参数，即可查看当前的提升级别。

## 可用性 + 白名单
- 功能闸门：`tools.elevated.enabled`（即使代码支持此功能，也可通过配置将其关闭）。
- 发件人白名单：`tools.elevated.allowFrom` 支持按提供商划分的白名单（如 `discord`、`whatsapp`)。
- 按代理的闸门：`agents.list[].tools.elevated.enabled`（可选；只能进一步限制）。
- 按代理的白名单：`agents.list[].tools.elevated.allowFrom`（可选；一旦设置，发件人必须同时符合 **全局 + 按代理** 的白名单）。
- Discord 备用方案：如果 `tools.elevated.allowFrom.discord` 被省略，则使用 `channels.discord.dm.allowFrom` 列表作为备用。设置 `tools.elevated.allowFrom.discord`（甚至 `[]`)可覆盖此设置。按代理的白名单 **不** 使用备用列表。
- 所有闸门必须通过；否则提升权限将被视为不可用。

## 日志记录 + 状态
- 提升模式下的 exec 调用以信息级别记录。
- 会话状态包括提升模式（如 `elevated=ask`、`elevated=full`)。
