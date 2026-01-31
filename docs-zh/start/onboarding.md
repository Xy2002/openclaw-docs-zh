---
summary: First-run onboarding flow for OpenClaw (macOS app)
read_when:
  - Designing the macOS onboarding assistant
  - Implementing auth or identity setup
---
# 入门流程（macOS 应用）

本文档描述了**当前**的首次运行入门流程。其目标是提供流畅的“第 0 天”体验：选择网关的运行位置、完成身份验证连接、运行向导，并让代理自动完成引导。

## 页面顺序（当前）

1) 欢迎页面 + 安全提示  
2) **网关选择**（本地 / 远程 / 稍后配置）  
3) **身份验证（Anthropic OAuth）** — 仅限本地  
4) **设置向导**（由网关驱动）  
5) **权限**（TCC 提示）  
6) **CLI**（可选）  
7) **入门聊天**（专用会话）  
8) 准备就绪  

## 1) 本地与远程

**网关**在何处运行？

- **本地（本 Mac）：** 入门流程可以运行 OAuth 流程并将凭据本地写入。
- **远程（通过 SSH/Tailnet）：** 入门流程**不会**在本地运行 OAuth；凭据必须存在于网关主机上。
- **稍后配置：** 跳过设置，使应用保持未配置状态。

网关身份验证提示：
- 向导现在即使在环回模式下也会生成一个**令牌**，因此本地 WebSocket 客户端必须进行身份验证。
- 如果禁用身份验证，任何本地进程都可以连接；请仅在完全受信任的机器上使用此选项。
- 对于多机访问或非环回绑定，请使用**令牌**。

## 2) 仅限本地的身份验证（Anthropic OAuth）

macOS 应用支持 Anthropic OAuth（Claude Pro/Max）。流程如下：

- 打开浏览器以进行 OAuth（PKCE）
- 要求用户粘贴 `code#state` 值
- 将凭据写入 `~/.openclaw/credentials/oauth.json`

目前，其他提供商（如 OpenAI 和自定义 API）通过环境变量或配置文件进行配置。

## 3) 设置向导（由网关驱动）

该应用可以运行与 CLI 相同的设置向导。这使得入门流程与网关侧的行为保持同步，并避免在 SwiftUI 中重复逻辑。

## 4) 权限

入门过程会请求以下 TCC 权限：

- 通知
- 辅助功能
- 屏幕录制
- 麦克风 / 语音识别
- 自动化（AppleScript）

## 5) CLI（可选）

该应用可以通过 npm/pnpm 安装全局 `openclaw` CLI，以便终端工作流和 launchd 任务开箱即用。

## 6) 入门聊天（专用会话）

设置完成后，应用会打开一个专用的入门聊天会话，以便代理能够自我介绍并指导后续步骤。这样可以将首次运行的引导信息与您的正常对话分开。

## 代理引导仪式

在代理首次运行时，OpenClaw 会引导创建一个工作区（默认 `~/.openclaw/workspace`）：

- 初始化 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md`
- 运行简短的问答仪式（一次一个问题）
- 将身份和偏好写入 `IDENTITY.md`、`USER.md`、`SOUL.md`
- 完成后移除 `BOOTSTRAP.md`，确保其仅运行一次

## 可选：Gmail 钩子（手动）

Gmail Pub/Sub 的设置目前仍需手动完成。使用以下内容：

```bash
openclaw webhooks gmail setup --account you@gmail.com
```

有关详细信息，请参阅 [/automation/gmail-pubsub](/automation/gmail-pubsub)。

## 远程模式注意事项

当网关运行在另一台机器上时，凭据和工作区文件将存储在**该主机上**。如果在远程模式下需要 OAuth，请在网关主机上创建：

- `~/.openclaw/credentials/oauth.json`
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
