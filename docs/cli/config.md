---
summary: CLI reference for `openclaw config` (get/set/unset config values)
read_when:
  - You want to read or edit config non-interactively
---
# `openclaw config`

配置助手：按路径获取、设置或取消设置值。不带子命令运行可打开配置向导（与 `openclaw configure` 相同）。

## 示例

```bash
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config unset tools.web.search.apiKey
```

## 值

值在可能的情况下会解析为 JSON5；否则被视为字符串。使用 `--json` 来强制要求 JSON5 解析。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --json
openclaw config set channels.whatsapp.groups '["*"]' --json
```

编辑后重启网关。
