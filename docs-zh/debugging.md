---
summary: 'Debugging tools: watch mode, raw model streams, and tracing reasoning leakage'
read_when:
  - You need to inspect raw model output for reasoning leakage
  - You want to run the Gateway in watch mode while iterating
  - You need a repeatable debugging workflow
---
# 调试

本页面介绍用于流式输出的调试辅助工具，尤其适用于提供者在常规文本中混入推理内容的情况。

## 运行时调试覆盖

在聊天中使用 `/debug` 可设置仅限运行时的配置覆盖（存储在内存中，而非磁盘上）。默认情况下，`/debug` 处于禁用状态；可通过 `commands.debug: true` 启用。当您需要在不编辑 `openclaw.json` 的情况下切换某些晦涩设置时，此功能非常实用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

执行 `/debug reset` 将清除所有覆盖，并恢复到磁盘上的配置。

## 网关监视模式

为了快速迭代，请在文件监视器下运行网关：

```bash
pnpm gateway:watch --force
```

这相当于：

```bash
tsx watch src/entry.ts gateway --force
```

在 `gateway:watch` 之后添加任何网关 CLI 标志，它们将在每次重启时被传递。

## 开发配置文件 + 开发网关 (--dev)

使用开发配置文件可以隔离状态，并为调试启动一个安全且可丢弃的环境。这里有 **两个** `--dev` 标志：

- **全局 `--dev`（配置文件）：** 在 `~/.openclaw-dev` 下隔离状态，并将网关端口默认设置为 `19001`（派生端口随之调整）。
- **`gateway --dev`：** 指示网关在缺少配置时自动创建默认配置和工作区，并跳过 BOOTSTRAP.md。

推荐流程（开发配置文件 + 开发引导）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果您尚未进行全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

此流程的作用如下：

1) **配置文件隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（浏览器/画布相应调整）

2) **开发引导**（`gateway --dev`）
   - 如果缺少最小配置，则写入最小配置（`gateway.mode=local`，绑定回环）。
   - 将 `agent.workspace` 设置为开发工作区。
   - 设置 `agent.skipBootstrap=true`（无 BOOTSTRAP.md）。
   - 如果工作区文件缺失，则填充以下文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（协议机器人）。
   - 在开发模式中跳过频道提供者（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新启动）：

```bash
pnpm gateway:dev:reset
```

注意：`--dev` 是一个 **全局** 配置文件标志，可能会被某些运行程序吃掉。如果需要明确指定，可使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` 会清除配置、凭据、会话以及开发工作区（使用 `trash`，而非 `rm`），然后重新创建默认的开发设置。

提示：如果已有非开发网关正在运行（launchd/systemd），请先将其停止：

```bash
openclaw gateway stop
```

## 原始流日志记录（OpenClaw）

OpenClaw 可以在任何过滤或格式化之前记录 **原始助手流**。这是查看推理是否以纯文本增量形式到达（或作为单独的思考块到达）的最佳方式。

通过 CLI 启用：

```bash
pnpm gateway:watch --force --raw-stream
```

可选路径覆盖：

```bash
pnpm gateway:watch --force --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效环境变量：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始数据块日志记录（pi-mono）

为了捕获在被解析为块之前的 **原始 OpenAI 兼容数据块**，pi-mono 提供了一个单独的日志记录器：

```bash
PI_RAW_STREAM=1
```

可选路径：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：只有使用 pi-mono 的 `openai-completions` 提供者的进程才会发出此类日志。

## 安全注意事项

- 原始流日志可能包含完整的提示、工具输出和用户数据。
- 请将日志保存在本地，并在调试后删除。
- 如果您共享日志，请先擦除机密信息和 PII。
