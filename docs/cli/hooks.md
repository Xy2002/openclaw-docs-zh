---
summary: CLI reference for `openclaw hooks` (agent hooks)
read_when:
  - You want to manage agent hooks
  - You want to install or update hooks
---
# `openclaw hooks`

管理代理钩子（用于诸如`/new`、`/reset`和网关启动等命令的事件驱动自动化）。

相关：
- 钩子：[钩子](/hooks)
- 插件钩子：[插件](/plugin#plugin-hooks)

## 列出所有钩子

```bash
openclaw hooks list
```

列出来自工作区、托管目录和捆绑目录的所有已发现钩子。

**选项：**
- `--eligible`：仅显示符合条件的钩子（满足要求）
- `--json`：以 JSON 格式输出
- `-v, --verbose`：显示详细信息，包括缺失的要求

**示例输出：**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new command is issued
  😈 soul-evil ✓ - Swap injected SOUL content during a purge window or by random chance
```

**示例（详细）：**

```bash
openclaw hooks list --verbose
```

显示不符合条件的钩子所缺失的要求。

**示例（JSON）：**

```bash
openclaw hooks list --json
```

返回结构化的 JSON，供程序化使用。

## 获取钩子信息

```bash
openclaw hooks info <name>
```

显示特定钩子的详细信息。

**参数：**
- `<name>`：钩子名称（例如，`session-memory`）

**选项：**
- `--json`：以 JSON 格式输出

**示例：**

```bash
openclaw hooks info session-memory
```

**输出：**

```
💾 session-memory ✓ Ready

Save session context to memory when /new command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/hooks#session-memory
  Events: command:new

Requirements:
  Config: ✓ workspace.dir
```

## 检查钩子是否符合条件

```bash
openclaw hooks check
```

显示钩子符合条件状态的摘要（有多少已就绪，多少未就绪）。

**选项：**
- `--json`：以 JSON 格式输出

**示例输出：**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 启用钩子

```bash
openclaw hooks enable <name>
```

通过将其添加到您的配置中来启用特定钩子(`~/.openclaw/config.json`)。

**注意：** 由插件管理的钩子在`openclaw hooks list`中显示`plugin:<id>`，无法在此处启用或禁用。请改用插件来启用或禁用。

**参数：**
- `<name>`：钩子名称（例如，`session-memory`）

**示例：**

```bash
openclaw hooks enable session-memory
```

**输出：**

```
✓ Enabled hook: 💾 session-memory
```

**作用：**
- 检查钩子是否存在且符合条件
- 更新您配置中的`hooks.internal.entries.<name>.enabled = true`
- 将配置保存到磁盘

**启用后：**
- 重启网关以重新加载钩子（在 macOS 上重启菜单栏应用，或在开发环境中重启网关进程）。

## 禁用钩子

```bash
openclaw hooks disable <name>
```

通过更新您的配置来禁用特定钩子。

**参数：**
- `<name>`：钩子名称（例如，`command-logger`）

**示例：**

```bash
openclaw hooks disable command-logger
```

**输出：**

```
⏸ Disabled hook: 📝 command-logger
```

**禁用后：**
- 重启网关以重新加载钩子

## 安装钩子

```bash
openclaw hooks install <path-or-spec>
```

从本地文件夹/存档或 npm 安装钩子包。

**作用：**
- 将钩子包复制到`~/.openclaw/hooks/<id>`
- 在`hooks.internal.entries.*`中启用已安装的钩子
- 在`hooks.internal.installs`中记录此次安装

**选项：**
- `-l, --link`：链接本地目录而不是复制（将其添加到`hooks.internal.load.extraDirs`）

**支持的存档格式：** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**示例：**

```bash
# Local directory
openclaw hooks install ./my-hook-pack

# Local archive
openclaw hooks install ./my-hook-pack.zip

# NPM package
openclaw hooks install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw hooks install -l ./my-hook-pack
```

## 更新钩子

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

更新已安装的钩子包（仅限 npm 安装）。

**选项：**
- `--all`：更新所有受跟踪的钩子包
- `--dry-run`：显示将要更改的内容而不实际写入

## 捆绑钩子

### session-memory

当您发出`/new`时，会将会话上下文保存到内存中。

**启用：**

```bash
openclaw hooks enable session-memory
```

**输出：** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参见：** [session-memory 文档](/hooks#session-memory)

### command-logger

将所有命令事件记录到集中式审计文件中。

**启用：**

```bash
openclaw hooks enable command-logger
```

**输出：** `~/.openclaw/logs/commands.log`

**查看日志：**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参见：** [command-logger 文档](/hooks#command-logger)

### soul-evil

在清除窗口期间或随机情况下，将注入的`SOUL.md`内容替换为`SOUL_EVIL.md`。

**启用：**

```bash
openclaw hooks enable soul-evil
```

**参见：** [SOUL Evil Hook](/hooks/soul-evil)

### boot-md

在网关启动时（通道启动之后）运行`BOOT.md`。

**事件：** `gateway:startup`

**启用：**

```bash
openclaw hooks enable boot-md
```

**参见：** [boot-md 文档](/hooks#boot-md)
