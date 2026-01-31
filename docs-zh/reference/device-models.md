---
summary: >-
  How OpenClaw vendors Apple device model identifiers for friendly names in the
  macOS app.
read_when:
  - Updating device model identifier mappings or NOTICE/license files
  - Changing how Instances UI displays device names
---
# 设备型号数据库（友好名称）

macOS 配套应用通过将 Apple 设备型号标识符（例如 `iPad16,6`、`Mac16,6`）映射到人类可读的名称，在“实例”UI中显示友好的 Apple 设备型号名称。

该映射以 JSON 格式作为依赖项提供，位于：

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## 数据来源

我们目前从以下采用 MIT 许可证的仓库引入该映射：

- `kyle-seongwoo-jun/apple-device-identifiers`

为确保构建具有确定性，JSON 文件被固定在特定的上游提交上（记录在 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中）。

## 更新数据库

1. 选择您想要固定的上游提交（分别为 iOS 和 macOS 各一个）。
2. 在 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中更新提交哈希值。
3. 重新下载已固定到这些提交的 JSON 文件：

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. 确保 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` 仍与上游一致（如果上游许可证发生变化，则需替换）。
5. 验证 macOS 应用程序能够干净构建（无警告）：

```bash
swift build --package-path apps/macos
```
