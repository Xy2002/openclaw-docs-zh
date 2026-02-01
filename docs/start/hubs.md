---
summary: Hubs that link to every OpenClaw doc
read_when:
  - You want a complete map of the documentation
---
# 文档中心

使用这些中心来探索所有页面，包括未显示在左侧导航中的深度解析和参考文档。

## 从这里开始

- [索引](/)
- [入门](/start/getting-started)
- [入职](/start/onboarding)
- [向导](/start/wizard)
- [设置](/start/setup)
- [仪表板（本地网关）](http://127.0.0.1:18789/)
- [帮助](/help)
- [配置](/gateway/configuration)
- [配置示例](/gateway/configuration-examples)
- [OpenClaw助手](/start/openclaw)
- [展示](/start/showcase)
- [背景故事](/start/lore)

## 安装与更新

- [Docker](/install/docker)
- [Nix](/install/nix)
- [更新/回滚](/install/updating)
- [Bun 工作流（实验性）](/install/bun)

## 核心概念

- [架构](/concepts/architecture)
- [网络枢纽](/network)
- [代理运行时](/concepts/agent)
- [代理工作空间](/concepts/agent-workspace)
- [记忆](/concepts/memory)
- [代理循环](/concepts/agent-loop)
- [流式传输 + 分块](/concepts/streaming)
- [多代理路由](/concepts/multi-agent)
- [压缩](/concepts/compaction)
- [会话](/concepts/session)
- [会话（别名）](/concepts/sessions)
- [会话修剪](/concepts/session-pruning)
- [会话工具](/concepts/session-tool)
- [队列](/concepts/queue)
- [斜杠命令](/tools/slash-commands)
- [RPC 适配器](/reference/rpc)
- [TypeBox 模式](/concepts/typebox)
- [时区处理](/concepts/timezone)
- [存在感](/concepts/presence)
- [发现 + 传输](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
- [通道路由](/concepts/channel-routing)
- [群组](/concepts/groups)
- [群组消息](/concepts/group-messages)
- [模型故障转移](/concepts/model-failover)
- [OAuth](/concepts/oauth)

## 提供商与入口

- [聊天频道中心](/channels)
- [模型提供商中心](/providers/models)
- [WhatsApp](/channels/whatsapp)
- [Telegram](/channels/telegram)
- [Telegram（grammY 注释）](/channels/grammy)
- [Slack](/channels/slack)
- [Discord](/channels/discord)
- [Mattermost](/channels/mattermost)（插件）
- [Signal](/channels/signal)
- [iMessage](/channels/imessage)
- [位置解析](/channels/location)
- [WebChat](/web/webchat)
- [Webhooks](/automation/webhook)
- [Gmail Pub/Sub](/automation/gmail-pubsub)

## 网关与运维

- [网关操作手册](/gateway)
- [网关配对](/gateway/pairing)
- [网关锁定](/gateway/gateway-lock)
- [后台进程](/gateway/background-process)
- [健康状况](/gateway/health)
- [心跳](/gateway/heartbeat)
- [医生](/gateway/doctor)
- [日志记录](/gateway/logging)
- [沙箱化](/gateway/sandboxing)
- [仪表板](/web/dashboard)
- [控制 UI](/web/control-ui)
- [远程访问](/gateway/remote)
- [远程网关 README](/gateway/remote-gateway-readme)
- [Tailscale](/gateway/tailscale)
- [安全](/gateway/security)
- [故障排除](/gateway/troubleshooting)

## 工具与自动化

- [工具表面](/tools)
- [OpenProse](/prose)
- [CLI 参考](/cli)
- [执行工具](/tools/exec)
- [提升模式](/tools/elevated)
- [Cron 作业](/automation/cron-jobs)
- [Cron vs 心跳](/automation/cron-vs-heartbeat)
- [思考模式 + 详细模式](/tools/thinking)
- [模型](/concepts/models)
- [子代理](/tools/subagents)
- [代理发送 CLI](/tools/agent-send)
- [终端 UI](/tui)
- [浏览器控制](/tools/browser)
- [浏览器（Linux 故障排除）](/tools/browser-linux-troubleshooting)
- [投票](/automation/poll)

## 节点、媒体、语音

- [节点概述](/nodes)
- [相机](/nodes/camera)
- [图像](/nodes/images)
- [音频](/nodes/audio)
- [位置命令](/nodes/location-command)
- [语音唤醒](/nodes/voicewake)
- [对话模式](/nodes/talk)

## 平台

- [平台概述](/platforms)
- [macOS](/platforms/macos)
- [iOS](/platforms/ios)
- [Android](/platforms/android)
- [Windows（WSL2）](/platforms/windows)
- [Linux](/platforms/linux)
- [Web 表面](/web)

## macOS 配套应用（高级）

- [macOS 开发环境设置](/platforms/mac/dev-setup)
- [macOS 菜单栏](/platforms/mac/menu-bar)
- [macOS 语音唤醒](/platforms/mac/voicewake)
- [macOS 语音叠加](/platforms/mac/voice-overlay)
- [macOS WebChat](/platforms/mac/webchat)
- [macOS Canvas](/platforms/mac/canvas)
- [macOS 子进程](/platforms/mac/child-process)
- [macOS 健康状况](/platforms/mac/health)
- [macOS 图标](/platforms/mac/icon)
- [macOS 日志记录](/platforms/mac/logging)
- [macOS 权限](/platforms/mac/permissions)
- [macOS 进行远程](/platforms/mac/remote)
- [macOS 签名](/platforms/mac/signing)
- [macOS 发布](/platforms/mac/release)
- [macOS 网关（launchd）](/platforms/mac/bundled-gateway)
- [macOS XPC](/platforms/mac/xpc)
- [macOS 技能](/platforms/mac/skills)
- [macOS Peekaboo](/platforms/mac/peekaboo)

## 工作空间与模板

- [技能](/tools/skills)
- [ClawHub](/tools/clawhub)
- [技能配置](/tools/skills-config)
- [默认 AGENTS](/reference/AGENTS.default)
- [模板：AGENTS](/reference/templates/AGENTS)
- [模板：引导](/reference/templates/BOOTSTRAP)
- [模板：心跳](/reference/templates/HEARTBEAT)
- [模板：身份](/reference/templates/IDENTITY)
- [模板：灵魂](/reference/templates/SOUL)
- [模板：工具](/reference/templates/TOOLS)
- [模板：用户](/reference/templates/USER)

## 实验（探索性）

- [入职配置协议](/experiments/onboarding-config-protocol)
- [Cron 加固笔记](/experiments/plans/cron-add-hardening)
- [群组策略加固笔记](/experiments/plans/group-policy-hardening)
- [研究：记忆](/experiments/research/memory)
- [模型配置探索](/experiments/proposals/model-config)

## 测试与发布

- [测试](/reference/test)
- [发布检查清单](/reference/RELEASING)
- [设备型号](/reference/device-models)
