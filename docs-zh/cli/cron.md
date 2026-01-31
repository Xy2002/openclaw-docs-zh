---
summary: CLI reference for `openclaw cron` (schedule and run background jobs)
read_when:
  - You want scheduled jobs and wakeups
  - You’re debugging cron execution and logs
---
# `openclaw cron`

管理网关调度器的 cron 作业。

相关：
- Cron 作业：[Cron 作业](/automation/cron-jobs)

提示：运行 `openclaw cron --help` 以查看完整的命令界面。

## 常见编辑

在不更改消息的情况下更新投放设置：

```bash
openclaw cron edit <job-id> --deliver --channel telegram --to "123456789"
```

为孤立作业禁用投放：

```bash
openclaw cron edit <job-id> --no-deliver
```
