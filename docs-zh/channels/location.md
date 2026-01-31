---
summary: Inbound channel location parsing (Telegram + WhatsApp) and context fields
read_when:
  - Adding or modifying channel location parsing
  - Using location context fields in agent prompts or tools
---
# 频道位置解析

OpenClaw会将聊天频道中的共享位置归一化为：
- 附加到入站正文的人类可读文本，以及
- 自动回复上下文负载中的结构化字段。

当前支持的渠道包括：
- **Telegram**（位置贴纸 + 场所 + 实时位置）
- **WhatsApp**（locationMessage + liveLocationMessage）
- **Matrix**（`m.location`，配合 `geo_uri`）

## 文本格式化
位置以友好的行形式呈现，不带括号：

- 贴纸位置：
  - `📍 48.858844, 2.294351 ±12m`
- 命名地点：
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- 实时共享位置：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果频道包含标题/评论，它将被附加在下一行：
```
📍 48.858844, 2.294351 ±12m
Meet here
```

## 上下文字段
当存在位置信息时，以下字段会被添加到 `ctx` 中：
- `LocationLat`（数字）
- `LocationLon`（数字）
- `LocationAccuracy`（数字，单位：米；可选）
- `LocationName`（字符串；可选）
- `LocationAddress`（字符串；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（布尔值）

## 渠道说明
- **Telegram**：场所映射到 `LocationName/LocationAddress`；实时位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 作为标题行附加。
- **Matrix**：`geo_uri` 被解析为贴纸位置；高度被忽略，且 `LocationIsLive` 始终为假。
