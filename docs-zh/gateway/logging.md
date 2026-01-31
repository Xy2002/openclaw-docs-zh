---
summary: 'Logging surfaces, file logs, WS log styles, and console formatting'
read_when:
  - Changing logging output or formats
  - Debugging CLI or gateway output
---
# 日志记录

有关面向用户的概览（CLI + 控制 UI + 配置），请参阅 [/logging](/logging)。

OpenClaw 有两个日志“表面”：

- **控制台输出**（您在终端或调试 UI 中看到的内容）。
- **文件日志**（由网关日志记录器写入的 JSON 行）。

## 基于文件的日志记录器

- 默认的滚动日志文件位于 `/tmp/openclaw/` 下（每天一个文件）：`openclaw-YYYY-MM-DD.log`
  - 日期使用网关主机的本地时区。
- 可通过 `~/.openclaw/openclaw.json` 配置日志文件路径和级别：
  - `logging.file`
  - `logging.level`

文件格式为每行一个 JSON 对象。

控制 UI 的“日志”选项卡通过网关尾随此文件（`logs.tail`）。
CLI 也可以做到这一点：

```bash
openclaw logs --follow
```

**详细模式与日志级别**

- **文件日志**完全由 `logging.level` 控制。
- `--verbose` 仅影响 **控制台详细程度**（以及 WS 日志样式）；它 **不会**
  提高文件日志级别。
- 若要在文件日志中捕获仅在详细模式下显示的详细信息，请将 `logging.level` 设置为 `debug` 或
  `trace`。

## 控制台捕获

CLI 捕获 `console.log/info/warn/error/debug/trace` 并将其写入文件日志，
同时仍打印到 stdout/stderr。

您可以通过以下方式独立调整控制台详细程度：

- `logging.consoleLevel`（默认 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 工具摘要脱敏

详细的工具摘要（例如 `🛠️ Exec: ...`）可在敏感标记进入控制台流之前对其进行屏蔽。这仅适用于工具，不会更改文件日志。

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则表达式字符串数组（覆盖默认设置）
  - 使用原始正则表达式字符串（自动 `gi`），或者如果您需要自定义标志，则使用 `/pattern/flags`。
  - 匹配项通过保留前 6 个字符和后 4 个字符进行屏蔽（长度 ≥ 18），否则使用 `***`。
  - 默认设置涵盖常见的键赋值、CLI 标志、JSON 字段、承载头、PEM 块以及流行的令牌前缀。

## 网关 WebSocket 日志

网关以两种模式打印 WebSocket 协议日志：

- **正常模式（无 `--verbose`）**：仅打印“有趣”的 RPC 结果：
  - 错误（`ok=false`）
  - 慢速调用（默认阈值：`>= 50ms`）
  - 解析错误
- **详细模式（`--verbose`）**：打印所有 WS 请求/响应流量。

### WS 日志样式

`openclaw gateway` 支持按网关切换样式：

- `--ws-log auto`（默认）：正常模式经过优化；详细模式使用紧凑输出
- `--ws-log compact`：详细模式时使用紧凑输出（请求/响应成对）
- `--ws-log full`：详细模式时使用逐帧完整输出
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## 控制台格式化（子系统日志记录）

控制台格式化程序 **感知 TTY**，并打印一致且带前缀的行。
子系统日志记录器使输出保持分组且易于扫描。

行为：

- 每行都有 **子系统前缀**（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系统颜色**（每个子系统稳定）加上级别着色
- **当输出为 TTY 或环境看起来像富终端时使用颜色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），尊重 `NO_COLOR`
- **缩短的子系统前缀**：删除开头的 `gateway/` + `channels/`，保留最后 2 个部分（例如 `whatsapp/outbound`）
- **按子系统划分的子日志记录器**（自动前缀 + 结构化字段 `{ subsystem }`）
- **`logRaw()`** 用于 QR/UX 输出（无前缀，无格式）
- **控制台样式**（例如 `pretty | compact | json`）
- **控制台日志级别**与文件日志级别分开（当 `logging.level` 设置为 `debug`/`trace` 时，文件保持完整细节）
- **WhatsApp 消息正文**以 `debug` 记录（使用 `--verbose` 查看它们）

这在保持现有文件日志稳定的同时，使交互式输出易于扫描。
