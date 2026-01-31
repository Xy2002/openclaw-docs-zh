---
summary: Monitor OAuth expiry for model providers
read_when:
  - Setting up auth expiry monitoring or alerts
  - Automating Claude Code / Codex OAuth refresh checks
---
# 身份验证监控

OpenClaw 通过 `openclaw models status` 公开 OAuth 过期状态的健康信息。您可以利用此信息进行自动化和告警；脚本是针对电话工作流的可选扩展。

## 推荐：CLI 检查（便携性强）

```bash
openclaw models status --check
```

退出码：
- `0`：正常
- `1`：凭据已过期或缺失
- `2`：即将过期（在 24 小时内）

此方法适用于 cron/systemd，无需额外脚本。

## 可选脚本（运维/电话工作流）

这些脚本位于 `scripts/` 下，是**可选**的。它们假定您拥有网关主机的 SSH 访问权限，并针对 systemd + Termux 进行了优化。

- `scripts/claude-auth-status.sh` 现在使用 `openclaw models status --json` 作为事实来源（如果 CLI 不可用，则回退到直接读取文件），因此请将 `openclaw` 配置在 `PATH` 上以用于定时器。
- `scripts/auth-monitor.sh`：cron/systemd 定时器目标；发送告警（通过 ntfy 或电话）。
- `scripts/systemd/openclaw-auth-monitor.{service,timer}`：systemd 用户定时器。
- `scripts/claude-auth-status.sh`：Claude Code + OpenClaw 身份验证检查器（完整/JSON/简洁）。
- `scripts/mobile-reauth.sh`：通过 SSH 引导的重新身份验证流程。
- `scripts/termux-quick-auth.sh`：一键小部件显示状态并打开身份验证 URL。
- `scripts/termux-auth-widget.sh`：完整的引导式小部件流程。
- `scripts/termux-sync-widget.sh`：同步 Claude Code 凭据至 OpenClaw。

如果您不需要电话自动化或 systemd 定时器，可以跳过这些脚本。
