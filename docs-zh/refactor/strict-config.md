---
summary: Strict config validation + doctor-only migrations
read_when:
  - Designing or implementing config validation behavior
  - Working on config migrations or doctor workflows
  - Handling plugin config schemas or plugin load gating
---
# 严格配置验证（仅通过 Doctor 运行迁移）

## 目标
- **在任何层级（根级别和嵌套级别）都拒绝未知的配置键**。
- **拒绝没有模式的插件配置**；不加载此类插件。
- **移除加载时的旧版自动迁移逻辑**；迁移只能通过 Doctor 执行。
- **在启动时自动运行 Doctor（干运行）**；如果配置无效，则阻止执行非诊断性命令。

## 非目标
- 加载时的向后兼容性（旧版键不会自动迁移）。
- 对未识别键静默丢弃。

## 严格验证规则
- 配置在每一层级都必须与模式完全匹配。
- 未知键被视为验证错误（无论在根级别还是嵌套级别，均不支持透传）。
- `plugins.entries.<id>.config` 必须由插件的模式进行验证。
  - 如果插件缺少模式，**拒绝加载该插件**并显示明确的错误信息。
- 未知的 `channels.<id>` 键被视为错误，除非插件清单声明了该通道 ID。
- 所有插件都必须提供插件清单 (`openclaw.plugin.json`)。

## 插件模式强制执行
- 每个插件为其配置提供严格的 JSON 模式，并内联在插件清单中。
- 插件加载流程：
  1) 解析插件清单和模式 (`openclaw.plugin.json`)。
  2) 根据模式验证配置。
  3) 如果缺少模式或配置无效：阻止加载插件，并记录错误。
- 错误信息包括：
  - 插件 ID
  - 原因（缺少模式或配置无效）
  - 验证失败的路径
- 已禁用的插件会保留其配置，但 Doctor 和日志会输出警告。

## Doctor 流程
- 每次加载配置时都会运行 Doctor（默认为干运行）。
- 如果配置无效：
  - 输出摘要和可操作的错误信息。
  - 提供指导：`openclaw doctor --fix`。
- `openclaw doctor --fix`：
  - 应用迁移。
  - 移除未知键。
  - 写入更新后的配置。

## 命令限制（当配置无效时）
允许的（仅限诊断性命令）：
- `openclaw doctor`
- `openclaw logs`
- `openclaw health`
- `openclaw help`
- `openclaw status`
- `openclaw gateway status`

所有其他命令必须硬性失败，并显示：“配置无效。请运行 `openclaw doctor --fix`。”

## 错误 UX 格式
- 单一摘要标题。
- 分组部分：
  - 未知键（完整路径）
  - 需要迁移的旧版键
  - 插件加载失败（插件 ID + 原因 + 路径）

## 实现关键点
- `src/config/zod-schema.ts`：移除根级别的透传；所有对象均采用严格模式。
- `src/config/zod-schema.providers.ts`：确保通道模式严格。
- `src/config/validation.ts`：遇到未知键即报错；不应用旧版迁移。
- `src/config/io.ts`：移除旧版自动迁移；始终运行 Doctor 干运行。
- `src/config/legacy*.ts`：将使用权限转移至 Doctor。
- `src/plugins/*`：添加模式注册表和权限控制。
- CLI 命令权限控制在 `src/cli` 中实现。

## 测试
- 未知键拒绝（根级别和嵌套级别）。
- 插件缺少模式 → 插件加载被阻止，并显示明确的错误信息。
- 配置无效 → 启动时除诊断性命令外，其他命令均被阻止。
- Doctor 自动执行干运行；`doctor --fix` 写入已修正的配置。
