---
summary: CLI reference for `openclaw config` (get/set/unset config values)
read_when:
  - You want to read or edit config non-interactively
---
# `openclaw config`

配置助手：按路径获取/设置/取消设置值。不带子命令运行以打开配置向导（与 `openclaw configure` 相同）。

## 示例

```bash
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config unset tools.web.search.apiKey
```

## 路径

路径使用点号或方括号表示法：

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用代理列表索引来定位特定代理：

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

在可能的情况下，值会解析为 JSON5；否则被视为字符串。使用 `--json` 来强制要求 JSON5 解析。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --json
openclaw config set channels.whatsapp.groups '["*"]' --json
```

编辑后重启网关。
