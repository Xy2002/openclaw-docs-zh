---
summary: 'OpenClaw macOS release checklist (Sparkle feed, packaging, signing)'
read_when:
  - Cutting or validating a OpenClaw macOS release
  - Updating the Sparkle appcast or feed assets
---
# OpenClaw macOS 版本发布（Sparkle）

此应用现已内置 Sparkle 自动更新功能。发布版本必须使用 Developer ID 进行签名、打包成 ZIP 文件，并通过已签名的 appcast 条目进行发布。

## 先决条件
- 已安装 Developer ID 应用证书（示例：`Developer ID Application: <Developer Name> (<TEAMID>)`）。
- 在环境变量中设置 Sparkle 私钥路径为 `SPARKLE_PRIVATE_KEY_FILE`（指向您的 Sparkle ed25519 私钥；公钥已嵌入 Info.plist）。如果该变量缺失，请参阅 `~/.profile`。
- 如果您希望提供 Gatekeeper 安全的 DMG/ZIP 分发，则需要 Notary 凭证（钥匙串配置文件或 API 密钥）用于 `xcrun notarytool`。
  - 我们使用名为 `openclaw-notary` 的钥匙串配置文件，该配置文件基于 App Store Connect API 密钥环境变量在您的 shell 配置文件中创建：
    - `APP_STORE_CONNECT_API_KEY_P8`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`
    - `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\\n/\n/g' > /tmp/openclaw-notary.p8`
    - `xcrun notarytool store-credentials "openclaw-notary" --key /tmp/openclaw-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
- 已安装 `pnpm` 依赖项（`pnpm install --config.node-linker=hoisted`）。
- Sparkle 工具会通过 SwiftPM 在 `apps/macos/.build/artifacts/sparkle/Sparkle/bin/` 自动获取（`sign_update`, `generate_appcast` 等）。

## 构建与打包
注意事项：
- `APP_BUILD` 映射到 `CFBundleVersion`/`sparkle:version`；请保持其数值且单调递增（不得使用 `-beta`），否则 Sparkle 会将其视为相等。
- 默认使用当前架构（`$(uname -m)`）。对于发布版或通用版构建，请设置 `BUILD_ARCHS="arm64 x86_64"`（或 `BUILD_ARCHS=all`）。
- 使用 `scripts/package-mac-dist.sh` 生成发布工件（ZIP + DMG + Notarization）。使用 `scripts/package-mac-app.sh` 进行本地或开发打包。

```bash
# From repo root; set release IDs so Sparkle feed is enabled.
# APP_BUILD must be numeric + monotonic for Sparkle compare.
BUNDLE_ID=bot.molt.mac \
APP_VERSION=2026.1.27-beta.1 \
APP_BUILD="$(git rev-list --count HEAD)" \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-app.sh

# Zip for distribution (includes resource forks for Sparkle delta support)
ditto -c -k --sequesterRsrc --keepParent dist/OpenClaw.app dist/OpenClaw-2026.1.27-beta.1.zip

# Optional: also build a styled DMG for humans (drag to /Applications)
scripts/create-dmg.sh dist/OpenClaw.app dist/OpenClaw-2026.1.27-beta.1.dmg

# Recommended: build + notarize/staple zip + DMG
# First, create a keychain profile once:
#   xcrun notarytool store-credentials "openclaw-notary" \
#     --apple-id "<apple-id>" --team-id "<team-id>" --password "<app-specific-password>"
NOTARIZE=1 NOTARYTOOL_PROFILE=openclaw-notary \
BUNDLE_ID=bot.molt.mac \
APP_VERSION=2026.1.27-beta.1 \
APP_BUILD="$(git rev-list --count HEAD)" \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# Optional: ship dSYM alongside the release
ditto -c -k --keepParent apps/macos/.build/release/OpenClaw.app.dSYM dist/OpenClaw-2026.1.27-beta.1.dSYM.zip
```

## Appcast 条目
使用发布说明生成器，使 Sparkle 能够渲染格式化的 HTML 说明：
```bash
SPARKLE_PRIVATE_KEY_FILE=/path/to/ed25519-private-key scripts/make_appcast.sh dist/OpenClaw-2026.1.27-beta.1.zip https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml
```
该工具从 `CHANGELOG.md` 生成 HTML 格式的发布说明（通过 [`scripts/changelog-to-html.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/changelog-to-html.sh)），并将其嵌入 appcast 条目中。
在发布时，将更新后的 `appcast.xml` 与发布资产（ZIP + dSYM）一同提交。

## 发布与验证
- 将 `OpenClaw-2026.1.27-beta.1.zip`（以及 `OpenClaw-2026.1.27-beta.1.dSYM.zip`）上传至 GitHub 发布，并标记为 `v2026.1.27-beta.1`。
- 确保原始 appcast URL 与嵌入的 feed 匹配：`https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`。
- 健康检查：
  - `curl -I https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml` 返回 200。
  - `curl -I <enclosure url>` 在上传资产后返回 200。
  - 对先前的公开版本，在“关于”选项卡中运行“检查更新…”，并验证 Sparkle 是否能顺利安装新版本。

完成标准：已签名的应用程序和 appcast 已发布，从旧版本安装的应用能够正常接收更新，且发布资产已附加到 GitHub 发布中。
