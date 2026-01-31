---
summary: Background exec execution and process management
read_when:
  - Adding or modifying background exec behavior
  - Debugging long-running exec tasks
---
# 后台执行与进程工具

OpenClaw通过`exec`工具运行Shell命令，并将长时间运行的任务保留在内存中。`process`工具负责管理这些后台会话。

## exec工具

关键参数：
- `command`（必填）
- `yieldMs`（默认10000）：在此延迟后自动转入后台
- `background`（布尔值）：立即转入后台
- `timeout`（秒，默认1800）：在此超时后终止进程
- `elevated`（布尔值）：如果启用了提升模式或允许提升模式，则在主机上运行
- 需要真正的TTY？设置`pty: true`。
- `workdir`、`env`

行为：
- 前台运行会直接返回输出。
- 当被转入后台（显式或因超时）时，工具会返回`status: "running"` + `sessionId`以及一段简短的尾部输出。
- 输出会一直保留在内存中，直到会话被轮询或清除。
- 如果`process`工具被禁止，则`exec`会同步运行，并忽略`yieldMs`/`background`。

## 子进程桥接

当在exec/process工具之外启动长时间运行的子进程时（例如CLI重新启动或网关助手），应附加子进程桥接助手，以便在退出或发生错误时转发终止信号并分离监听器。这可避免systemd中的孤儿进程，并确保跨平台的关闭行为一致。

环境覆盖：
- `PI_BASH_YIELD_MS`：默认让步时间（毫秒）
- `PI_BASH_MAX_OUTPUT_CHARS`：内存中输出上限（字符数）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每个流的待处理stdout/stderr上限（字符数）
- `PI_BASH_JOB_TTL_MS`：已完成会话的TTL（毫秒，限制在1分钟至3小时之间）

配置（首选）：
- `tools.exec.backgroundMs`（默认10000）
- `tools.exec.timeoutSec`（默认1800）
- `tools.exec.cleanupMs`（默认1800000）
- `tools.exec.notifyOnExit`（默认true）：当后台exec退出时，将系统事件加入队列并请求心跳。

## process工具

操作：
- `list`：正在运行和已完成的会话
- `poll`：为会话提取新输出（同时报告退出状态）
- `log`：读取聚合输出（支持`offset` + `limit`）
- `write`：发送stdin（`data`，可选`eof`）
- `kill`：终止后台会话
- `clear`：从内存中移除已完成会话
- `remove`：如果正在运行则终止，否则如果已完成则清除

注意事项：
- 只有已转入后台的会话才会被列出并保留在内存中。
- 会话会在进程重启时丢失（无磁盘持久化）。
- 会话日志仅在您运行`process poll/log`且工具结果被记录时才会保存到聊天历史中。
- `process`按代理范围划分；它仅能看到由该代理启动的会话。
- `process list`包含一个派生的`name`（命令动词+目标），用于快速扫描。
- `process log`使用基于行的`offset`/`limit`（省略`offset`以获取最后N行）。

## 示例

运行一项长期任务并在稍后轮询：
```json
{"tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000}
```
```json
{"tool": "process", "action": "poll", "sessionId": "<id>"}
```

立即在后台启动：
```json
{"tool": "exec", "command": "npm run build", "background": true}
```

发送stdin：
```json
{"tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n"}
```
