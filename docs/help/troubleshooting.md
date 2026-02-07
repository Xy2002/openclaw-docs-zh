---
summary: 'Troubleshooting hub: symptoms → checks → fixes'
read_when:
  - You see an error and want the fix path
  - The installer says “success” but the CLI doesn’t work
---
# 故障排除

## 前60秒

按顺序运行以下命令：

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw logs --follow
openclaw doctor
```

如果网关可访问，则执行深度探测：

```bash
openclaw status --deep
```

## 常见“出问题了”情形

### `openclaw: command not found`

这几乎总是与 Node/npm 路径有关的问题。请从这里开始：

- [安装（Node/npm PATH 是否正常）](/install#nodejs--npm-path-sanity)

### 安装程序失败（或需要完整日志）

以详细模式重新运行安装程序，以查看完整的调用栈和 npm 输出：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --verbose
```

对于测试版安装：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --beta --verbose
```

您也可以设置 `OPENCLAW_VERBOSE=1`，而不是使用该标志。

### 网关显示“未授权”，无法连接，或不断重新连接

- [网关故障排除](/gateway/troubleshooting)
- [网关身份验证](/gateway/authentication)

### 在 HTTP 上控制 UI 失败（需要设备身份）

- [网关故障排除](/gateway/troubleshooting)
- [控制UI](/web/control-ui#insecure-http)

### `docs.openclaw.ai` 显示 SSL 错误（康卡斯特/康卡斯特家庭宽带）

某些Comcast/Xfinity连接会通过Xfinity高级安全功能阻止`docs.openclaw.ai`。请禁用高级安全功能，或将`docs.openclaw.ai`添加到白名单，然后重试。

- Xfinity 高级安全帮助：https://www.xfinity.com/support/articles/using-xfinity-xfi-advanced-security
- 快速检查：尝试使用移动热点或 VPN，以确认问题是否由 ISP 级别的过滤引起。

### 服务显示正在运行，但 RPC 探测失败

- [网关故障排除](/gateway/troubleshooting)
- [后台进程/服务](/gateway/background-process)

### 模型/认证失败（速率限制、计费、“所有模型均失败”）

- [模型](/cli/models)
- [OAuth / 认证概念](/concepts/oauth)

### `/model` 显示 `model not allowed`

这通常意味着 `agents.defaults.models` 已配置为白名单。当白名单不为空时，只能选择这些提供商/模型密钥。

- 检查白名单： `openclaw config get agents.defaults.models`
- 添加您想要的模型（或清空白名单），然后重试 `/model`
- 使用 `/models` 浏览允许的提供商/模型

提交问题时

粘贴一份安全报告：

```bash
openclaw status --all
```

如果可能，请附上来自 `openclaw logs --follow` 的相关日志尾部。
