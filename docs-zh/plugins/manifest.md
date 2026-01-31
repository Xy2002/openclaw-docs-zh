---
summary: Plugin manifest + JSON schema requirements (strict config validation)
read_when:
  - You are building a OpenClaw plugin
  - You need to ship a plugin config schema or debug plugin validation errors
---
# 插件清单（openclaw.plugin.json）

每个插件**必须**在**插件根目录**中提供一个`openclaw.plugin.json`文件。OpenClaw 使用此清单来验证配置，**无需执行插件代码**。缺失或无效的清单被视为插件错误，并会阻止配置验证。

请参阅完整的插件系统指南：[插件](/plugin)。

## 必需字段

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

必需键：
- `id`（字符串）：规范的插件 ID。
- `configSchema`（对象）：用于插件配置的 JSON Schema（内联定义）。

可选键：
- `kind`（字符串）：插件类型（例如，`"memory"`）。
- `channels`（数组）：此插件注册的频道 ID（例如，`["matrix"]`）。
- `providers`（数组）：此插件注册的提供商 ID。
- `skills`（数组）：要加载的技能目录（相对于插件根目录）。
- `name`（字符串）：插件的显示名称。
- `description`（字符串）：插件简短摘要。
- `uiHints`（对象）：用于 UI 渲染的配置字段标签、占位符和敏感性标志。
- `version`（字符串）：插件版本（仅供参考）。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 Schema 也是可以接受的（例如，`{ "type": "object", "additionalProperties": false }`）。
- Schema 在读取或写入配置时进行验证，而不是在运行时验证。

## 验证行为

- 未知的`channels.*`键被视为**错误**，除非该频道 ID 已在某个插件清单中声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现**的插件 ID。未知 ID 被视为**错误**。
- 如果已安装插件但其清单或 Schema 损坏或缺失，则验证失败，Doctor 会报告插件错误。
- 如果插件配置存在但插件被**禁用**，配置仍会被保留，并且会在 Doctor 和日志中显示一条**警告**。

## 注意事项

- 清单对**所有插件**都是**必需的**，包括从本地文件系统加载的插件。
- 运行时仍会单独加载插件模块；清单仅用于发现和验证。
- 如果您的插件依赖原生模块，请记录构建步骤以及任何包管理器白名单要求（例如，pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。
