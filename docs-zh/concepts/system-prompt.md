---
summary: What the OpenClaw system prompt contains and how it is assembled
read_when:
  - 'Editing system prompt text, tools list, or time/heartbeat sections'
  - Changing workspace bootstrap or skills injection behavior
---
# 系统提示

OpenClaw 为每次代理运行构建自定义系统提示。该提示由 OpenClaw 自主管理，不使用 p-coding-agent 的默认提示。

提示由 OpenClaw 组装，并在每次代理运行时注入。

## 结构

提示经过精心设计，结构紧凑，采用固定板块：

- **工具**：当前工具列表 + 简短描述。
- **技能**（如有）：告知模型如何按需加载技能指令。
- **OpenClaw 自我更新**：说明如何运行 `config.apply` 和 `update.run`。
- **工作区**：工作目录 (`agents.defaults.workspace`)。
- **文档**：指向 OpenClaw 文档的本地路径（仓库或 npm 包），以及何时查阅这些文档。
- **注入的工作区文件**：表明下方包含引导文件。
- **沙箱**（启用时）：指示是否启用沙箱运行、沙箱路径，以及是否可进行提升权限的执行。
- **当前日期与时间**：用户所在时区的本地时间及时间格式。
- **回复标签**：适用于支持提供商的可选回复标签语法。
- **心跳**：心跳提示及确认行为。
- **运行时环境**：主机、操作系统、Node.js 版本、模型、检测到的仓库根目录，以及思维层级（单行）。
- **推理**：当前可见性级别 + /reasoning 切换提示。

## 提示模式

OpenClaw 可以为子代理渲染更小的系统提示。运行时会为每次运行设置一个 `promptMode`（非面向用户的配置）：

- `full`（默认）：包含上述所有板块。
- `minimal`：用于子代理；省略 **技能**、**记忆调用**、**OpenClaw 自我更新**、**模型别名**、**用户身份**、**回复标签**、**消息传递**、**静默回复** 和 **心跳**。工具、工作区、沙箱、已知的当前日期与时间、运行时环境以及注入的上下文仍可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示将标记为 **子代理上下文**，而非 **群聊上下文**。

## 工作区引导注入

引导文件经过裁剪后附加到 **项目上下文** 下，使模型无需显式读取即可看到身份和概要上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅适用于全新工作区）

大文件通过标记进行截断。每文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认：20000）。缺失的文件会注入一条简短的缺失文件标记。

内部钩子可通过 `agent:bootstrap` 拦截此步骤，以修改或替换注入的引导文件（例如用 `SOUL.md` 替换为备选角色）。

要检查每个注入文件的实际贡献量（原始内容与注入内容、截断情况以及工具模式开销），可使用 `/context list` 或 `/context detail`。详情请参见 [上下文](/concepts/context)。

## 时间处理

当已知用户时区时，系统提示包含专门的 **当前日期与时间** 板块。为保持提示缓存稳定，现在仅包含 **时区**，而不包含动态时钟或时间格式。

当代理需要当前时间时，请使用 `session_status`；状态卡片中会包含时间戳行。

可通过以下配置进行设置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

有关完整行为细节，请参见 [日期与时间](/date-time)。

## 技能

当存在符合条件的技能时，OpenClaw 会注入一份精简的 **可用技能列表** (`formatSkillsForPrompt`)，其中包含每项技能的 **文件路径**。提示指示模型使用 `read` 在所列位置（工作区、托管或捆绑）加载 SKILL.md 文件。如果没有符合条件的技能，则省略技能板块。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这在保持基础提示简洁的同时，仍可实现对特定技能的精准调用。

## 文档

当可用时，系统提示包含 **文档** 板块，指向本地 OpenClaw 文档目录（位于仓库工作区中的 `docs/` 或捆绑的 npm 包文档），并注明公开镜像、源代码仓库、社区 Discord 以及 ClawHub (https://clawhub.com)，以方便发现技能。提示指示模型首先查阅本地文档，了解 OpenClaw 的行为、命令、配置或架构，并在可能的情况下自行运行 `openclaw status`（仅在无法访问时才询问用户）。
