---
summary: 'CLI reference for `openclaw plugins` (list, install, enable/disable, doctor)'
read_when:
  - You want to install or manage in-process Gateway plugins
  - You want to debug plugin load failures
---
# `openclaw plugins`

管理网关插件/扩展（在进程中加载）。

相关：
- 插件系统：[插件](/plugin)
- 插件清单 + 模式：[插件清单](/plugins/manifest)
- 安全加固：[安全](/gateway/security)

## 命令

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
```

捆绑的插件随 OpenClaw 一起提供，但默认处于禁用状态。使用 `plugins enable` 来启用它们。

所有插件必须附带一个包含内联 JSON 模式的 `openclaw.plugin.json` 文件（即使为空，也需提供 `configSchema`）。缺少或无效的清单或模式会导致插件无法加载，并使配置验证失败。

### 安装

```bash
openclaw plugins install <path-or-spec>
```

安全提示：将插件安装视为运行代码。建议使用固定版本。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

### 更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update <id> --dry-run
```

更新仅适用于从 npm 安装的插件（在 `plugins.installs` 中跟踪）。
