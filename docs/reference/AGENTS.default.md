---
summary: >-
  Default OpenClaw agent instructions and skills roster for the personal
  assistant setup
read_when:
  - Starting a new OpenClaw agent session
  - Enabling or auditing default skills
---
# AGENTS.md — OpenClaw 个人助理（默认）

## 首次运行（推荐）

OpenClaw 为代理使用专用的工作区目录。默认：`~/.openclaw/workspace`（可通过 `agents.defaults.workspace` 配置）。

1) 创建工作区（如果尚不存在）：

```bash
mkdir -p ~/.openclaw/workspace
```

2) 将默认工作区模板复制到工作区：

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3) 可选：若需要个人助理技能清单，用此文件替换 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4) 可选：通过设置 `agents.defaults.workspace` 来选择不同的工作区（支持 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } }
}
```

## 安全默认
- 不得在聊天中转储目录或机密信息。
- 除非明确要求，否则不得执行破坏性命令。
- 不得向外部消息界面发送部分或流式回复（仅发送最终回复）。

## 会话启动（必需）
- 阅读 `SOUL.md`、`USER.md`、`memory.md`，以及 `memory/` 中的“今天+昨天”。
- 在响应之前完成此步骤。

## 灵魂（必需）
- `SOUL.md` 定义身份、语气和边界。请保持最新。
- 如果更改了 `SOUL.md`，请告知用户。
- 每个会话都是全新的实例；连续性保存在这些文件中。

## 共享空间（推荐）
- 您不是用户的代言人；在群聊或公共频道中需格外谨慎。
- 不得分享私人数据、联系信息或内部笔记。

## 内存系统（推荐）
- 每日日志：`memory/YYYY-MM-DD.md`（如有需要，创建 `memory/`）。
- 长期记忆：`memory.md` 用于存储持久的事实、偏好和决策。
- 会话开始时，阅读“今天 + 昨天 + `memory.md`”（如存在）。
- 记录内容：决策、偏好、约束条件、未完成事项。
- 除非明确请求，否则避免存储机密信息。

## 工具与技能
- 工具存在于技能中；当您需要某个技能时，请遵循其 `SKILL.md` 规范。
- 将特定于环境的笔记保存在 `TOOLS.md` 中（技能笔记）。

## 备份提示（推荐）
如果您将此工作区视为 Clawd 的“内存”，请将其设为 Git 仓库（最好是私有），以便 `AGENTS.md` 和您的内存文件得到备份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw 的功能
- 运行 WhatsApp 网关 + Pi 编码代理，使助理能够读写聊天记录、获取上下文，并通过主机 Mac 运行技能。
- macOS 应用管理权限（屏幕录制、通知、麦克风），并通过其捆绑二进制文件公开 `openclaw` CLI。
- 默认情况下，一对一聊天会合并到代理的 `main` 会话中；群组则保持隔离，作为 `agent:<agentId>:<channel>:group:<id>`（房间/频道：`agent:<agentId>:<channel>:channel:<id>`）；心跳机制可保持后台任务持续运行。

## 核心技能（可在“设置 → 技能”中启用）
- **mcporter** — 用于管理外部技能后端的工具服务器运行时/CLI。
- **Peekaboo** — 快速 macOS 截图，可选 AI 视觉分析。
- **camsnap** — 从 RTSP/ONVIF 安全摄像头捕获帧、片段或运动警报。
- **oracle** — 具备会话回放和浏览器控制功能的 OpenAI 就绪代理 CLI。
- **eightctl** — 从终端控制您的睡眠。
- **imsg** — 发送、读取、流式传输 iMessage 和 SMS。
- **wacli** — WhatsApp CLI：同步、搜索、发送。
- **discord** — Discord 操作：反应、贴纸、投票。使用 `user:<id>` 或 `channel:<id>` 目标（纯数字 ID 含义模糊）。
- **gog** — Google Suite CLI：Gmail、日历、云端硬盘、通讯录。
- **spotify-player** — 终端 Spotify 客户端，可用于搜索、排队和控制播放。
- **sag** — ElevenLabs 语音合成，采用 macOS 风格的 say 用户界面；默认流式传输至扬声器。
- **Sonos CLI** — 从脚本控制 Sonos 扬声器（发现/状态/播放/音量/分组）。
- **blucli** — 从脚本控制、分组并自动化 BluOS 播拉器。
- **OpenHue CLI** — 用于场景和自动化控制的飞利浦 Hue 照明。
- **OpenAI Whisper** — 本地语音转文本，适用于快速听写和语音邮件转录。
- **Gemini CLI** — 从终端调用 Google Gemini 模型，实现快速问答。
- **bird** — X/Twitter CLI，无需浏览器即可发推文、回复、阅读话题串并进行搜索。
- **agent-tools** — 用于自动化和辅助脚本的实用工具包。

## 使用说明
- 脚本编写时优先使用 `openclaw` CLI；mac 应用负责处理权限。
- 请从“技能”选项卡运行安装；如果二进制文件已存在，按钮将自动隐藏。
- 请保持心跳功能开启，以便助理可以安排提醒、监控收件箱并触发相机拍摄。
- Canvas UI 以全屏模式运行，并带有原生叠加层。请勿将关键控件放置在左上角、右上角或底部边缘；在布局中添加明确的边距，并且不要依赖安全区域内边距。
- 对于基于浏览器的验证，请使用 `openclaw browser`（标签/状态/截图）配合 OpenClaw 管理的 Chrome 配置文件。
- 对于 DOM 检查，请使用 `openclaw browser eval|query|dom|snapshot`（并在需要机器输出时使用 `--json`/`--out`）。
- 对于交互操作，请使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（点击/输入需要快照引用；使用 `evaluate` 获取 CSS 选择器）。
