---
summary: SOUL Evil hook (swap SOUL.md with SOUL_EVIL.md)
read_when:
  - You want to enable or tune the SOUL Evil hook
  - You want a purge window or random-chance persona swap
---
# SOUL 恶意钩子

SOUL 恶意钩子会在清除窗口期间或通过随机概率，将**注入的** `SOUL.md` 内容替换为 `SOUL_EVIL.md`。它**不会**修改磁盘上的文件。

## 工作原理

当 `agent:bootstrap` 运行时，该钩子可以在系统提示被组装之前，在内存中替换 `SOUL.md` 的内容。如果 `SOUL_EVIL.md` 不存在或为空，OpenClaw 会记录一条警告，并保留正常的 `SOUL.md`。

子代理运行在其引导文件中**不包含** `SOUL.md`，因此此钩子对子代理没有任何影响。

## 启用

```bash
openclaw hooks enable soul-evil
```

然后设置配置：

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "soul-evil": {
          "enabled": true,
          "file": "SOUL_EVIL.md",
          "chance": 0.1,
          "purge": { "at": "21:00", "duration": "15m" }
        }
      }
    }
  }
}
```

在代理工作区根目录（与 `SOUL.md` 相邻）中创建 `SOUL_EVIL.md`。

## 选项

- `file`（字符串）：备用 SOUL 文件名（默认：`SOUL_EVIL.md`）
- `chance`（0–1 之间的数字）：每次运行使用 `SOUL_EVIL.md` 的随机概率
- `purge.at`（HH:mm）：每日清除开始时间（24小时制）
- `purge.duration`（持续时间）：清除窗口长度（例如 `30s`、`10m`、`1h`）

**优先级：** 清除窗口优先于随机概率。

**时区：** 如果已设置，则使用 `agents.defaults.userTimezone`；否则使用主机时区。

## 注意事项

- 不会在磁盘上写入或修改任何文件。
- 如果 `SOUL.md` 不在引导列表中，该钩子将不起作用。

## 参见

- [钩子](/hooks)
