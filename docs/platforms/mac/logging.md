---
summary: 'OpenClaw logging: rolling diagnostics file log + unified log privacy flags'
read_when:
  - Capturing macOS logs or investigating private data logging
  - Debugging voice wake/session lifecycle issues
---
# 日志记录（macOS）

## 轮转诊断文件日志（调试面板）
OpenClaw 通过 swift-log 将 macOS 应用的日志路由出去（默认使用统一日志），并在需要持久化捕获时，将本地轮转文件日志写入磁盘。

- 详细程度：**调试面板 → 日志 → 应用日志 → 详细程度**
- 启用：**调试面板 → 日志 → 应用日志 → “写入轮转诊断日志（JSONL）”**
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`（自动轮转；旧文件会附加 `.1`、`.2` 等后缀）**
- 清除：**调试面板 → 日志 → 应用日志 → “清除”**

注意事项：
- 此功能**默认关闭**。仅在主动调试时启用。
- 请将该文件视为敏感信息；未经审查，请勿共享。

## macOS 统一日志中的隐私数据

除非某个子系统选择加入 `privacy -off`，否则统一日志会屏蔽大多数负载。根据 Peter 在 2025 年关于 macOS [日志隐私乱象](https://steipete.me/posts/2025/logging-privacy-shenanigans) 的文章所述，这一行为由位于 `/Library/Preferences/Logging/Subsystems/` 中的 plist 控制，该 plist 以子系统名称为键。只有新生成的日志条目才会应用此标记，因此请在重现问题之前启用它。

## 为 OpenClaw 启用 `bot.molt`
- 先将 plist 写入一个临时文件，然后以 root 权限原子性地安装：

```bash
cat <<'EOF' >/tmp/bot.molt.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/bot.molt.plist /Library/Preferences/Logging/Subsystems/bot.molt.plist
```

- 无需重启；logd 会很快检测到该文件，但只有新生成的日志行才会包含私密负载。
- 使用现有辅助工具查看更丰富的输出，例如 `./scripts/clawlog.sh --category WebChat --last 5m`。

## 调试完成后禁用
- 移除覆盖：`sudo rm /Library/Preferences/Logging/Subsystems/bot.molt.plist`。
- 您也可以选择运行 `sudo log config --reload`，以强制 logd 立即丢弃该覆盖。
- 请注意，此表面可能包含电话号码和消息正文；请仅在您确实需要额外详细信息时才保留该 plist。
