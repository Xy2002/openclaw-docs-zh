---
summary: 'Model authentication: OAuth, API keys, and setup-token'
read_when:
  - Debugging model auth or OAuth expiry
  - Documenting authentication or credential storage
---
# 身份验证

OpenClaw 支持为模型提供商使用 OAuth 和 API 密钥。对于 Anthropic 账户，我们建议使用 **API 密钥**。若要访问 Claude 订阅功能，请使用由 `claude setup-token` 创建的长期有效令牌。

有关完整的 OAuth 流程和存储布局，请参阅 [/concepts/oauth](/concepts/oauth)。

## 推荐的 Anthropic 设置（API 密钥）

如果您直接使用 Anthropic，请使用 API 密钥。

1) 在 Anthropic 控制台中创建一个 API 密钥。
2) 将其放置在 **网关主机** 上（即运行 `openclaw gateway` 的机器）。

```bash
export ANTHROPIC_API_KEY="..."
openclaw models status
```

3) 如果网关在 systemd 或 launchd 下运行，建议将密钥放入 `~/.openclaw/.env` 中，以便守护进程可以读取它：

```bash
cat >> ~/.openclaw/.env <<'EOF'
ANTHROPIC_API_KEY=...
EOF
```

然后重启守护进程（或重启您的网关进程），并再次检查：

```bash
openclaw models status
openclaw doctor
```

如果您不想自行管理环境变量，入门向导可以为您存储用于守护进程的 API 密钥：`openclaw onboard`。

有关环境变量继承的详细信息，请参阅 [帮助](/help)（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）。

## Anthropic：setup-token（订阅身份验证）

对于 Anthropic，推荐使用 **API 密钥**。如果您使用的是 Claude 订阅，则也支持 setup-token 流程。请在 **网关主机** 上运行以下命令：

```bash
claude setup-token
```

然后将其粘贴到 OpenClaw 中：

```bash
openclaw models auth setup-token --provider anthropic
```

如果该令牌是在另一台机器上创建的，您可以手动粘贴：

```bash
openclaw models auth paste-token --provider anthropic
```

如果您看到类似以下的 Anthropic 错误：

```
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

请改用 Anthropic API 密钥。

手动输入令牌（适用于任何提供商；写入 `auth-profiles.json` 并更新配置）：

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

适合自动化的检查（当过期或缺失时退出代码为 `1`，即将过期时退出代码为 `2`）：

```bash
openclaw models status --check
```

可选的操作脚本（systemd/Termux）在此处记录：[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` 需要交互式 TTY。

## 检查模型身份验证状态

```bash
openclaw models status
openclaw doctor
```

## 控制使用的凭据

### 按会话（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 可以为当前会话固定特定提供商的凭据（示例配置文件 ID：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）可获得紧凑的选择器；使用 `/model status` 可获得完整视图（包括候选凭据、下一个身份验证配置文件，以及已配置时的提供商端点详情）。

### 按代理（CLI 覆盖）

为某个代理设置显式的身份验证配置文件顺序覆盖（存储在该代理的 `auth-profiles.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 可以指定特定代理；省略则使用已配置的默认代理。

## 故障排除

### “未找到凭据”

如果 Anthropic 令牌配置文件丢失，请在 **网关主机** 上运行 `claude setup-token`，然后再次检查：

```bash
openclaw models status
```

### 令牌即将过期或已过期

运行 `openclaw models status` 以确认哪个配置文件即将过期。如果该配置文件丢失，请重新运行 `claude setup-token`，并再次粘贴令牌。

## 必需条件

- Claude Max 或 Pro 订阅（用于 `claude setup-token`）
- 已安装 Claude Code CLI（`claude` 命令可用）
