---
summary: macOS permission persistence (TCC) and signing requirements
read_when:
  - Debugging missing or stuck macOS permission prompts
  - Packaging or signing the macOS app
  - Changing bundle IDs or app install paths
---
# macOS 权限（TCC）

macOS 权限授予非常脆弱。TCC 将权限授予与应用的代码签名、捆绑包标识符以及磁盘路径相关联。如果其中任何一项发生更改，macOS 会将该应用视为新应用，并可能丢弃或隐藏权限提示。

## 稳定权限的要求
- 相同路径：从固定位置运行应用（对于 OpenClaw，请使用 `dist/OpenClaw.app`）。
- 相同捆绑包标识符：更改捆绑包 ID 会创建新的权限身份。
- 已签名的应用：未签名或使用临时签名构建的应用无法持久保留权限。
- 签名一致：使用真实的 Apple 开发者证书或开发者 ID 证书，以确保在重新构建时签名保持稳定。

临时签名会在每次构建时生成一个新的身份。macOS 会忘记之前的权限授予，并且在清除过时条目之前，权限提示可能会完全消失。

## 当权限提示消失时的恢复检查清单
1. 退出应用。
2. 在“系统设置 -> 隐私与安全性”中移除该应用条目。
3. 从相同路径重新启动应用并重新授予权限。
4. 如果提示仍未出现，使用 `tccutil` 重置 TCC 条目，然后再次尝试。
5. 某些权限只有在完整重启 macOS 后才会重新显示。

重置示例（请根据需要替换捆绑包 ID）：

```bash
sudo tccutil reset Accessibility bot.molt.mac
sudo tccutil reset ScreenCapture bot.molt.mac
sudo tccutil reset AppleEvents
```

如果您正在测试权限，请务必使用真实证书进行签名。临时签名构建仅适用于无需考虑权限的快速本地运行场景。
