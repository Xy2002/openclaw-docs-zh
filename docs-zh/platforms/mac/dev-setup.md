---
summary: Setup guide for developers working on the OpenClaw macOS app
read_when:
  - Setting up the macOS development environment
---
# macOS 开发者设置

本指南介绍了从源代码构建并运行 OpenClaw macOS 应用程序所需的步骤。

## 先决条件

在构建应用程序之前，请确保已安装以下内容：

1. **Xcode 26.2+**：Swift 开发所必需。
2. **Node.js 22+ 和 pnpm**：网关、CLI 和打包脚本所必需。

## 1. 安装依赖项

安装项目范围内的依赖项：

```bash
pnpm install
```

## 2. 构建并打包应用程序

要构建 macOS 应用程序并将其打包为 `dist/OpenClaw.app`，请运行：

```bash
./scripts/package-mac-app.sh
```

如果您没有 Apple 开发者 ID 证书，脚本将自动使用“临时签名”（`-`）。

有关开发运行模式、签名标志和团队 ID 排障的信息，请参阅 macOS 应用程序的 README：
https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md

> **注意**：临时签名的应用可能会触发安全提示。如果应用在启动时立即因“Abort trap 6”而崩溃，请参阅 [故障排除](#troubleshooting)部分。

## 3. 安装 CLI

macOS 应用程序期望全局安装 `openclaw` CLI 来管理后台任务。

**推荐的安装方法：**
1. 打开 OpenClaw 应用程序。
2. 转到“通用”设置选项卡。
3. 点击“安装 CLI”。

或者，您也可以手动安装：
```bash
npm install -g openclaw@<version>
```

## 故障排除

### 构建失败：工具链或 SDK 不匹配
macOS 应用程序的构建需要最新的 macOS SDK 和 Swift 6.2 工具链。

**系统依赖项（必需）：**
- **软件更新中提供的最新 macOS 版本**（Xcode 26.2 SDK 所需）
- **Xcode 26.2**（Swift 6.2 工具链）

**检查项：**
```bash
xcodebuild -version
xcrun swift --version
```

如果版本不匹配，请更新 macOS/Xcode 并重新运行构建。

### 在授予权限时应用崩溃
如果您尝试允许“语音识别”或“麦克风”访问时应用崩溃，可能是 TCC 缓存损坏或签名不匹配所致。

**修复方法：**
1. 重置 TCC 权限：
   ```bash
   tccutil reset All bot.molt.mac.debug
   ```
2. 如果上述方法无效，请暂时在 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 中更改 `BUNDLE_ID`，以强制 macOS 采用“全新状态”。

### 网关无限期显示“正在启动...”
如果网关状态一直显示“正在启动...”，请检查是否有僵尸进程占用了端口：

```bash
openclaw gateway status
openclaw gateway stop

# If you’re not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```
如果某个手动运行的进程占用了端口，请停止该进程（按 Ctrl+C）。作为最后手段，可终止您在上述步骤中找到的 PID。
