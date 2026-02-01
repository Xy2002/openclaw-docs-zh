---
summary: >-
  CLI reference for `openclaw models` (status/list/set/scan, aliases, fallbacks,
  auth)
read_when:
  - You want to change default models or view provider auth status
  - You want to scan available models/providers and debug auth profiles
---
# `openclaw models`

模型发现、扫描和配置（默认模型、回退、身份验证配置文件）。

相关：
- 提供商 + 模型：[模型](/providers/models)
- 提供商身份验证设置：[入门](/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 显示解析后的默认/回退配置以及身份验证概览。当提供商标记快照可用时，OAuth/标记状态部分会包含提供商标记头信息。
添加 `--probe` 可针对每个已配置的提供商配置文件运行实时身份验证探测。探测是真实请求（可能会消耗标记并触发速率限制）。
使用 `--agent <id>` 可检查已配置代理的模型/身份验证状态。如果未指定，则该命令会使用 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`（如果已设置），否则将使用已配置的默认代理。

注意事项：
- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- 模型引用通过以**第一个** `/` 为分隔符进行解析。如果模型 ID 包含 `/`（OpenRouter 风格），则需包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果您省略提供商，OpenClaw 会将输入视为别名或**默认提供商**的模型（仅在模型 ID 中没有 `/` 时有效）。

### `models status`
选项：
- `--json`
- `--plain`
- `--check`（退出代码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置的身份验证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（重复或逗号分隔的配置文件 ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的代理 ID；覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 身份验证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token
openclaw models auth paste-token
```
`models auth login` 运行提供商插件的身份验证流程（OAuth/API 密钥）。使用 `openclaw plugins list` 可查看已安装的提供商。

注意事项：
- `setup-token` 会提示输入设置令牌值（可在任何机器上使用 `claude setup-token` 生成）。
- `paste-token` 接受在其他地方或通过自动化生成的令牌字符串。
