---
summary: 'Setup guide: keep your OpenClaw setup tailored while staying up-to-date'
read_when:
  - Setting up a new machine
  - You want “latest + greatest” without breaking your personal setup
---
# 设置

最后更新：2026-01-01

## 简要说明
- **在仓库外进行个性化配置**：`~/.openclaw/workspace`（工作区）+ `~/.openclaw/openclaw.json`（配置）。
- **稳定的工作流**：安装 macOS 应用程序，并让其运行捆绑的 Gateway。
- **前沿工作流**：通过 `pnpm gateway:watch` 自行运行 Gateway，然后让 macOS 应用以本地模式连接。

## 从源码安装的先决条件
- Node `>=22`
- `pnpm`
- Docker（可选；仅用于容器化设置或端到端测试——参见 [Docker](/install/docker))

## 定制策略（确保更新不会破坏现有配置）

如果你希望“完全根据我的需求定制”且易于更新，请将自定义内容保存在以下位置：
- **配置**：`~/.openclaw/openclaw.json`（JSON/JSON5 风格）
- **工作区**：`~/.openclaw/workspace`（技能、提示、记忆；将其设为私有 Git 仓库）

只需初始化一次：

```bash
openclaw setup
```

在该仓库内，使用本地 CLI 入口：

```bash
openclaw setup
```

如果你尚未全局安装，可通过 `pnpm openclaw setup` 运行。

## 稳定工作流（优先使用 macOS 应用程序）

1) 安装并启动 **OpenClaw.app**（位于菜单栏）。
2) 完成引导流程和权限检查清单（TCC 提示）。
3) 确保 Gateway 处于 **本地** 模式并正在运行（由应用程序管理）。
4) 关联各表面（例如 WhatsApp）：

```bash
openclaw channels login
```

5) 健康检查：

```bash
openclaw health
```

如果在你的构建中无法访问引导流程：
- 先运行 `openclaw setup`，再运行 `openclaw channels login`，然后手动启动 Gateway（`openclaw gateway`）。

## 前沿工作流（在终端中运行 Gateway）

目标：开发 TypeScript Gateway，实现热重载，并保持 macOS 应用程序界面连接。

### 0) （可选）也从源码运行 macOS 应用程序

如果你想让 macOS 应用程序同样处于前沿状态：

```bash
./scripts/restart-mac.sh
```

### 1) 启动开发 Gateway

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` 以监听模式运行 Gateway，并在 TypeScript 发生更改时自动重新加载。

### 2) 将 macOS 应用程序指向你正在运行的 Gateway

在 **OpenClaw.app** 中：

- 连接模式：**本地**
应用程序将连接到在配置端口上运行的 Gateway。

### 3) 验证

- 应用程序中的 Gateway 状态应显示为 **“正在使用现有 Gateway …”**
- 或通过 CLI：

```bash
openclaw health
```

### 常见陷阱
- **端口错误**：Gateway WS 默认使用 `ws://127.0.0.1:18789`；请确保应用程序和 CLI 使用同一端口。
- **状态存储位置**：
  - 凭证：`~/.openclaw/credentials/`
  - 会话：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭证存储映射

在调试身份验证或决定备份哪些内容时使用此表：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 机器人令牌**：配置/环境变量或 `channels.telegram.tokenFile`
- **Discord 机器人令牌**：配置/环境变量（暂不支持令牌文件）
- **Slack 令牌**：配置/环境变量（`channels.slack.*`）
- **配对白名单**：`~/.openclaw/credentials/<channel>-allowFrom.json`
- **模型身份验证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
更多详细信息：[安全](/gateway/security#credential-storage-map)。

## 更新（避免破坏现有配置）

- 保留 `~/.openclaw/workspace` 和 `~/.openclaw/` 作为“你的内容”；不要将个人提示或配置放入 `openclaw` 仓库。
- 更新源代码：`git pull` + `pnpm install`（当 lockfile 发生变化时）+ 继续使用 `pnpm gateway:watch`。

## Linux（systemd 用户服务）

Linux 安装使用 systemd 的 **用户** 服务。默认情况下，systemd 在注销或空闲时停止用户服务，这会导致 Gateway 被终止。引导流程会尝试为你启用 linger 功能（可能需要输入 sudo）。如果 linger 仍未启用，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于始终在线或多用户服务器，可以考虑使用 **系统** 服务而非用户服务（无需 linger）。有关 systemd 相关注意事项，请参阅 [Gateway 运行手册](/gateway)。

## 相关文档

- [Gateway 运行手册](/gateway)（标志、监督、端口）
- [Gateway 配置](/gateway/configuration)（配置模式与示例）
- [Discord](/channels/discord) 和 [Telegram](/channels/telegram)（回复标签与 replyToMode 设置）
- [OpenClaw 助手设置](/start/openclaw)
- [macOS 应用程序](/platforms/macos)（Gateway 生命周期）
