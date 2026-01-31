---
summary: Diagnostics flags for targeted debug logs
read_when:
  - You need targeted debug logs without raising global logging levels
  - You need to capture subsystem-specific logs for support
---
# 诊断标志

诊断标志使您能够在不全局启用详细日志记录的情况下，有针对性地启用调试日志。标志需要显式启用，且只有在子系统检查这些标志时才会生效。

## 工作原理

- 标志是字符串（不区分大小写）。
- 您可以通过配置或环境变量覆盖来启用标志。
- 支持通配符：
  - `telegram.*` 匹配 `telegram.http`
  - `*` 会启用所有标志

## 通过配置启用

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

多个标志：

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

更改标志后，请重启网关。

## 环境变量覆盖（一次性设置）

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

禁用所有标志：

```bash
OPENCLAW_DIAGNOSTICS=0
```

## 日志的输出位置

标志会将日志输出到标准诊断日志文件中。默认情况下：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

如果您设置了 `logging.file`，则使用该路径作为日志输出位置。日志采用 JSONL 格式（每行一个 JSON 对象）。根据 `logging.redactSensitive`，日志仍会应用敏感信息屏蔽。

## 提取日志

选择最新的日志文件：

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

筛选 Telegram HTTP 诊断日志：

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

或者在重现问题时实时尾部查看日志：

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

对于远程网关，您还可以使用 `openclaw logs --follow`（参见 [/cli/logs](/cli/logs)）。

## 注意事项

- 如果 `logging.level` 设置得高于 `warn`，这些日志可能会被抑制。默认的 `info` 是合适的。
- 标志可以一直保持启用状态；它们只会影响特定子系统的日志量。
- 使用 [/logging](/logging) 可以更改日志目标、日志级别和敏感信息屏蔽设置。
