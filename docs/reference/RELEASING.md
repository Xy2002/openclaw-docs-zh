---
summary: Step-by-step release checklist for npm + macOS app
read_when:
  - Cutting a new npm release
  - Cutting a new macOS app release
  - Verifying metadata before publishing
---
# 发布检查清单（npm + macOS）

从仓库根目录使用 `pnpm`（Node 22+）。在打标签/发布之前，保持工作树整洁。

## 操作员触发
当操作员发出“发布”指令时，立即执行以下预检步骤（除非遇到阻碍，否则无需额外提问）：
- 阅读本文档和 `docs/platforms/mac/release.md`。
- 从 `~/.profile` 加载环境变量，并确认 `SPARKLE_PRIVATE_KEY_FILE` 和 App Store Connect 变量已设置（SPARKLE_PRIVATE_KEY_FILE 应位于 `~/.profile` 中）。
- 如有需要，使用 `~/Library/CloudStorage/Dropbox/Backup/Sparkle` 中的 Sparkle 密钥。

1) **版本与元数据**
- [ ] 提升 `package.json` 版本（例如，`2026.1.29`）。
- [ ] 运行 `pnpm plugins:sync` 以同步扩展包版本和变更日志。
- [ ] 更新 CLI/版本字符串：[`src/cli/program.ts`](https://github.com/openclaw/openclaw/blob/main/src/cli/program.ts) 以及 Baileys 用户代理在 [`src/provider-web.ts`](https://github.com/openclaw/openclaw/blob/main/src/provider-web.ts) 中的定义。
- [ ] 确认软件包元数据（名称、描述、仓库、关键词、许可证）以及 `bin` 映射指向 [`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)，用于 `openclaw`。
- [ ] 如果依赖项发生变化，运行 `pnpm install`，以确保 `pnpm-lock.yaml` 最新。

2) **构建与工件**
- [ ] 如果 A2UI 输入发生更改，运行 `pnpm canvas:a2ui:bundle` 并提交任何更新的 [`src/canvas-host/a2ui/a2ui.bundle.js`](https://github.com/openclaw/openclaw/blob/main/src/canvas-host/a2ui/a2ui.bundle.js)。
- [ ] `pnpm run build`（重新生成 `dist/`）。
- [ ] 验证 npm 包 `files` 是否包含所有必需的 `dist/*` 文件夹（尤其是 `dist/node-host/**` 和 `dist/acp/**`，用于无头 Node 和 ACP CLI）。
- [ ] 确认 `dist/build-info.json` 存在，并包含预期的 `commit` 哈希值（CLI 标语在 npm 安装中使用此哈希值）。
- [ ] 可选：在构建后运行 `npm pack --pack-destination /tmp`；检查 tarball 内容并将其保存以备 GitHub 发布之用（**不要**提交到版本库）。

3) **变更日志与文档**
- [ ] 使用面向用户的重要更新更新 `CHANGELOG.md`（如果文件不存在则创建）；条目应按版本号严格降序排列。
- [ ] 确保 README 中的示例和标志与当前 CLI 行为一致（特别是新增命令或选项）。

4) **验证**
- [ ] `pnpm lint`
- [ ] `pnpm test`（或 `pnpm test:coverage`，如果你需要覆盖率输出）
- [ ] `pnpm run build`（测试后的最后一次 sanity 检查）
- [ ] `pnpm release:check`（验证 npm 打包内容）
- [ ] `OPENCLAW_INSTALL_SMOKE_SKIP_NONROOT=1 pnpm test:install:smoke`（Docker 安装烟雾测试，快速路径；发布前必需）
  - 如果最近一次 npm 发布已知存在问题，为 preinstall 步骤设置 `OPENCLAW_INSTALL_SMOKE_PREVIOUS=<last-good-version>` 或 `OPENCLAW_INSTALL_SMOKE_SKIP_PREVIOUS=1`。
- [ ] （可选）完整安装程序烟雾测试（增加非 root + CLI 覆盖率）：`pnpm test:install:smoke`
- [ ] （可选）安装程序端到端测试（Docker，运行 `curl -fsSL https://openclaw.bot/install.sh | bash`，完成注册流程，然后执行实际工具调用）：
  - `pnpm test:install:e2e:openai`（需要 `OPENAI_API_KEY`）
  - `pnpm test:install:e2e:anthropic`（需要 `ANTHROPIC_API_KEY`）
  - `pnpm test:install:e2e`（需要两个密钥；同时运行两个提供商）
- [ ] （可选）如果你的更改影响发送/接收路径，则对 Web 网关进行抽查。

5) **macOS 应用程序（Sparkle）**
- [ ] 构建并签名 macOS 应用程序，然后将其压缩以供分发。
- [ ] 生成 Sparkle appcast（通过 [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh) 生成 HTML 说明），并更新 `appcast.xml`。
- [ ] 将应用 zip（以及可选的 dSYM zip）准备好，以便附加到 GitHub 发布中。
- [ ] 按照 [macOS release](/platforms/mac/release) 中的说明，使用准确的命令和所需的环境变量。
  - `APP_BUILD` 必须是数字且单调递增（不得包含 `-beta`），以便 Sparkle 正确比较版本。
  - 如果需要公证，请使用从 App Store Connect API 环境变量中创建的 `openclaw-notary` 钥匙链配置文件（参见 [macOS release](/platforms/mac/release)）。

6) **发布（npm）**
- [ ] 确认 git 状态干净；如有必要，提交并推送。
- [ ] `npm login`（如需，验证 2FA）。
- [ ] `npm publish --access public`（预发布使用 `--tag beta`）。
- [ ] 验证注册表：`npm view openclaw version`、`npm view openclaw dist-tags` 和 `npx -y openclaw@X.Y.Z --version`（或 `--help`）。

### 故障排除（来自 2.0.0-beta2 发布的备注）
- **npm pack/publish 卡住或生成巨大 tarball**：macOS 应用程序包在 `dist/OpenClaw.app` 中（以及发布 zip）被扫入软件包。解决方法是通过 `package.json` 和 `files` 对发布内容进行白名单设置（包括 dist 子目录、文档、技能；排除应用程序包）。使用 `npm pack --dry-run` 确认 `dist/OpenClaw.app` 未列入其中。
- **npm auth web 循环用于 dist-tags**：使用旧版认证获取 OTP 提示：
  - `NPM_CONFIG_AUTH_TYPE=legacy npm dist-tag add openclaw@X.Y.Z latest`
- **`npx` 验证失败，出现 `ECOMPROMISED: Lock compromised`**：使用全新缓存重试：
  - `NPM_CONFIG_CACHE=/tmp/npm-cache-$(date +%s) npx -y openclaw@X.Y.Z --version`
- **标签在后期修复后需要重新指向**：强制更新并推送标签，然后确保 GitHub 发布资产仍然匹配：
  - `git tag -f vX.Y.Z && git push -f origin vX.Y.Z`

7) **GitHub 发布 + appcast**
- [ ] 打标签并推送：`git tag vX.Y.Z && git push origin vX.Y.Z`（或 `git push --tags`）。
- [ ] 为 `vX.Y.Z` 创建或刷新 GitHub 发布，**标题为 `openclaw X.Y.Z`**（不仅仅是标签）；正文应包含该版本的**完整**变更日志部分（亮点 + 变更 + 修复），内联显示（不使用裸链接），并且**不得在正文中重复标题**。
- [ ] 附加工件：`npm pack` tarball（可选）、`OpenClaw-X.Y.Z.zip` 和 `OpenClaw-X.Y.Z.dSYM.zip`（如果已生成）。
- [ ] 提交更新的 `appcast.xml` 并推送（Sparkle 从 main 分支获取数据）。
- [ ] 从一个干净的临时目录（不含 `package.json`），运行 `npx -y openclaw@X.Y.Z send --help` 以确认安装/CLI 入口点正常工作。
- [ ] 宣布并分享发布说明。

## 插件发布范围（npm）
我们仅在 `@openclaw/*` 范围下发布**现有的 npm 插件**。未在 npm 上的捆绑插件仅存在于**磁盘树中**（仍打包在 `extensions/**` 中）。

生成列表的流程：
1) `npm search @openclaw --json` 并捕获软件包名称。
2) 与 `extensions/*/package.json` 名称进行比较。
3) 仅发布**交集**（已在 npm 上）。

当前 npm 插件列表（根据需要更新）：
- @openclaw/bluebubbles
- @openclaw/diagnostics-otel
- @openclaw/discord
- @openclaw/lobster
- @openclaw/matrix
- @openclaw/msteams
- @openclaw/nextcloud-talk
- @openclaw/nostr
- @openclaw/voice-call
- @openclaw/zalo
- @openclaw/zalouser

发布说明还必须指出那些**默认未启用的新增可选捆绑插件**（例如，`tlon`）。
