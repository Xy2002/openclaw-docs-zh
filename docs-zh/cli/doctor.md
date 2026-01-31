---
summary: CLI reference for `openclaw doctor` (health checks + guided repairs)
read_when:
  - You have connectivity/auth issues and want guided fixes
  - You updated and want a sanity check
---
# `openclaw doctor`

网关和通道的健康检查与快速修复。

相关：
- 故障排除：[故障排除](/gateway/troubleshooting)
- 安全审计：[安全](/gateway/security)

## 示例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

注意事项：
- 交互式提示（如钥匙串/OAuth 修复）仅在标准输入为 TTY 且未设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）将跳过提示。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并丢弃未知的配置键，同时列出每次移除的键。

## macOS：`launchctl` 环境变量覆盖

如果您之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖您的配置文件，并可能导致持续出现“未授权”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
