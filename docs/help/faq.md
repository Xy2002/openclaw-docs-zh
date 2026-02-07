---
summary: 'Frequently asked questions about OpenClaw setup, configuration, and usage'
---
# 常见问题

针对真实场景中的各种设置——包括本地开发、VPS、多代理、OAuth/API密钥以及模型故障转移——我们提供快速解答和更深入的故障排除支持。有关运行时诊断，请参阅[故障排除](/gateway/troubleshooting)。如需完整的配置参考，请参阅[配置](/gateway/configuration)。

## 目录

- [快速入门与首次运行设置](#quick-start-and-firstrun-setup)
  - [我卡住了，有什么最快的办法能让我继续前进？](#im-stuck-whats-the-fastest-way-to-get-unstuck)
  - [安装和设置 OpenClaw 的推荐方法是什么？](#whats-the-recommended-way-to-install-and-set-up-openclaw)
  - [如何在完成引导后打开仪表板？](#how-do-i-open-the-dashboard-after-onboarding)
  - [如何在本地主机与远程环境中对仪表板进行身份验证（令牌）？](#how-do-i-authenticate-the-dashboard-token-on-localhost-vs-remote)
  - [我需要哪种运行时环境？](#what-runtime-do-i-need)
  - [它能在树莓派上运行吗？](#does-it-run-on-raspberry-pi)
  - [在树莓派上安装有哪些技巧？](#any-tips-for-raspberry-pi-installs)
  - [它卡在“唤醒我的朋友”界面，引导流程无法完成。现在该怎么办？](#it-is-stuck-on-wake-up-my-friend-onboarding-will-not-hatch-what-now)
  - [我可以将现有设置迁移到新机器（Mac mini）而不必重新进行引导吗？](#can-i-migrate-my-setup-to-a-new-machine-mac-mini-without-redoing-onboarding)
  - [我在哪里可以查看最新版本的新功能？](#where-do-i-see-whats-new-in-the-latest-version)
  - [我无法访问 docs.openclaw.ai（SSL 错误）。现在怎么办？](#i-cant-access-docsopenclawai-ssl-error-what-now)
  - [稳定版与测试版之间有何区别？](#whats-the-difference-between-stable-and-beta)
- [如何安装测试版？测试版与开发版有何不同？](#how-do-i-install-the-beta-version-and-whats-the-difference-between-beta-and-dev)
  - [如何试用最新版本的软件？](#how-do-i-try-the-latest-bits)
  - [安装和引导通常需要多长时间？](#how-long-does-install-and-onboarding-usually-take)
  - [安装程序卡住了？如何获得更多反馈？](#installer-stuck-how-do-i-get-more-feedback)
  - [Windows 安装提示未找到 Git 或无法识别 OpenClaw](#windows-install-says-git-not-found-or-openclaw-not-recognized)
  - [文档没有解答我的问题——如何获得更满意的答案？](#the-docs-didnt-answer-my-question-how-do-i-get-a-better-answer)
  - [如何在 Linux 上安装 OpenClaw？](#how-do-i-install-openclaw-on-linux)
  - [如何在 VPS 上安装 OpenClaw？](#how-do-i-install-openclaw-on-a-vps)
  - [云端/VPS 安装指南在哪里？](#where-are-the-cloudvps-install-guides)
  - [我可以要求 OpenClaw 自动更新吗？](#can-i-ask-openclaw-to-update-itself)
  - [引导向导到底做了什么？](#what-does-the-onboarding-wizard-actually-do)
  - [运行此软件是否需要 Claude 或 OpenAI 订阅？](#do-i-need-a-claude-or-openai-subscription-to-run-this)
  - [是否可以在没有 API 密钥的情况下使用 Claude Max 订阅？](#can-i-use-claude-max-subscription-without-an-api-key)
  - [Anthropic 的“setup-token”身份验证是如何工作的？](#how-does-anthropic-setuptoken-auth-work)
  - [我在哪里可以找到 Anthropic 的 setup-token？](#where-do-i-find-an-anthropic-setuptoken)
  - [你们是否支持 Claude 订阅身份验证（Claude Code OAuth）？](#do-you-support-claude-subscription-auth-claude-code-oauth)
  - [为什么我看到来自 Anthropic 的 `HTTP 429: rate_limit_error`？](#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)
  - [是否支持 AWS Bedrock？](#is-aws-bedrock-supported)
  - [Codex 身份验证是如何工作的？](#how-does-codex-auth-work)
  - [你们是否支持 OpenAI 订阅身份验证（Codex OAuth）？](#do-you-support-openai-subscription-auth-codex-oauth)
  - [如何设置 Gemini CLI OAuth？](#how-do-i-set-up-gemini-cli-oauth)
  - [对于日常聊天，使用本地模型可以吗？](#is-a-local-model-ok-for-casual-chats)
  - [如何将托管模型的流量限制在特定区域？](#how-do-i-keep-hosted-model-traffic-in-a-specific-region)
  - [我必须购买 Mac Mini 才能安装这款软件吗？](#do-i-have-to-buy-a-mac-mini-to-install-this)
  - [为了支持 iMessage，我需要 Mac mini 吗？](#do-i-need-a-mac-mini-for-imessage-support)
  - [如果我购买 Mac mini 来运行 OpenClaw，能否将其连接到我的 MacBook Pro？](#if-i-buy-a-mac-mini-to-run-openclaw-can-i-connect-it-to-my-macbook-pro)
  - [我可以使用 Bun 吗？](#can-i-use-bun)
  - [Telegram：`allowFrom` 中应该填写什么？](#telegram-what-goes-in-allowfrom)
  - [多名用户能否使用同一个 WhatsApp 号码并运行不同的 OpenClaw 实例？](#can-multiple-people-use-one-whatsapp-number-with-different-openclaw-instances)
  - [我可以同时运行一个“快速聊天”代理和一个“用于编码的 Opus”代理吗？](#can-i-run-a-fast-chat-agent-and-an-opus-for-coding-agent)
  - [Homebrew 在 Linux 上可用吗？](#does-homebrew-work-on-linux)
  - [可 hack 版本（git）安装与 npm 安装有何区别？](#whats-the-difference-between-the-hackable-git-install-and-npm-install)
  - [以后可以切换 npm 和 git 安装吗？](#can-i-switch-between-npm-and-git-installs-later)
  - [我应该在笔记本电脑上还是在 VPS 上运行网关？](#should-i-run-the-gateway-on-my-laptop-or-a-vps)
  - [在专用机器上运行 OpenClaw 有多重要？](#how-important-is-it-to-run-openclaw-on-a-dedicated-machine)
  - [最低 VPS 要求和推荐的操作系统是什么？](#what-are-the-minimum-vps-requirements-and-recommended-os)
  - [是否可以在虚拟机中运行 OpenClaw？运行所需的条件是什么？](#can-i-run-openclaw-in-a-vm-and-what-are-the-requirements)
- [什么是 OpenClaw？](#what-is-openclaw)
  - [用一段话解释什么是 OpenClaw？](#what-is-openclaw-in-one-paragraph)
  - [它的价值主张是什么？](#whats-the-value-proposition)
  - [我刚完成设置，接下来该做什么？](#i-just-set-it-up-what-should-i-do-first)
  - [OpenClaw 的五大日常应用场景是什么？](#what-are-the-top-five-everyday-use-cases-for-openclaw)
  - [OpenClaw 是否可以帮助 SaaS 公司进行潜在客户挖掘、广告投放和博客撰写？](#can-openclaw-help-with-lead-gen-outreach-ads-and-blogs-for-a-saas)
  - [与 Claude Code 相比，OpenClaw 在 Web 开发方面有哪些优势？](#what-are-the-advantages-vs-claude-code-for-web-development)
- [技能与自动化](#skills-and-automation)
  - [如何自定义技能而不污染代码库？](#how-do-i-customize-skills-without-keeping-the-repo-dirty)
  - [我可以从自定义文件夹加载技能吗？](#can-i-load-skills-from-a-custom-folder)
  - [如何为不同任务使用不同模型？](#how-can-i-use-different-models-for-different-tasks)
  - [机器人在执行繁重任务时卡住。如何卸载这些任务？](#the-bot-freezes-while-doing-heavy-work-how-do-i-offload-that)
  - [Cron 或提醒未触发。我应该检查什么？](#cron-or-reminders-do-not-fire-what-should-i-check)
  - [如何在 Linux 上安装技能？](#how-do-i-install-skills-on-linux)
  - [OpenClaw 是否可以按计划或在后台持续运行任务？](#can-openclaw-run-tasks-on-a-schedule-or-continuously-in-the-background)
  - [我可以从 Linux 运行仅适用于 Apple/macOS 的技能吗？](#can-i-run-applemacosonly-skills-from-linux)
  - [你们有 Notion 或 HeyGen 集成吗？](#do-you-have-a-notion-or-heygen-integration)
  - [如何安装 Chrome 扩展以接管浏览器控制？](#how-do-i-install-the-chrome-extension-for-browser-takeover)
- [沙箱与内存](#sandboxing-and-memory)
  - [是否有专门的沙箱文档？](#is-there-a-dedicated-sandboxing-doc)
  - [如何将主机文件夹绑定到沙箱中？](#how-do-i-bind-a-host-folder-into-the-sandbox)
  - [内存是如何工作的？](#how-does-memory-work)
  - [内存总是忘记内容。如何让它记住更多？](#memory-keeps-forgetting-things-how-do-i-make-it-stick)
  - [内存会永久保存数据吗？有哪些限制？](#does-memory-persist-forever-what-are-the-limits)
  - [语义记忆搜索是否需要 OpenAI API 密钥？](#does-semantic-memory-search-require-an-openai-api-key)
- [数据在磁盘上的存储位置](#where-things-live-on-disk)
  - [所有与 OpenClaw 一起使用的数据是否都本地保存？](#is-all-data-used-with-openclaw-saved-locally)
  - [OpenClaw 的数据存储在何处？](#where-does-openclaw-store-its-data)
  - [AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该存放在哪里？](#where-should-agentsmd-soulmd-usermd-memorymd-live)
  - [推荐的备份策略是什么？](#whats-the-recommended-backup-strategy)
  - [如何彻底卸载 OpenClaw？](#how-do-i-completely-uninstall-openclaw)
  - [代理是否可以在工作区之外工作？](#can-agents-work-outside-the-workspace)
  - [我处于远程模式——会话存储在哪里？](#im-in-remote-mode-where-is-the-session-store)
- [配置基础](#config-basics)
  - [配置采用什么格式？配置文件在哪里？](#what-format-is-the-config-where-is-it)
  - [我设置了 `gateway.bind: "lan"`（或 `"tailnet"`），但现在没有任何服务监听，UI 显示未经授权](#i-set-gatewaybind-lan-or-tailnet-and-now-nothing-listens-the-ui-says-unauthorized)
  - [为什么我现在在本地主机上也需要令牌？](#why-do-i-need-a-token-on-localhost-now)
  - [更改配置后是否必须重启？](#do-i-have-to-restart-after-changing-config)
  - [如何启用网络搜索（以及网页抓取）？](#how-do-i-enable-web-search-and-web-fetch)
  - [config.apply 清除了我的配置。如何恢复并避免这种情况再次发生？](#configapply-wiped-my-config-how-do-i-recover-and-avoid-this)
  - [如何运行一个中央网关，并在不同设备上部署专用工作节点？](#how-do-i-run-a-central-gateway-with-specialized-workers-across-devices)
  - [OpenClaw 浏览器能否以无头模式运行？](#can-the-openclaw-browser-run-headless)
  - [如何使用 Brave 控制浏览器？](#how-do-i-use-brave-for-browser-control)
- [远程网关 + 节点](#remote-gateways-nodes)
  - [命令如何在 Telegram、网关和节点之间传播？](#how-do-commands-propagate-between-telegram-the-gateway-and-nodes)
  - [如果网关托管在远程位置，我的代理如何访问我的计算机？](#how-can-my-agent-access-my-computer-if-the-gateway-is-hosted-remotely)
  - [Tailscale 已连接，但没有收到任何回复。现在怎么办？](#tailscale-is-connected-but-i-get-no-replies-what-now)
  - [两个 OpenClaw 实例能否相互通信（本地 + VPS）？](#can-two-openclaw-instances-talk-to-each-other-local-vps)
  - [多个代理是否需要单独的 VPS？](#do-i-need-separate-vpses-for-multiple-agents)
  - [在我的个人笔记本电脑上使用节点而不是通过 VPS 进行 SSH 有好处吗？](#is-there-a-benefit-to-using-a-node-on-my-personal-laptop-instead-of-ssh-from-a-vps)
  - [节点是否运行网关服务？](#do-nodes-run-a-gateway-service)
  - [是否有通过 API/RPC 应用配置的方法？](#is-there-an-api-rpc-way-to-apply-config)
  - [首次安装的最小“合理”配置是什么？](#whats-a-minimal-sane-config-for-a-first-install)
  - [如何在 VPS 上设置 Tailscale 并从 Mac 连接？](#how-do-i-set-up-tailscale-on-a-vps-and-connect-from-my-mac)
  - [如何将 Mac 节点连接到远程网关（Tailscale Serve）？](#how-do-i-connect-a-mac-node-to-a-remote-gateway-tailscale-serve)
  - [我应该在第二台笔记本电脑上安装，还是只需添加一个节点？](#should-i-install-on-a-second-laptop-or-just-add-a-node)
- [环境变量与 .env 加载](#env-vars-and-env-loading)
  - [OpenClaw 如何加载环境变量？](#how-does-openclaw-load-environment-variables)
  - [“我通过服务启动了网关，但我的环境变量消失了。”现在怎么办？](#i-started-the-gateway-via-the-service-and-my-env-vars-disappeared-what-now)
  - [我设置了 `COPILOT_GITHUB_TOKEN`，但模型状态显示“Shell env: off”。这是为什么？](#i-set-copilotgithubtoken-but-models-status-shows-shell-env-off-why)
- [会话与多对话](#sessions-multiple-chats)
  - [如何开始一次全新的对话？](#how-do-i-start-a-fresh-conversation)
  - [如果我从未发送 `/new`，会话是否会自动重置？](#do-sessions-reset-automatically-if-i-never-send-new)
  - [有没有办法让一组 OpenClaw 实例组成一个 CEO 和多个代理？](#is-there-a-way-to-make-a-team-of-openclaw-instances-one-ceo-and-many-agents)
  - [为什么上下文会在任务中途被截断？如何防止这种情况？](#why-did-context-get-truncated-midtask-how-do-i-prevent-it)
  - [如何在不卸载 OpenClaw 的的情况下完全重置它？](#how-do-i-completely-reset-openclaw-but-keep-it-installed)
  - [我收到“上下文过大”的错误——如何重置或压缩上下文？](#im-getting-context-too-large-errors-how-do-i-reset-or-compact)
  - [为什么我看到“LLM 请求被拒绝：messages.N.content.X.tool_use.input：字段必填”？](#why-am-i-seeing-llm-request-rejected-messagesncontentxtooluseinput-field-required)
  - [为什么我每 30 分钟就会收到心跳消息？](#why-am-i-getting-heartbeat-messages-every-30-minutes)
  - [我是否需要在 WhatsApp 群组中添加“机器人账户”？](#do-i-need-to-add-a-bot-account-to-a-whatsapp-group)
  - [如何获取 WhatsApp 群组的 JID？](#how-do-i-get-the-jid-of-a-whatsapp-group)
  - [为什么 OpenClaw 不在群组中回复？](#why-doesnt-openclaw-reply-in-a-group)
  - [群组/线程是否与私信共享上下文？](#do-groupsthreads-share-context-with-dms)
  - [我可以创建多少个工作空间和代理？](#how-many-workspaces-and-agents-can-i-create)
  - [我能否同时运行多个机器人或聊天（例如在 Slack 中），以及如何设置？](#can-i-run-multiple-bots-or-chats-at-the-same-time-slack-and-how-should-i-set-that-up)
- [模型：默认值、选择、别名、切换](#models-defaults-selection-aliases-switching)
  - [什么是“默认模型”？](#what-is-the-default-model)
  - [你推荐使用什么模型？](#what-model-do-you-recommend)
  - [如何在不清除配置的情况下切换模型？](#how-do-i-switch-models-without-wiping-my-config)
  - [我可以使用自托管模型（llama.cpp、vLLM、Ollama）吗？](#can-i-use-selfhosted-models-llamacpp-vllm-ollama)
  - [OpenClaw、Flawd 和 Krill 使用哪些模型？](#what-do-openclaw-flawd-and-krill-use-for-models)
  - [如何在不重启的情况下即时切换模型？](#how-do-i-switch-models-on-the-fly-without-restarting)
  - [我可以将 GPT 5.2 用于日常任务，而将 Codex 5.2 用于编码吗？](#can-i-use-gpt-52-for-daily-tasks-and-codex-52-for-coding)
  - [为什么我看到“模型……不允许”然后就没有回复？](#why-do-i-see-model-is-not-allowed-and-then-no-reply)
  - [为什么我看到“未知模型：minimax/MiniMax-M2.1”？](#why-do-i-see-unknown-model-minimaxminimaxm21)
  - [我可以将 MiniMax 设为默认模型，并在复杂任务中使用 OpenAI吗？](#can-i-use-minimax-as-my-default-and-openai-for-complex-tasks)
  - [opus / sonnet / gpt 是内置快捷方式吗？](#are-opus-sonnet-gpt-builtin-shortcuts)
  - [如何定义/覆盖模型快捷方式（别名）？](#how-do-i-defineoverride-model-shortcuts-aliases)
  - [如何添加来自其他提供商的模型，如 OpenRouter 或 Z.AI？](#how-do-i-add-models-from-other-providers-like-openrouter-or-zai)
- [模型故障转移与“所有模型均失败”](#model-failover-and-all-models-failed)
  - [故障转移是如何工作的？](#how-does-failover-work)
  - [这个错误意味着什么？](#what-does-this-error-mean)
  - [针对 `No credentials found for profile "anthropic:default"` 的修复清单](#fix-checklist-for-no-credentials-found-for-profile-anthropicdefault)
  - [为什么它还尝试了 Google Gemini 并且也失败了？](#why-did-it-also-try-google-gemini-and-fail)
- [身份验证配置文件：它们是什么以及如何管理它们](#auth-profiles-what-they-are-and-how-to-manage-them)
  - [什么是身份验证配置文件？](#what-is-an-auth-profile)
  - [典型的配置文件 ID 是什么？](#what-are-typical-profile-ids)
  - [我可以控制首先尝试哪个身份验证配置文件吗？](#can-i-control-which-auth-profile-is-tried-first)
  - [OAuth 与 API 密钥：两者有何区别？](#oauth-vs-api-key-whats-the-difference)
- [网关：端口、“已在运行”与远程模式](#gateway-ports-already-running-and-remote-mode)
  - [网关使用哪个端口？](#what-port-does-the-gateway-use)
  - [为什么 `openclaw gateway status` 显示 `Runtime: running`，但 `RPC probe: failed` 却显示不同的信息？](#why-does-openclaw-gateway-status-say-runtime-running-but-rpc-probe-failed)
  - [为什么 `openclaw gateway status` 显示的 `Config (cli)` 和 `Config (service)` 不同？](#why-does-openclaw-gateway-status-show-config-cli-and-config-service-different)
  - [“另一个网关实例已经在监听”是什么意思？](#what-does-another-gateway-instance-is-already-listening-mean)
  - [如何在远程模式下运行 OpenClaw（客户端连接到其他地方的网关）？](#how-do-i-run-openclaw-in-remote-mode-client-connects-to-a-gateway-elsewhere)
  - [控制 UI 显示“未经授权”（或不断重新连接）。现在怎么办？](#the-control-ui-says-unauthorized-or-keeps-reconnecting-what-now)
  - [我设置了 `gateway.bind: "tailnet"`，但无法绑定/没有任何服务监听](#i-set-gatewaybind-tailnet-but-it-cant-bind-nothing-listens)
  - [是否可以在同一主机上运行多个网关？](#can-i-run-multiple-gateways-on-the-same-host)
  - [“无效握手”/代码 1008 是什么意思？](#what-does-invalid-handshake-code-1008-mean)
- [日志记录与调试](#logging-and-debugging)
  - [日志存储在何处？](#where-are-logs)
  - [如何启动/停止/重启网关服务？](#how-do-i-startstoprestart-the-gateway-service)
  - [我在 Windows 上关闭了终端——如何重启 OpenClaw？](#i-closed-my-terminal-on-windows-how-do-i-restart-openclaw)
  - [网关已启动，但回复始终不到达。我应该检查什么？](#the-gateway-is-up-but-replies-never-arrive-what-should-i-check)
  - [“与网关断开连接：无原因”——现在怎么办？](#disconnected-from-gateway-no-reason-what-now)
  - [Telegram setMyCommands 因网络错误而失败。我应该检查什么？](#telegram-setmycommands-fails-with-network-errors-what-should-i-check)
  - [TUI 没有任何输出。我应该检查什么？](#tui-shows-no-output-what-should-i-check)
  - [如何完全停止后再启动网关？](#how-do-i-completely-stop-then-start-the-gateway)
  - [ELI5：`openclaw gateway restart` 与 `openclaw gateway` 的区别](#eli5-openclaw-gateway-restart-vs-openclaw-gateway)
  - [当出现问题时，有什么最快的方法可以获得更多信息？](#whats-the-fastest-way-to-get-more-details-when-something-fails)
- [媒体与附件](#media-attachments)
  - [我的技能生成了图片/PDF，但没有发送出去](#my-skill-generated-an-imagepdf-but-nothing-was-sent)
- [安全与访问控制](#security-and-access-control)
  - [将 OpenClaw 对外公开接收私信安全吗？](#is-it-safe-to-expose-openclaw-to-inbound-dms)
  - [提示注入只会影响公共机器人吗？](#is-prompt-injection-only-a-concern-for-public-bots)
  - [我的机器人是否应该有自己的电子邮件 GitHub 贌户或电话号码？](#should-my-bot-have-its-own-email-github-account-or-phone-number)
  - [我可以赋予它自主权来管理我的短信，这样做安全吗？](#can-i-give-it-autonomy-over-my-text-messages-and-is-that-safe)
  - [在个人助理任务中，我可以使用更便宜的模型吗？](#can-i-use-cheaper-models-for-personal-assistant-tasks)
  - [我在 Telegram 中运行了 `/start`，但没有收到配对代码](#i-ran-start-in-telegram-but-didnt-get-a-pairing-code)
  - [WhatsApp：它会给我联系人发消息吗？配对是如何工作的？](#whatsapp-will-it-message-my-contacts-how-does-pairing-work)

## 如果出了问题，前60秒

1) **快速状态（首次检查）**

   ```bash
   openclaw status
   ```

本地快速摘要：操作系统与更新、网关/服务连通性、代理/会话、提供商配置与运行时问题（在网关可访问时）。

2) 可粘贴报告（可安全共享）

   ```bash
   openclaw status --all
   ```

只读诊断，附带日志尾部（已脱敏标记）。

3) **守护进程 + 端口状态**

   ```bash
   openclaw gateway status
   ```

显示主管运行时与RPC可达性、探测目标URL以及服务可能使用的配置。

4) **深度探测**

   ```bash
   openclaw status --deep
   ```

运行网关健康检查和提供商探测（需要可访问的网关）。请参阅[健康](/gateway/health)。

5) **跟踪最新日志**

   ```bash
   openclaw logs --follow
   ```

如果 RPC 停止运行，则回退到：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

文件日志与服务日志是分开的；请参阅[日志记录](/logging)和[故障排除](/gateway/troubleshooting)。

6) **运行医生（修复）**

   ```bash
   openclaw doctor
   ```

修复或迁移配置和状态，并运行健康检查。请参阅[医生](/gateway/doctor)。

7) **网关快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

向运行中的网关请求完整快照（仅限 WebSocket）。请参阅[健康](/gateway/health)。

## 快速入门与首次运行设置

### 我卡住了，有什么最快的办法能让我脱困？

使用一个能够“看见”你本地机器的本地AI代理。这比在Discord上求助高效得多，因为大多数“我卡住了”的问题都是本地配置或环境问题，而远程协助者无法直接检查这些问题。

- **克劳德代码**：https://www.anthropic.com/claude-code/
- **OpenAI Codex**：https://openai.com/codex/

这些工具可以读取代码库、运行命令和检查日志，并帮助你修复机器级设置，例如PATH、服务、权限和认证文件。通过可hack的Git安装方式，为它们提供**完整的源码检出**：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git
```

这将从 Git 检出并安装 OpenClaw，以便代理能够读取代码和文档，并准确推断您正在运行的版本。您随时可以通过不带 `--install-method git` 重新运行安装程序，切换回稳定版本。

提示：请让客服代表逐步规划并监督修复方案，然后仅执行必要的命令。这样可以确保变更幅度小，更易于审计。

如果您发现任何真正的错误或修复，请提交 GitHub 问题或发送拉取请求：
https://github.com/openclaw/openclaw/issues
https://github.com/openclaw/openclaw/pulls

从这些命令开始（寻求帮助时请分享输出）：

```bash
openclaw status
openclaw models status
openclaw doctor
```

他们的工作：

- `openclaw status`: 快速查看网关/代理的运行状况及基本配置。
- `openclaw models status`: 检查提供商身份验证和模型可用性。
- `openclaw doctor`: 验证并修复常见的配置或状态问题。

其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、
`openclaw gateway status`、`openclaw health --verbose`。

快速调试循环：[如果出现问题，前60秒](#first-60-seconds-if-somethings-broken)。
安装文档：[安装](/install)、[安装程序标志](/install/installer)、[更新](/install/updating)。

### 安装和设置 OpenClaw 的推荐方法是什么？

该仓库建议从源代码构建并使用入门向导。

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
openclaw onboard --install-daemon
```

向导还可以自动构建UI资产。完成入门设置后，您通常会在端口**18789**上运行网关。

来自源（贡献者/开发者）：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build # auto-installs UI deps on first run
openclaw onboard
```

如果你还没有进行全局安装，请通过`pnpm openclaw onboard`运行。

### 如何在完成入职后打开仪表板

在完成入门设置后，向导会立即使用带令牌的仪表板URL在您的浏览器中打开页面，并在摘要中打印出包含令牌的完整链接。请务必保持该标签页始终处于打开状态；如果浏览器未自动启动，请在同一台机器上复制并粘贴打印出来的URL。令牌仅存储在您的主机本地，不会从浏览器中获取任何数据。

### 如何在本地主机与远程环境中对仪表板令牌进行身份验证？

**本地主机（同一台机器）：**

- 打开 `http://127.0.0.1:18789/`。
- 如果提示进行身份验证，运行 `openclaw dashboard` 并使用带令牌的链接 (`?token=...`)。
- 该令牌与 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）的值相同，并在首次加载后由 UI 存储。

**不在本地主机上：**

- **Tailscale Serve**（推荐）：保持绑定回环地址，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 是 `true`，则身份标头即可满足认证（无需令牌）。
- **Tailnet 绑定**：运行 `openclaw gateway --bind tailnet --token "<token>"`，打开 `http://<tailscale-ip>:18789/`，并将令牌粘贴到仪表板设置中。
- **SSH 隧道**：先执行 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然后从 `openclaw dashboard` 打开 `http://127.0.0.1:18789/?token=...`。

有关绑定模式和身份验证的详细信息，请参阅[仪表板](/web/dashboard)和[Web界面](/web)。

### 我需要什么运行时？

需要 Node **>= 22**。建议使用 `pnpm`。不建议在网关中使用 Bun。

### 它能在树莓派上运行吗？

是的。Gateway 非常轻量——文档中列出的配置为**512MB至1GB内存**、**1个核心**，以及大约**500MB磁盘空间**，已足以满足个人使用需求。值得注意的是，**树莓派4就能运行它**。

如果您需要额外的可用空间（用于日志、媒体或其他服务），**建议使用2GB**，但这并不是硬性最低要求。

提示：一台小型树莓派或VPS即可托管网关，你还可以在笔记本电脑或手机上配对**节点**，以实现本地屏幕、摄像头、画布访问或命令执行。详情请参阅[节点](/nodes)。

树莓派安装技巧

简而言之：它能用，但可能会有些不完善之处。

- 使用**64位**操作系统，并确保Node版本不低于22。
- 优先选择可深度定制的（Git）安装方式，以便你能够实时查看日志并快速更新。
- 先不加载任何频道或技能启动，然后再逐一添加。
- 如果遇到奇怪的二进制问题，这通常是由**ARM兼容性**引起的。

文档：[Linux](/platforms/linux)，[安装](/install)。

### 它卡住了，唤醒我的朋友引导流程无法启动，现在怎么办？

该屏幕取决于网关可访问且已通过身份验证。TUI 还会在首次启动时自动发送
“醒醒吧，我的朋友！” 如果你看到这一行后面**没有任何回复**，且令牌仍为 0，
则说明代理从未运行过。

1) 重启网关：

```bash
openclaw gateway restart
```

2) 检查状态 + 认证：

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

3) 如果仍然卡住，请运行：

```bash
openclaw doctor
```

如果网关是远程的，请确保隧道或Tailscale连接已建立，并且用户界面指向正确的网关。请参阅[远程访问](/gateway/remote)。

### 我能否在不重新完成入职流程的情况下，将我的设置迁移到新的 Mac mini 上？

是的。复制**状态目录**和**工作区**，然后运行一次“Doctor”。只要同时复制这两个位置，你的机器人就能保持“完全相同”（包括内存、会话历史、身份验证和频道状态）。

1) 在新机器上安装 OpenClaw。
2) 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
3) 复制您的工作区（默认：`~/.openclaw/workspace`）。
4) 运行 `openclaw doctor` 并重启网关服务。

这将保留配置、身份验证配置文件、WhatsApp凭据、会话和内存。如果你处于远程模式，请记住，网关主机负责管理会话存储和工作区。

**重要提示：**如果你只将工作区提交或推送到 GitHub，你备份的是**内存 + 引导文件**，但**不包括**会话历史或身份验证信息。这些数据存储在 `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

相关：[迁移](/install/migrating)，[文件在磁盘上的存储位置](/help/faq#where-does-openclaw-store-its-data)，
[代理工作区](/concepts/agent-workspace)，[医生](/gateway/doctor)，
[远程模式](/gateway/remote)。

### 在最新版本中，我在哪里查看新增功能？

查看 GitHub 更改日志：
https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md

最新条目位于顶部。如果顶部部分标记为“**未发布**”，则下一个带日期的部分即为最新已发布的版本。条目按“**亮点**”、“**变更**”和“**修复**”分组（必要时还包括文档或其他部分）。

### 我无法访问 docs.openclaw.ai，出现 SSL 错误，接下来该怎么办？

某些Comcast/Xfinity连接会通过Xfinity高级安全功能错误地阻止`docs.openclaw.ai`。请将其禁用或将`docs.openclaw.ai`加入白名单，然后重试。更多详情：[故障排除](/help/troubleshooting#docsopenclawai-shows-an-ssl-error-comcastxfinity)。
请通过在此处举报来帮助我们解除封锁：https://spa.xfinity.com/check_url_status.

如果您仍然无法访问该站点，文档已在 GitHub 上镜像：
https://github.com/openclaw/openclaw/tree/main/docs

### 稳定版和测试版有什么区别？

**Stable** 和 **beta** 是 **npm 分发标签**，而不是单独的代码行：

- `latest` = 稳定版
- `beta` = 用于测试的早期版本

我们先将构建版本发送至**测试版**进行测试。待某个构建版本稳定可靠后，我们会将**同一版本提升至`latest`**。这就是为什么测试版和稳定版可以指向**同一个版本**。

查看变更内容：  
https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md

### 如何安装测试版？测试版和开发版有什么区别？

**Beta** 是 npm 的 dist‑tag `beta`（可能匹配 `latest`）。  
**Dev** 是 `main`（Git）的移动主干；发布时，它使用 npm 的 dist‑tag `dev`。

单行命令（macOS/Linux）：

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.bot/install.sh | bash -s -- --beta
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.bot/install.sh | bash -s -- --install-method git
```

Windows 安装程序（PowerShell）：
https://openclaw.ai/install.ps1

更多详情：[开发渠道](/install/development-channels)和[安装程序标志](/install/installer)。

### 安装和入职通常需要多长时间？

粗略指南：

- **安装**：2–5分钟
- **入职引导**：5–15分钟，具体时长取决于您配置的渠道和模型数量

如果卡住了，请使用[安装程序卡住](/help/faq#installer-stuck-how-do-i-get-more-feedback)，
并参阅[我卡住了](/help/faq#im-stuck--whats-the-fastest-way-to-get-unstuck)中的快速调试循环。

### 如何试用最新版本？

两个选项：

1) **开发者通道（Git检出）：**

```bash
openclaw update --channel dev
```

这会切换到`main`分支并从源更新。

2) **可被黑客入侵的安装（来自安装程序网站）：**

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git
```

这会为你提供一个本地仓库，你可以对其进行编辑，然后通过 Git 进行更新。

如果您更喜欢手动进行干净的克隆，请使用：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
```

文档：[更新](/cli/update)，[开发渠道](/install/development-channels)，
[安装](/install)。

### 安装程序卡住，如何获取更多反馈？

使用**详细输出**重新运行安装程序：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --verbose
```

带有详细输出的 Beta 安装：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --beta --verbose
```

对于可能遭受黑客攻击的（git）安装：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git --verbose
```

更多选项：[安装程序标志](/install/installer)。

__HEADING_0__Windows安装提示未找到Git或未识别OpenCLAW

两个常见的Windows问题：

**1) npm错误：无法找到git或git未在路径中**

- 安装**Git for Windows**，并确保`git`已添加到您的PATH中。
- 关闭并重新打开PowerShell，然后再次运行安装程序。

**2) 安装后无法识别 OpenCLaw**

- 您的 npm 全局 bin 文件夹尚未添加到 PATH 中。
- 请检查路径：

  ```powershell
  npm config get prefix
  ```

- 确保`<prefix>\\bin`位于PATH中（在大多数系统上，它就是`%AppData%\\npm`）。
- 更新PATH后，请关闭并重新打开PowerShell。

如果你想获得最流畅的 Windows 设置，请使用**WSL2**，而不是原生 Windows。
文档：[Windows](/platforms/windows)。

### 文档没有解答我的问题，我怎样才能得到更满意的答案？

采用可hack的（Git）安装方式，在本地获取完整的源代码和文档，然后从该文件夹中向你的机器人（或Claude/Codex）提问。这样一来，它就能读取整个仓库，从而给出更精准的回答。

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git
```

更多详情：[安装](/install)和[安装程序标志](/install/installer)。

### 如何在 Linux 上安装 OpenClaw

简而言之：先按照 Linux 指南操作，然后运行入职向导。

- Linux快速路径 + 服务安装：[Linux](/platforms/linux)。
- 完整操作指南：[入门](/start/getting-started)。
- 安装程序 + 更新：[安装与更新](/install/updating)。

### 如何在VPS上安装OpenClaw

任何 Linux VPS 都可以使用。在服务器上完成安装后，通过 SSH 或 Tailscale 连接到网关。

指南：[exe.dev](/platforms/exe-dev)、[Hetzner](/platforms/hetzner)、[Fly.io](/platforms/fly)。  
远程访问：[Gateway 远程](/gateway/remote)。

### 云VPS安装指南在哪里？

我们维护了一个包含常用服务商的**托管中心**。选择一个并按照指南操作：

- [VPS托管](/vps)（一站式汇集所有服务商）
- [Fly.io](/platforms/fly)
- [Hetzner](/platforms/hetzner)
- [exe.dev](/platforms/exe-dev)

云端的工作原理：**网关在服务器上运行**，您可以通过控制界面（或 Tailscale/SSH）从笔记本电脑或手机访问它。您的状态和工作区都存储在服务器上，因此请将主机视为权威数据源，并定期进行备份。

您可以将**节点**（Mac/iOS/Android/无头）与该云网关配对，以访问本地屏幕、摄像头或画布；或者在云端保留网关的同时，在笔记本电脑上运行命令。

中枢：[平台](/platforms)。远程访问：[网关远程](/gateway/remote)。
节点：[节点](/nodes)，[节点 CLI](/cli/nodes)。

### 我可以要求 OpenClaw 自动更新吗？

简短回答：**可行，但不推荐**。更新流程可能会重启网关（从而中断当前会话），可能需要执行干净的 Git 检出，并且可能会提示确认。更安全的做法是：由运维人员在 shell 中手动运行更新。

使用命令行界面：

```bash
openclaw update
openclaw update status
openclaw update --channel stable|beta|dev
openclaw update --tag <dist-tag|version>
openclaw update --no-restart
```

如果你必须通过代理进行自动化：

```bash
openclaw update --yes --no-restart
openclaw gateway restart
```

文档：[已更新](/cli/update)，[正在更新](/install/updating)。

### 入门向导究竟做什么？

`openclaw onboard` 是推荐的设置路径。在**本地模式**下，它会引导您完成以下步骤：

- **模型/身份验证设置**（建议为 Claude 订阅使用 Anthropic 的 **setup-token**；支持 OpenAI Codex OAuth，API 密钥为可选配置；支持 LM Studio 本地模型）
- 工作区位置与引导文件
- **网关设置**（包括绑定地址、端口、身份验证以及 Tailscale 配置）
- **服务商**（WhatsApp、Telegram、Discord、Mattermost（插件）、Signal、iMessage）
- **守护进程安装**（在 macOS 上使用 LaunchAgent；在 Linux/WSL2 上使用 systemd 用户单元）
- 健康检查与技能选择

如果您配置的模型未知或缺少身份验证，它也会发出警告。

### 我需要订阅Claude或OpenAI才能运行这个吗？

不，你可以使用来自Anthropic、OpenAI或其他提供商的**API密钥**，或者仅在本地运行的模型来运行OpenClaw，从而确保你的数据始终保存在本地设备上。订阅服务（如Claude Pro/Max或OpenAI Codex）只是用于认证这些提供商的一种可选方式。

文档：[Anthropic](/providers/anthropic)，[OpenAI](/providers/openai)，
[本地模型](/gateway/local-models)，[模型](/concepts/models)。

### 我可以在没有API密钥的情况下使用Claude Max订阅吗？

是的，您可以使用**设置令牌**进行身份验证，而不是使用 API 密钥。这是订阅路径。

Claude Pro/Max 订阅**不包含 API 密钥**，因此这是订阅账户的正确用法。重要提示：您必须向 Anthropic 证明，根据其订阅政策和条款，这种用法是被允许的。如果您希望采用最明确且官方支持的方式，请使用 Anthropic 的官方 API 密钥。

__HEADING_0__Anthropic如何设置令牌身份验证？

`claude setup-token` 通过 Claude Code CLI 生成一个**令牌字符串**（在网页控制台中不可用）。您可以在**任何机器**上运行它。在向导中选择“Anthropic 令牌（粘贴 setup-token）”，或使用 `openclaw models auth paste-token --provider anthropic` 直接粘贴。该令牌会作为 **anthropic** 提供者的身份验证配置文件存储，并像 API 密钥一样使用（不支持自动刷新）。更多详情：[OAuth](/concepts/oauth)。

### 我在哪里可以找到Anthropic的设置令牌？

它**不在**Anthropic控制台中。setup-token是由**Claude Code CLI**在**任何机器上**生成的：

```bash
claude setup-token
```

复制其输出的令牌，然后在向导中选择**Anthropic 令牌（粘贴 setup-token）**。如果要在网关主机上运行，请使用 `openclaw models auth setup-token --provider anthropic`。如果您已在其他位置运行过 `claude setup-token`，请将其粘贴到网关主机上，并使用 `openclaw models auth paste-token --provider anthropic`。请参阅 [Anthropic](/providers/anthropic)。

### 您是否支持Claude订阅认证（Claude Pro/Max）？

是的——通过**setup-token**实现。OpenClaw不再复用Claude Code CLI的OAuth令牌；请使用setup-token或Anthropic API密钥。您可以在任何地方生成该令牌，然后将其粘贴到网关主机上。有关详细信息，请参阅[Anthropic](/providers/anthropic)和[OAuth](/concepts/oauth)。

注意：Claude 订阅访问受 Anthropic 条款的约束。对于生产环境或多用户工作负载，API 密钥通常是更安全的选择。

### 为什么我会从Anthropic收到HTTP 429速率限制错误？

这意味着在当前时间窗口内，您的**Anthropic配额/速率限制**已用尽。如果您使用的是**Claude订阅**（通过 setup‑token 或 Claude Code OAuth），请等待时间窗口重置或升级您的方案。如果您使用的是**Anthropic API密钥**，请前往 Anthropic 控制台查看用量和账单，并根据需要提高限额。

提示：设置一个**回退模型**，以便在某个提供商受到速率限制时，OpenClaw仍能继续回复。
请参阅[模型](/cli/models)和[OAuth](/concepts/oauth)。

__HEADING_0__AWS Bedrock是否受支持？

是的——通过 pi‑ai 的 **Amazon Bedrock（Converse）** 提供程序并采用**手动配置**实现。您必须在网关主机上提供 AWS 凭证和区域，并在模型配置中添加一个 Bedrock 提供程序条目。请参阅 [Amazon Bedrock](/bedrock) 和 [模型提供商](/providers/models)。如果您更倾向于使用托管密钥流程，在 Bedrock 前部署一个与 OpenAI 兼容的代理仍然是一个可行的选择。

__HEADING_0__Codex认证的工作原理

OpenClaw通过OAuth（ChatGPT登录）支持**OpenAI Code (Codex)**。向导可以执行OAuth流程，并在适当的情况下将默认模型设置为`openai-codex/gpt-5.2`。请参阅[模型提供商](/concepts/model-providers)和[向导](/start/wizard)。

### 您是否支持 OpenAI 订阅认证 Codex OAuth？

是的，OpenClaw完全支持**OpenAI Code（Codex）订阅 OAuth**。入门指南可以为您自动完成OAuth流程。

请参阅[OAuth](/concepts/oauth)、[模型提供商](/concepts/model-providers)和[向导](/start/wizard)。

### 如何设置 Gemini CLI OAuth

Gemini CLI 使用**插件身份验证流程**，而不是`openclaw.json`中的客户端ID或密钥。

步骤：
1) 启用插件：`openclaw plugins enable google-gemini-cli-auth`
2) 登录：`openclaw models auth login --provider google-gemini-cli --set-default`

这会将 OAuth 令牌存储在网关主机上的身份验证配置文件中。详情：[模型提供商](/concepts/model-providers)。

本地模型适合用于日常聊天吗？

通常不行。OpenClaw需要大上下文和强大的安全性；小模型容易截断内容并导致信息泄露。如果你别无选择，可以在本地（使用 LM Studio）运行你能使用的__最大__MiniMax M2.1 构建版本，并参阅[网关/本地模型](/gateway/local-models)。较小或经过量化的模型会显著增加提示注入风险——详情请参阅[安全](/gateway/security)。

### 如何将托管模型流量限制在特定区域？

选择区域锁定的端点。OpenRouter为MiniMax、Kimi和GLM提供了托管在美国的选项；选择美国托管版本可确保数据保留在本地区域。您仍然可以通过使用 `models.mode: "merge"` 将Anthropic/OpenAI与这些模型并列列出，从而在尊重您所选区域提供商的同时，仍保留后备选项以备不时之需。

### 我必须买一台 Mac Mini 才能安装这个吗？

不，OpenClaw 可以在 macOS 或 Linux 上运行（在 Windows 上则通过 WSL2 运行）。Mac mini 是可选的——有些人会购买一台 Mac mini 作为始终在线的主机，但小型 VPS、家用服务器或树莓派级别的设备同样适用。

你只需一台 Mac 即可使用仅适用于 macOS 的工具。对于 iMessage，你可以将 Gateway 保留在 Linux 上，
并通过 SSH 在任何 Mac 上运行 `imsg`，只需将 `channels.imessage.cliPath` 指向一个 SSH 封装程序即可。
如果你需要其他仅适用于 macOS 的工具，请在 Mac 上运行 Gateway，或配对一个 macOS 节点。

文档：[iMessage](/channels/imessage)、[节点](/nodes)、[Mac远程模式](/platforms/mac/remote)。

### 我需要一台 Mac mini 才能使用 iMessage 吗？

你需要一台已登录“信息”的**macOS 设备**。这**不**一定是 Mac mini——任何 Mac 都可以。OpenClaw 的 iMessage 集成在 macOS 上运行（使用 BlueBubbles 或 `imsg`），而网关则可以在其他平台上运行。

常见设置：

- 在Linux/VPS上运行网关，并将`channels.imessage.cliPath`指向一个SSH封装程序，该程序…

在Mac上运行`imsg`。

- 如果你想要最简单的单机设置，就直接在Mac上运行所有内容。

文档：[iMessage](/channels/imessage)、[BlueBubbles](/channels/bluebubbles)、[Mac远程模式](/platforms/mac/remote)。

### 如果我买一台 Mac mini 来运行 OpenClaw，可以把它连接到我的 MacBook Pro 吗？

是的，**Mac mini 可以运行网关**，而您的 MacBook Pro 可以作为**节点**（配套设备）连接。节点本身并不运行网关——它们通过该设备提供额外功能，例如屏幕、摄像头、画布以及`system.run`。

常见模式：

- Mac mini 上的网关（始终开启）。
- MacBook Pro 运行 macOS 应用或节点主机，并与网关配对。
- 使用 `openclaw nodes status` / `openclaw nodes list` 查看。

文档：[节点](/nodes)，[节点 CLI](/cli/nodes)。

### 我可以使用Bun吗？

不建议使用 Bun。我们发现，Bun 在运行时容易出错，尤其是在使用 WhatsApp 和 Telegram 时。
请使用 Node 构建稳定的网关。

如果你仍想尝试使用Bun，请在不含WhatsApp/Telegram的非生产网关上进行实验。

__HEADING_0__Telegram允许哪些内容？

`channels.telegram.allowFrom` 是**人类发送者的 Telegram 用户 ID**（数字形式，推荐使用）或 `@username`。它不是机器人用户名。

更安全（无第三方机器人）：

- 私信你的机器人，然后运行 `openclaw logs --follow` 并阅读 `from.id`。

官方机器人API：

- 私信你的机器人，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

第三方（隐私性较低）：

- 发DM `@userinfobot` 或 `@getidsbot`。

请参阅 [/channels/telegram](/channels/telegram#access-control-dms--groups)。

### 多人能否在不同的 OpenClaw 实例中使用同一个 WhatsApp 号码？

是的，可以通过**多代理路由**实现。将每个发送者的 WhatsApp **私信**（对等方 `kind: "dm"`，发送者 E.164 为 `+15551234567`）绑定到不同的 `agentId`，这样每个人都有自己独立的工作空间和会话存储。回复仍然来自**同一个 WhatsApp 账号》，且私信访问控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）在 WhatsApp 账号层面是全局生效的。请参阅 [多代理路由](/concepts/multi-agent) 和 [WhatsApp](/channels/whatsapp)。

### 我可以同时运行一个快速聊天代理和一个用于编码的Opus代理吗？

是的。使用多代理路由：为每个代理分配其自己的默认模型，然后将入站路由（提供商账户或特定对等方）绑定到相应代理。示例配置位于[多代理路由](/concepts/multi-agent)中。另请参阅[模型](/concepts/models)和[配置](/gateway/configuration)。

__HEADING_0__Homebrew在Linux上可用吗？

是的。Homebrew 支持 Linux（Linuxbrew）。快速设置：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install <formula>
```

如果您通过systemd运行OpenClaw，请确保服务的PATH包含`/home/linuxbrew/.linuxbrew/bin`（或您的brew前缀），以便在非登录Shell中正确解析由`brew`安装的工具。
最近的构建版本还会在Linux systemd服务中将常见的用户bin目录添加到PATH的开头（例如`~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），并在设置时尊重`PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR`和`FNM_DIR`。

### 可被黑客攻击的 Git 安装与 npm 安装有何区别？

- **可hack的（Git）安装：** 完整源代码检出，可编辑，最适合贡献者。

你在本地运行构建，并可以修补代码或文档。

- **npm install：** 全局安装 CLI，无需仓库，最适合“直接运行”。

更新来自 npm 的 dist 标签。

文档：[入门](/start/getting-started)，[更新](/install/updating)。

### 我以后可以在 npm 安装和 Git 安装之间切换吗？

是的。先安装另一种版本，然后运行“Doctor”命令，以便网关服务指向新的入口点。
这**不会删除您的数据**——它只更改 OpenClaw 代码的安装。您的状态
(`~/.openclaw`) 和工作区 (`~/.openclaw/workspace`) 将保持不变。

从 npm 到 git：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
openclaw doctor
openclaw gateway restart
```

从 Git 到 npm：

```bash
npm install -g openclaw@latest
openclaw doctor
openclaw gateway restart
```

医生检测到网关服务入口点不匹配，并提供重写服务配置以与当前安装保持一致的选项（在自动化中使用 `--repair`）。

备份提示：请参阅[备份策略](/help/faq#whats-the-recommended-backup-strategy)。

### 我应该在笔记本电脑上运行网关，还是在VPS上运行？

简而言之：**如果你需要全天候稳定运行，就使用VPS**。如果你希望上手门槛最低且能接受休眠或重启，那就选择在本地运行。

**笔记本电脑（本地网关）**

- **优点：** 无需服务器成本，可直接访问本地文件，浏览器窗口始终实时可用。
- **缺点：** 睡眠或网络中断会导致连接断开，操作系统更新或重启会中断连接，设备必须始终保持在线。

**虚拟专用服务器 / 云**

- **优点：** 始终在线、网络稳定、不存在笔记本电脑睡眠问题、更易于持续运行。
- **缺点：** 经常以无头模式运行（使用截图）、仅支持远程文件访问、必须通过SSH进行更新。

**OpenClaw专用说明：** WhatsApp、Telegram、Slack、Mattermost（插件）和 Discord 都可在VPS上正常运行。唯一的实际权衡在于使用**无头浏览器**还是可见窗口。详情请参阅[浏览器](/tools/browser)。

**推荐默认设置：** 如果你之前遇到过网关断连问题，建议选择VPS。如果你正在积极使用Mac，并希望在本地访问文件或通过可见浏览器实现UI自动化，那么本地模式是理想之选。

### 在专用机器上运行 OpenClaw 有多重要？

并非必需，但**为确保可靠性和隔离性而推荐使用**。

- **专用主机（VPS/Mac mini/Raspberry Pi）：** 始终在线，因睡眠或重启导致的中断更少，权限管理更加清晰，更有利于长期稳定运行。
- **共享笔记本电脑/台式机：** 用于测试和日常使用完全没问题，但在设备进入睡眠状态或执行系统更新时可能会出现短暂暂停。

如果你想兼得两全其美，可以将网关部署在专用主机上，并将你的笔记本电脑配置为本地屏幕/摄像头/执行工具的**节点**。请参阅[节点](/nodes)。
有关安全指导，请阅读[安全](/gateway/security)。

__HEADING_0__VPS的最低配置要求和推荐操作系统是什么？

OpenClaw 体积轻巧。对于一个基本网关加一个聊天频道：

- **最低配置：** 1个vCPU、1 GB内存、约500 MB磁盘空间。
- **推荐配置：** 1至2个vCPU、2 GB或更多内存，以预留充足资源（用于日志、媒体和多渠道）。节点工具和浏览器自动化可能需要占用大量资源。

操作系统：使用**Ubuntu LTS**（或任何现代Debian/Ubuntu发行版）。建议在该系统上测试Linux安装路径。

文档：[Linux](/platforms/linux)，[VPS托管](/vps)。

### 我可以在虚拟机中运行 OpenClaw 吗？有哪些要求？

是的，可以将虚拟机视为与VPS相同：它必须始终处于运行状态、可访问，并为网关以及您启用的所有通道提供足够的内存。

基线指南：

- **最低配置：** 1 vCPU，1 GB 内存。
- **推荐配置：** 如果您运行多个频道、浏览器自动化或媒体工具，建议使用 2 GB 或更多内存。
- **操作系统：** Ubuntu LTS 或其他现代 Debian/Ubuntu 发行版。

如果你使用的是Windows，**WSL2是设置虚拟机最简单的方式**，并且在工具兼容性方面表现最佳。请参阅[Windows](/platforms/windows)和[VPS托管](/vps)。如果你在虚拟机中运行macOS，请参阅[macOS虚拟机](/platforms/macos-vm)。

## 什么是OpenClaw？

__HEADING_0__OpenClaw是一种用于自动化和优化复杂任务的开源工具或平台。

OpenClaw是一款可在您自有设备上运行的个人AI助手。它依托您已使用的各类消息平台（WhatsApp、Telegram、Slack、Mattermost（插件）、Discord、Google Chat、Signal、iMessage、WebChat）提供响应，并在受支持的平台上还支持语音交互以及实时画布功能。其中，“网关”是始终在线的控制平面，而助手则是最终产品。

### 什么是价值主张？

OpenClaw远不止是一个简单的Claude封装。它是一个**本地优先的控制平面**，使你能够在**自己的硬件上运行功能强大的助手**，并通过你已使用的聊天应用访问该助手。同时，它支持有状态会话、记忆和工具——而无需将工作流的控制权拱手让给托管的SaaS平台。

亮点：

- **你的设备，你的数据：** 随时在你想要的地方运行网关（Mac、Linux、VPS），并保持…

工作区 + 会话历史记录本地。

- **真实渠道，而非网络沙盒：** WhatsApp、Telegram、Slack、Discord、Signal、iMessage等。

以及在支持的平台上提供的移动语音和Canvas。

- **与模型无关：** 支持Anthropic、OpenAI、MiniMax、OpenRouter等，并为每个智能体单独路由。

以及故障转移。

- **仅本地选项：**运行本地模型，让您在需要时能够确保**所有数据都保留在您的设备上**。
- **多智能体路由：**为每个渠道、账户或任务分配独立的智能体，每个智能体都拥有自己的…

工作区和默认设置。

- **开源且可自定义：** 无需担心供应商锁定，您可以查看、扩展并自行托管。

文档：[网关](/gateway)，[渠道](/channels)，[多智能体](/concepts/multi-agent)，
[记忆](/concepts/memory)。

### 我刚设置好，我该先做什么？

不错的入门项目：

- 搭建一个网站（使用WordPress、Shopify或简单的静态网站）。
- 构建移动应用原型（包括线框图、界面设计和API方案）。
- 整理文件和文件夹（清理、命名、添加标签）。
- 将Gmail与自动化工具连接，实现摘要自动生成或后续跟进自动化。

它可以处理大型任务，但为了取得最佳效果，最好将任务分解为多个阶段，并使用子代理进行并行处理。

__HEADING_0__OpenClaw的五大日常用例是什么？

日常的小胜利通常表现为：

- **个人简报：** 汇总您关注的收件箱、日历和新闻。
- **研究与草稿撰写：** 快速完成研究、生成摘要，并为电子邮件或文档起草初稿。
- **提醒与跟进：** 基于 Cron 或心跳机制的定时提醒和检查清单。
- **浏览器自动化：** 自动填写表单、收集数据并重复执行网页任务。
- **跨设备协同：** 从手机发送一项任务，让网关在服务器上运行该任务，然后将结果直接返回到聊天中。

__HEADING_0__OpenClaw能否帮助SaaS公司制作潜在客户开发推广广告和博客？

是的，它适用于**研究、资质评估和文案撰写**。它可以扫描目标网站、建立候选名单、汇总潜在客户，并撰写外联或广告文案初稿。

对于**外展或广告投放**，务必始终由人工参与把关。避免发送垃圾信息，严格遵守当地法律法规和平台政策，并在发送任何内容之前仔细审核。最安全的做法是让OpenClaw负责起草文案，由您最终审批。

文档：[安全](/gateway/security)。

与Claude Code相比，Web开发有哪些优势？

OpenClaw是一个**个人助理**和协调层，而非IDE的替代品。如需在代码库中实现最快捷的直接编码循环，请使用Claude Code或Codex。如果您需要持久化存储、跨设备访问以及工具编排，则应使用OpenClaw。

优势：

- 跨会话的**持久化内存 + 工作空间**
- **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
- **工具编排**（浏览器、文件、调度、钩子）
- **始终在线的网关**（在VPS上运行，可从任何地点交互）
- 用于本地浏览器/屏幕/摄像头/执行的**节点**

展示：https://openclaw.ai/showcase

## 技能与自动化

### 如何在不污染仓库的情况下自定义技能？

请使用托管覆盖来替代直接编辑仓库副本。将您的更改放入 `~/.openclaw/skills/<name>/SKILL.md` 中（或通过 `skills.load.extraDirs` 在 `~/.openclaw/openclaw.json` 中添加一个文件夹）。优先级顺序为：`<workspace>/skills` > `~/.openclaw/skills` > 内置，因此托管覆盖无需修改 Git 即可生效并优先应用。只有值得合入上游的更改才应保留在仓库中，并作为拉取请求提交出去。

### 我可以从自定义文件夹加载技能吗？

是的。通过`skills.load.extraDirs`在`~/.openclaw/openclaw.json`中添加额外的目录（优先级最低）。默认优先级保持为：`<workspace>/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。默认情况下，`clawhub` 会安装到 `./skills`，而 OpenClaw 将其视为 `<workspace>/skills`。

### 如何为不同任务使用不同的模型？

目前支持的模式是：

- **Cron 作业**：隔离的作业可以为每个作业设置一个`model`覆盖。
- **子代理**：将任务路由到使用不同默认模型的独立代理。
- **按需切换**：使用`/model` 可随时切换当前会话的模型。

请参阅[定时任务](/automation/cron-jobs)、[多代理路由](/concepts/multi-agent)和[斜杠命令](/tools/slash-commands)。

### 机器人在执行繁重任务时卡住了，我该如何分流这些工作？

对于耗时较长或可并行执行的任务，请使用**子代理**。子代理在独立的会话中运行，返回任务摘要，并确保你的主聊天始终保持响应。

让您的机器人“为此任务生成一个子代理”，或使用`/subagents`。
在聊天中使用`/status`，查看网关当前正在执行的操作（以及它是否繁忙）。

令牌提示：长时间运行的任务和子代理都会消耗令牌。如果成本是个问题，可以通过 `agents.defaults.subagents.model` 为子代理设置更便宜的模型。

文档：[子代理](/tools/subagents)。

### 定时任务或提醒未触发，我该检查什么？

Cron 在网关进程中运行。如果网关未持续运行，计划任务将不会执行。

清单：

- 确认已启用 cron（`cron.enabled`），且未设置 `OPENCLAW_SKIP_CRON`。
- 检查网关是否全天候运行（无休眠或重启）。
- 验证作业的时区设置（`--tz` 与主机时区对比）。

调试：

```bash
openclaw cron run <jobId> --force
openclaw cron runs --id <jobId> --limit 50
```

文档：[Cron 作业](/automation/cron-jobs)，[Cron 与 Heartbeat](/automation/cron-vs-heartbeat)。

### 如何在 Linux 上安装技能？

使用 **ClawHub**（CLI）或将技能拖放到您的工作区中。macOS Skills 界面在 Linux 上不可用。
在 https://clawhub.com. 浏览技能

安装 ClawHub CLI（选择一个包管理器）：

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

__HEADING_0__OpenClaw能否按计划或在后台持续运行任务？

是的。使用网关调度器：

- 用于计划任务或重复任务的**Cron 作业**（在重启后仍保持有效）。
- 用于“主会话”定期检查的**心跳机制**。
- 用于自主代理的**隔离作业**，这些代理会发布摘要或将内容传递到聊天中。

文档：[Cron 作业](/automation/cron-jobs)，[Cron 与 Heartbeat](/automation/cron-vs-heartbeat)，[Heartbeat](/gateway/heartbeat)。

**我能否在 Linux 上运行仅适用于 Apple macOS 的技能？**

并非直接如此。macOS 上的技能受到 `metadata.openclaw.os` 以及所需二进制文件的限制，并且只有当技能在**网关主机**上具备资格时，才会显示在系统提示中。在 Linux 上，仅适用于 `darwin` 的技能（如 `imsg`、`apple-notes`、`apple-reminders`）除非你明确覆盖相关限制，否则将无法加载。

你有三种支持的模式：

**选项A——在Mac上运行网关（最简单）。**  
在已安装macOS二进制文件的Mac上运行网关，然后从Linux以[远程模式](#how-do-i-run-openclaw-in-remote-mode-client-connects-to-a-gateway-elsewhere)连接，或通过Tailscale进行连接。由于网关主机运行的是macOS，相关技能加载过程将正常进行。

**选项B——使用macOS节点（无需SSH）。**  
在Linux上运行网关，并配对一个macOS节点（作为菜单栏应用程序），然后在Mac上将“节点运行命令”设置为“始终询问”或“始终允许”。只要节点上安装了所需的二进制文件，OpenClaw就能将仅适用于macOS的技能视为有效技能。代理会通过`nodes`工具来运行这些技能。如果你选择“始终询问”，只需在系统提示中批准“始终允许”，即可将该命令添加到允许列表中。

**选项C——通过SSH代理macOS二进制文件（高级）。**  
将网关保留在Linux上，但让所需的CLI二进制文件解析为在Mac上运行的SSH封装程序。然后覆盖该技能，以允许Linux访问，从而确保其仍符合资格。

1) 为二进制文件创建一个 SSH 包装器（示例：`imsg`）：

   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   exec ssh -T user@mac-host /opt/homebrew/bin/imsg "$@"
   ```

2) 在 Linux 主机上将包装器应用于 `PATH`（例如 `~/bin/imsg`）。
3) 覆盖技能元数据（工作区或 `~/.openclaw/skills`），以允许 Linux：

   ```markdown
   ---
   name: imsg
   description: iMessage/SMS CLI for listing chats, history, watch, and sending.
   metadata: {"openclaw":{"os":["darwin","linux"],"requires":{"bins":["imsg"]}}}
   ---
   ```

4) 启动一个新会话，以便刷新技能快照。

对于 iMessage，你还可以将 `channels.imessage.cliPath` 指向一个 SSH 包装器（OpenClaw 仅需要 stdio）。请参阅 [iMessage](/channels/imessage)。

### 你们有Notion或HeyGen集成吗？

目前未内置。

选项：

- **自定义技能/插件：** 是获取可靠API访问的最佳选择（Notion和HeyGen都提供API）。
- **浏览器自动化：** 无需编写代码即可运行，但速度较慢且稳定性较差。

如果你想为每个客户（代理工作流）保留上下文，一种简单的模式是：

- 为每位客户创建一个Notion页面，其中包含背景信息、偏好设置和当前正在进行的工作。
- 在会话开始时，要求客服人员调取该页面。

如果你想实现原生集成，请提交功能请求或为这些API构建技能。

安装技能：

```bash
clawhub install <skill-slug>
clawhub update --all
```

ClawHub 会安装到您当前目录下的 `./skills`（如果无法找到，则回退到您配置的 OpenClaw 工作区）；在下一次会话中，OpenClaw 会将该目录视为 `<workspace>/skills`。对于需要在不同代理之间共享的技能，请将其放置在 `~/.openclaw/skills/<name>/SKILL.md` 中。某些技能依赖于通过 Homebrew 安装的二进制文件；在 Linux 上，这意味着使用 Linuxbrew（请参阅上方的 Homebrew Linux 常见问题解答）。更多信息请参阅 [技能](/tools/skills) 和 [ClawHub](/tools/clawhub)。

### 如何安装用于接管浏览器的 Chrome 扩展？

使用内置安装程序，然后在 Chrome 中加载解压后的扩展：

```bash
openclaw browser extension install
openclaw browser extension path
```

然后，打开 Chrome → `chrome://extensions` → 启用“开发者模式”→“加载已解压扩展程序”→选择该文件夹。

完整指南（包括远程网关和安全注意事项）：[Chrome 扩展](/tools/chrome-extension)

如果网关与 Chrome 运行在同一台机器上（默认设置），您通常**不需要**任何额外配置。
如果网关运行在其他位置，请在浏览器所在的机器上运行一个节点主机，以便网关能够代理浏览器操作。
您仍然需要在想要控制的标签页上手动点击扩展程序按钮（它不会自动附加）。

## 沙箱与内存

### 是否有专门的沙箱文档？

是的。请参阅[沙箱化](/gateway/sandboxing)。有关 Docker 特定的设置（在 Docker 中使用完整网关或沙箱镜像），请参阅[Docker](/install/docker)。

**我能否让私信保持私密，但将群组设为由单个代理沙盒化的公开环境？**

是的——如果你的私域流量是**私信**，而你的公域流量是**群组**。

使用 `agents.defaults.sandbox.mode: "non-main"` 使群组/频道会话（非主密钥）在 Docker 中运行，而主私信会话保留在主机上。然后通过 `tools.sandbox.tools` 限制沙盒会话中可用的工具。

设置演练 + 示例配置：[群组：个人私信 + 公共群组](/concepts/groups#pattern-personal-dms-public-groups-single-agent)

关键配置参考：[网关配置](/gateway/configuration#agentsdefaultssandbox)

### 如何将主机文件夹挂载到沙盒中？

将`agents.defaults.sandbox.docker.binds`设置为`["host:path:mode"]`（例如，`"/home/user/src:/src:ro"`）。全局绑定与每代理绑定会合并；当`scope: "shared"`时，每代理绑定将被忽略。对于任何敏感操作，请使用`:ro`，并请注意绑定会绕过沙箱文件系统隔离墙。有关示例和安全注意事项，请参阅[沙箱](/gateway/sandboxing#custom-bind-mounts)和[沙箱 vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

### 记忆是如何工作的？

OpenClaw内存只是代理工作区中的Markdown文件：

- 每日笔记在`memory/YYYY-MM-DD.md`中
- 精选的长期笔记在`MEMORY.md`中（仅限主会话/私人会话）

OpenClaw还会执行一项**静默的预压缩内存刷新**，以提醒模型在自动压缩之前写入持久化记录。此操作仅在工作区可写时运行（只读沙盒会跳过它）。详情请参阅[内存](/concepts/memory)。

### 记忆总是忘事，我该如何让它更牢固？

让机器人**将事实写入记忆**。长期笔记应存放在`MEMORY.md`中，
短期上下文则放入`memory/YYYY-MM-DD.md`中。

这仍然是我们正在改进的领域。提醒模型存储记忆大有帮助，这样它就能清楚地知道该怎么做。如果它仍然频繁遗忘，请确保网关在每次运行时都使用同一个工作区。

文档：[内存](/concepts/memory)，[代理工作区](/concepts/agent-workspace)。

### 进行语义记忆搜索是否需要OpenAI API密钥？

仅适用于您使用**OpenAI嵌入**的情况。Codex OAuth仅涵盖聊天和补全功能，**不**提供嵌入访问权限，因此**使用Codex登录（通过OAuth或Codex CLI登录）**无助于语义记忆搜索。OpenAI嵌入仍需要有效的API密钥（`OPENAI_API_KEY`或`models.providers.openai.apiKey`）。

如果您未显式设置提供商，OpenClaw 会在能够解析 API 密钥（通过身份验证配置文件、`models.providers.*.apiKey` 或环境变量）时自动选择一个提供商。如果可以解析 OpenAI 密钥，它会优先使用 OpenAI；否则，如果可以解析 Gemini 密钥，则优先使用 Gemini。如果两种密钥都不可用，内存搜索将保持禁用状态，直到您进行配置。如果您已配置并提供了本地模型路径，OpenClaw 会优先使用 `local`。

如果您更倾向于使用本地模型，请设置 `memorySearch.provider = "local"`（并可选地设置
`memorySearch.fallback = "none"`）。如果您需要 Gemini 嵌入，请设置
`memorySearch.provider = "gemini"` 并提供 `GEMINI_API_KEY`（或
`memorySearch.remote.apiKey`）。我们支持**OpenAI、Gemini 或本地**嵌入模型——有关设置详情，请参阅 [内存](/concepts/memory)。

记忆会永远持续吗？有哪些局限？

内存文件存储在磁盘上，会一直保留，直到你将其删除。限制因素是你的存储空间，而不是模型本身。**会话上下文**仍然受模型上下文窗口的限制，因此长时间对话可能会被压缩或截断。这就是为什么需要记忆搜索：它只将相关部分重新引入上下文中。

文档：[内存](/concepts/memory)，[上下文](/concepts/context)。

## 数据在磁盘上的存储位置

__HEADING_0__OpenClaw 使用的所有数据是否都保存在本地？

不——**OpenClaw 的状态是本地的**，但**外部服务仍然会看到你发送给它们的内容**。

- **默认本地：**会话、内存文件、配置和工作区都存储在网关主机上

(`~/.openclaw` + 您的工作区目录)。

- **出于必要而远程：**您发送给模型提供商（Anthropic/OpenAI等）的消息会发送到

他们的API以及聊天平台（WhatsApp、Telegram、Slack等）会将其消息数据存储在自己的服务器上。

- **您掌控数据足迹：**使用本地模型可将提示保留在您的设备上，但渠道…

流量仍然通过该频道的服务器传输。

相关：[代理工作区](/concepts/agent-workspace)，[内存](/concepts/memory)。

__HEADING_0__OpenClaw将数据存储在哪里？

一切都在 `$OPENCLAW_STATE_DIR` 下运行（默认：`~/.openclaw`）：

| 路径 | 用途 |
|------|---------|
| `$OPENCLAW_STATE_DIR/openclaw.json` | 主配置（JSON5） |
| `$OPENCLAW_STATE_DIR/credentials/oauth.json` | 旧版 OAuth 导入（首次使用时复制到身份验证配置文件） |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 定义的身份验证配置文件（OAuth + API 密钥） |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json` | 运行时身份验证缓存（自动管理） |
| `$OPENCLAW_STATE_DIR/credentials/` | 提供商状态（例如 `whatsapp/<accountId>/creds.json`） |
| `$OPENCLAW_STATE_DIR/agents/` | 每个代理的状态（agentDir + 会话） |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/` | 对话历史记录与状态（按代理划分） |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json` | 会话元数据（按代理划分） |

旧版单代理路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）。

您的**工作空间**（AGENTS.md、记忆文件、技能等）是独立的，并通过`agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

__HEADING_0__AGENTmd、SOULmd、USERmd 和 MEMORYmd 应该存放在哪里？

这些文件位于**代理工作区**，而不是`~/.openclaw`。

- **工作区（每个坐席）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`，

`MEMORY.md`（或`memory.md`）、`memory/YYYY-MM-DD.md`，可选`HEARTBEAT.md`。

- **状态目录 (`~/.openclaw`)**：配置、凭据、身份验证配置文件、会话、日志，

并共享技能（`~/.openclaw/skills`）。

默认工作区是`~/.openclaw/workspace`，可通过以下方式配置：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } }
}
```

如果机器人在重启后“忘记”了状态，请确保网关在每次启动时都使用同一个工作区（请记住：在远程模式下，网关使用的是**网关主机的**工作区，而不是你本地笔记本电脑的工作区）。

提示：如果你想让某种行为或偏好持久有效，请让机器人将其**写入 AGENTS.md 或 MEMORY.md**，而不是依赖聊天记录。

请参阅[代理工作区](/concepts/agent-workspace)和[内存](/concepts/memory)。

### 推荐的备份策略是什么？

将你的**代理工作区**存放在一个**私有** Git 仓库中，并在其他位置进行备份，例如 GitHub 私有仓库。这样做不仅可以保存记忆，还能备份 AGENTS/SOUL/USER 文件，让你日后能够恢复助手的“心智”。

请勿提交`~/.openclaw`下的任何内容（凭据、会话、令牌）。
如果需要完整恢复，请分别备份工作区和状态目录（参见上面的迁移问题）。

文档：[代理工作区](/concepts/agent-workspace)。

### 如何彻底卸载OpenClaw？

请参阅专用指南：[卸载](/install/uninstall)。

### 代理可以在工作空间外工作吗？

是的。工作区是**默认的当前工作目录**和内存锚点，而非严格意义上的沙箱。
相对路径在工作区内解析，但绝对路径可以访问其他主机位置，除非启用了沙箱隔离。如果你需要隔离，请使用
[`agents.defaults.sandbox`](/gateway/sandboxing) 或按代理配置的沙箱设置。如果你想让某个仓库成为默认的工作目录，请将该代理的
`workspace` 指向仓库根目录。OpenClaw 仓库仅包含源代码；除非你有意让代理在其内部工作，否则请将工作区保持独立。

示例（仓库作为默认当前工作目录）：

```json5
{
  agents: {
    defaults: {
      workspace: "~/Projects/my-repo"
    }
  }
}
```

### 我处于远程模式，会话存储在哪里？

会话状态由**网关主机**负责维护。如果你处于远程模式，你所关注的会话存储位于远程机器上，而不是你的本地笔记本电脑上。有关详细信息，请参阅[会话管理](/concepts/session)。

## 配置基础

### 配置文件是什么格式？它在哪里？

OpenClaw会从`$OPENCLAW_CONFIG_PATH`读取可选的**JSON5**配置（默认：`~/.openclaw/openclaw.json`）：

```
$OPENCLAW_CONFIG_PATH
```

如果文件缺失，它会使用相对安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

### 我已将网关绑定到局域网或Tailnet，但目前没有任何服务在监听，UI显示“未授权”。

非环回绑定**需要身份验证**。请配置 `gateway.auth.mode` + `gateway.auth.token`（或使用 `OPENCLAW_GATEWAY_TOKEN`）。

```json5
{
  gateway: {
    bind: "lan",
    auth: {
      mode: "token",
      token: "replace-me"
    }
  }
}
```

注释：

- `gateway.remote.token` 仅用于**远程 CLI 调用**；它不会启用本地网关身份验证。
- 控制 UI 通过 `connect.params.auth.token` 进行身份验证（存储在应用/UI设置中）。请勿将令牌放入 URL 中。

### 为什么我现在在本地主机上需要一个令牌？

向导默认会生成网关令牌（即使在环回模式下也是如此），因此**本地 WebSocket 客户端必须进行身份验证**。这会阻止其他本地进程调用网关。将该令牌粘贴到控制 UI 设置中（或您的客户端配置中）以建立连接。

如果你**真的**想要启用环回模式，请从配置中移除 `gateway.auth`。医生可以随时为你生成一个令牌：`openclaw doctor --generate-gateway-token`。

### 更改配置后必须重启吗？

网关会监控配置并支持热重载：

- `gateway.reload.mode: "hybrid"`（默认）：热应用安全更改，关键更改需重启
- 同时支持 `hot`、`restart` 和 `off`

### 如何启用网页搜索和网页抓取？

`web_fetch` 无需 API 密钥即可运行。`web_search` 需要 Brave 搜索 API 密钥。**推荐：**运行 `openclaw configure --section web` 以将其存储在 `tools.web.search.apiKey` 中。环境替代方案：为网关进程设置 `BRAVE_API_KEY`。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5
      },
      fetch: {
        enabled: true
      }
    }
  }
}
```

注释：

- 如果您使用白名单，请添加 `web_search`/`web_fetch` 或 `group:web`。
- 默认启用 `web_fetch`（除非被显式禁用）。
- 守护进程从 `~/.openclaw/.env`（或服务环境）中读取环境变量。

文档：[网页工具](/tools/web)。

### 如何在跨设备环境中运行带有专用工作程序的中央网关？

常见的模式是**一个网关**（例如树莓派）加上**节点**和**代理**：

- **网关（中心节点）：**负责管理通道（Signal/WhatsApp）、路由和会话。
- **节点（设备）：**以外围设备的身份连接到Mac、iOS和Android设备，并暴露本地工具（`system.run`、`canvas`、`camera`）。
- **代理（工作者）：**为特定角色（如“Hetzner 运维”、“个人数据”）提供独立的“大脑”或工作空间。
- **子代理：**在需要并行处理时，由主代理派生出后台任务。
- **TUI：**连接到网关，用于切换代理和会话。

文档：[节点](/nodes)、[远程访问](/gateway/remote)、[多智能体路由](/concepts/multi-agent)、[子智能体](/tools/subagents)、[TUI](/tui)。

__HEADING_0__OpenClaw浏览器能否无头运行？

是的。这是一个配置选项：

```json5
{
  browser: { headless: true },
  agents: {
    defaults: {
      sandbox: { browser: { headless: true } }
    }
  }
}
```

默认为`false`（带界面）。在某些网站上，无头模式更有可能触发反机器人检查。请参阅[浏览器](/tools/browser)。

无头模式使用**相同的 Chromium 引擎**，适用于大多数自动化任务（表单填写、点击、网页抓取、登录）。主要区别在于：

- 无可见浏览器窗口（如需视觉效果，请使用截图）。
- 某些网站对无头模式下的自动化采取了更严格的限制措施，例如验证码和反机器人机制。

例如，X/推特经常阻止无头会话。

### 如何使用Brave进行浏览器控制

将`browser.executablePath`设置为您的Brave二进制文件（或任何基于Chromium的浏览器），并重启网关。
在[浏览器](/tools/browser#use-brave-or-another-chromium-based-browser)中查看完整的配置示例。

## 远程网关 + 节点

### 命令如何在 Telegram 网关与节点之间传播？

Telegram消息由**网关**处理。网关运行代理，只有在需要节点工具时，才会通过**网关 WebSocket**调用节点：

Telegram → 网关 → 代理 → `node.*` → 节点 → 网关 → Telegram

节点无法看到入站提供商流量；它们只接收节点RPC调用。

### 如果网关托管在远程，我的代理如何访问我的电脑？

简而言之：**将你的电脑配对为一个节点**。网关运行在其他地方，但它可以通过网关的 WebSocket 调用你本地机器上的 `node.*` 工具（屏幕、摄像头、系统）。

典型设置：
1) 在始终在线的主机（VPS/家庭服务器）上运行网关。
2) 将网关主机与您的电脑置于同一个Tailnet中。
3) 确保网关的Web服务可访问（通过Tailnet绑定或SSH隧道）。
4) 在本地打开macOS应用，并以“通过SSH远程连接”模式（或直接使用Tailnet）进行连接，以便其能够注册为一个节点。
5) 在网关上批准该节点：

   ```bash
   openclaw nodes pending
   openclaw nodes approve <requestId>
   ```

无需单独的TCP网桥；节点通过网关WebSocket连接。

安全提醒：配对 macOS 节点将允许该机器上的 `system.run`。请仅配对您信任的设备，并查看 [安全](/gateway/security)。

文档：[节点](/nodes)、[网关协议](/gateway/protocol)、[macOS 远程模式](/platforms/mac/remote)、[安全](/gateway/security)。

__HEADING_0__Tailscale 已连接，但没有收到任何回复，接下来该怎么办？

检查基本事项：

- 网关正在运行：`openclaw gateway status`
- 网关健康状况：`openclaw status`
- 通道健康状况：`openclaw channels status`

然后验证身份验证和路由：

- 如果你使用 Tailscale Serve，请确保正确设置了 `gateway.auth.allowTailscale`。
- 如果你通过 SSH 隧道连接，请确认本地隧道已启动并指向正确的端口。
- 确认你的白名单（私信或群组）中包含你的账号。

文档：[Tailscale](/gateway/tailscale)，[远程访问](/gateway/remote)，[通道](/channels)。

### 两个 OpenClaw 实例能否在本地 VPS 上相互通信？

是的。虽然没有内置的“机器人对机器人”桥接功能，但你可以通过几种可靠的方式自行搭建：

**最简单的方法：**使用两个机器人均可访问的普通聊天频道（Telegram、Slack 或 WhatsApp）。
让机器人A向机器人B发送一条消息，然后让机器人B像往常一样回复。

**CLI桥接（通用）：**运行一个脚本，通过`openclaw agent --message ... --deliver`调用另一网关，并以另一机器人正在监听的聊天为目标。如果其中一台机器人位于远程VPS上，请通过SSH或Tailscale将你的CLI指向该远程网关（参见[远程访问](/gateway/remote)）。

示例模式（从可访问目标网关的机器运行）：

```bash
openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
```

提示：添加护栏，以防止两个机器人陷入无限循环，例如通过设置仅提及、频道白名单或“不要回复机器人消息”规则。

文档：[远程访问](/gateway/remote)，[代理 CLI](/cli/agent)，[代理发送](/tools/agent-send)。

### 我需要为多个代理分别使用独立的VPS吗？

不是。一个网关可以托管多个代理，每个代理都拥有独立的工作空间、模型默认设置和路由配置。这是一种标准的部署方式，与为每个代理单独运行一台VPS相比，不仅成本低得多，操作也简单得多。

只有在需要严格隔离（安全边界）或配置差异极大且不希望共享配置时，才使用独立的VPS。否则，应保留一个网关，并使用多个代理或子代理。

在个人笔记本电脑上运行节点，而不是通过VPS使用SSH，有什么好处吗？

是的，节点是通过远程网关访问笔记本电脑的一等途径，而且它们提供的功能远不止简单的 shell 访问。网关可以在 macOS 或 Linux 上运行（Windows 可通过 WSL2 运行），并且非常轻量——一台小型 VPS 或树莓派级别的设备就足以胜任，4 GB 内存也完全够用。因此，一种常见的部署方案是：使用一台始终在线的主机作为网关，并将你的笔记本电脑配置为一个节点。

- **无需入站SSH。**节点主动通过WebSocket连接到网关，并使用设备配对功能。
- **更安全的执行控制。**`system.run` 受该笔记本上节点白名单和审批机制的严格管控。
- **更多设备工具。**除了`system.run`之外，节点还公开了`canvas`、`camera`和`screen`。
- **本地浏览器自动化。**将网关保留在VPS上，但在本地运行Chrome并负责中继控制。

通过Chrome扩展程序再加上笔记本上的节点主机。

SSH适用于临时的外壳访问，但对于持续的代理工作流和设备自动化来说，节点更为简单。

文档：[节点](/nodes)，[节点 CLI](/cli/nodes)，[Chrome扩展](/tools/chrome-extension)。

### 我应该在第二台笔记本电脑上安装，还是只添加一个节点？

如果你在第二台笔记本上只需要**本地工具**（屏幕/摄像头/exec），请将其添加为一个**节点**。这样你只需使用一个网关，从而避免重复配置。目前，本地节点工具仅适用于macOS，但我们计划将其扩展到其他操作系统。

只有在你需要**严格隔离**或两个完全独立的机器人时，才安装第二个网关。

文档：[节点](/nodes)，[节点 CLI](/cli/nodes)，[多个网关](/gateway/multiple-gateways)。

### 节点是否运行网关服务？

否。除非您有意运行隔离的配置文件（请参阅[多网关](/gateway/multiple-gateways)），否则每台主机应仅运行**一个网关**。节点是指连接到网关的外围设备，包括iOS/Android节点，以及在菜单栏应用中启用的macOS“节点模式”。有关无头节点主机和通过命令行界面（CLI）进行控制的更多信息，请参阅[节点主机 CLI](/cli/node)。

`gateway`、`discovery` 和 `canvasHost` 的更改需要完全重启。

### 是否有通过API RPC应用配置的方法？

是的。`config.apply` 在操作过程中验证并写入完整配置，并重启网关。

### configapply 清除了我的配置，我该如何恢复并避免这种情况再次发生？

`config.apply` 会替换**整个配置**。如果您发送的是部分对象，其他所有内容都会被移除。

恢复：

- 从备份恢复（使用 Git 或复制的 `~/.openclaw/openclaw.json`）。
- 如果没有备份，请重新运行 `openclaw doctor` 并重新配置通道/模型。
- 如果这是意料之外的情况，请提交一个错误报告，并附上您已知的最新配置或任何备份。
- 在大多数情况下，本地编码助手可以借助日志或历史记录重建一个可用的配置。

避免它：

- 对于小幅修改，请使用`openclaw config set`。
- 对于交互式编辑，请使用`openclaw configure`。

文档：[配置](/cli/config)，[设置](/cli/configure)，[医生](/gateway/doctor)。

### 初次安装时最精简且合理的配置是什么？

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } }
}
```

这将设置你的工作区，并限制谁可以触发机器人。

### 如何在VPS上设置Tailscale并从我的Mac连接？

最少步骤：

1) 在VPS上安装并登录

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2) **在您的Mac上安装并登录**

- 使用 Tailscale 应用并登录到同一个尾网。

3) **启用MagicDNS（推荐）**

- 在 Tailscale 管理控制台中启用 MagicDNS，为 VPS 配置一个稳定的域名。

4) **使用尾网主机名**

- SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
   - 网关WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

如果您想在没有 SSH 的情况下使用控制界面，请在 VPS 上使用 Tailscale Serve：

```bash
openclaw gateway --tailscale serve
```

这会将网关绑定到环回地址，并通过 Tailscale 暴露 HTTPS。请参阅 [Tailscale](/gateway/tailscale)。

### 如何将 Mac 节点连接到远程 Gateway Tailscale Serve？

Serve公开了**网关控制UI + WS**。节点通过同一个网关WS端点连接。

推荐设置：
1) **确保VPS和Mac位于同一个Tailnet中**。
2) **在远程模式下使用macOS应用**（SSH目标可以是Tailnet主机名）。应用会通过隧道转发网关端口，并以节点身份进行连接。
3) **在网关上批准该节点**：

   ```bash
   openclaw nodes pending
   openclaw nodes approve <requestId>
   ```

文档：[网关协议](/gateway/protocol)，[发现](/gateway/discovery)，[在 macOS 上以远程模式运行](/platforms/mac/remote)。

## 环境变量与 .env 文件加载

__HEADING_0__OpenClaw如何加载环境变量

OpenClaw从父进程（Shell、launchd、systemd、CI等）中读取环境变量，并额外加载：

- 当前工作目录中的`.env`
- 来自`~/.openclaw/.env`（又名`$OPENCLAW_STATE_DIR/.env`）的全局回退`.env`

没有`.env`文件会覆盖现有的环境变量。

你还可以在配置中定义内联环境变量（仅在进程环境变量中缺失时才会应用）：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." }
  }
}
```

有关完整的优先级和来源，请参阅[/environment](/environment)。

### 我通过服务启动了网关，结果环境变量不见了，现在该怎么办？

两种常见的修复方法：

1) 将缺失的键放入 `~/.openclaw/.env` 中，以便在服务未继承您的 shell 环境时也能被正确拾取。
2) 启用 shell 导入（需主动选择以获得便利）：

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000
    }
  }
}
```

这将运行您的登录 shell，并仅导入缺失的预期键（从不覆盖）。环境变量等效项：
`OPENCLAW_LOAD_SHELL_ENV=1`，`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

### 我已经设置了 COPILOTGITHUBTOKEN，但模型状态显示 Shell 环境已关闭，这是为什么？

`openclaw models status` 会报告“shell env 导入”是否已启用。“Shell env：已关闭”并不意味着您的环境变量缺失——这仅仅表示 OpenClaw 不会自动加载您的登录 shell。

如果网关以服务（launchd/systemd）形式运行，它将不会继承你的 shell 环境。可通过以下任一方式修复：

1) 将标记放入 `~/.openclaw/.env`：

   ```
   COPILOT_GITHUB_TOKEN=...
   ```

2) 或启用 shell 导入 (`env.shellEnv.enabled: true`)。
3) 或将其添加到你的配置 `env` 块中（仅在缺失时适用）。

然后重启网关并重新检查：

```bash
openclaw models status
```

Copilot 令牌从 `COPILOT_GITHUB_TOKEN`（也包括 `GH_TOKEN` / `GITHUB_TOKEN`）读取。
请参阅 [/concepts/model-providers](/concepts/model-providers) 和 [/environment](/environment)。

## 会话与多条聊天记录

### 如何开始一段新的对话？

将`/new`或`/reset`作为独立消息发送。请参阅[会话管理](/concepts/session)。

### 如果我从未发送新内容，会话会自动重置吗？

是的。会话在 `session.idleMinutes`（默认为 **60**）分钟后过期。**下一条**
消息会为该聊天密钥启动一个新的会话ID。这不会删除对话记录——只是开始一个新的会话。

```json5
{
  session: {
    idleMinutes: 240
  }
}
```

### 是否有一种方法可以让一组 OpenClaw 实例由一名首席执行官和多名代理组成？

是的，可以通过**多智能体路由**和**子智能体**实现。您可以创建一个协调智能体，以及若干拥有各自工作空间和模型的工作智能体。

话虽如此，这最好被视作一项**有趣的实验**。由于涉及大量代币，它的效率往往不如让单个机器人在独立会话中运行。我们设想的典型模式是：你与一个主机器人对话，为并行工作创建不同的会话；在必要时，该主机器人还可以动态生成子代理来协助完成任务。

文档：[多智能体路由](/concepts/multi-agent)，[子智能体](/tools/subagents)，[智能体命令行界面](/cli/agents)。

### 为什么上下文会在任务中途被截断？我该如何防止这种情况发生？

会话上下文受模型窗口大小的限制。长时间对话、大型工具输出或大量文件可能会触发压缩或截断。

有帮助的：

- 让机器人总结当前状态并将其写入文件。
- 在执行耗时较长的任务前使用`/compact`，在切换话题时使用`/new`。
- 将重要上下文保留在工作区中，并让机器人复述这些内容。
- 对于长时间或并行处理的任务，使用子代理，以保持主对话更简洁。
- 如果这种情况经常发生，请选择具有更大上下文窗口的模型。

### 如何在保留安装的情况下彻底重置 OpenClaw？

使用重置命令：

```bash
openclaw reset
```

非交互式完全重置：

```bash
openclaw reset --scope full --yes --non-interactive
```

然后重新运行入职流程：

```bash
openclaw onboard --install-daemon
```

注释：

- 如果引导向导检测到现有配置，它还会提供**重置**选项。请参阅[向导](/start/wizard)。
- 如果你使用了配置文件（`--profile` / `OPENCLAW_PROFILE`），请重置每个状态目录（默认值为`~/.openclaw-<profile>`）。
- 开发环境重置：`openclaw gateway --dev --reset`（仅限开发环境；会清除开发配置、凭据、会话和工作区）。

### 我遇到了上下文过大的错误，该如何重置或压缩？

使用以下其中之一：

- **紧凑**（保留对话内容，但对较早的回合进行摘要）：

  ```
  /compact
  ```

或`/compact <instructions>`来指导摘要。

- **重置**（为同一聊天密钥生成新的会话ID）：

  ```
  /new
  /reset
  ```

如果这种情况持续发生：

- 启用或调整**会话修剪**（`agents.defaults.contextPruning`），以清除旧的工具输出。
- 使用具有更大上下文窗口的模型。

文档：[压缩](/concepts/compaction)，[会话修剪](/concepts/session-pruning)，[会话管理](/concepts/session)。

### 为什么我会看到“LLM请求被拒绝”的消息？内容X工具已将输入字段设置为必填项。

这是一个提供商验证错误：该模型发出了一个`tool_use`块，但缺少必需的
`input`。这通常意味着会话历史已过时或损坏（通常发生在长时间对话之后，
或在工具或模式发生变更之后）。

修复：使用`/new`（独立消息）启动一个新会话。

### 为什么我每30分钟就会收到一次心跳消息？

心跳默认每**30秒**运行一次。可对其进行调整或禁用：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "2h"   // or "0m" to disable
      }
    }
  }
}
```

如果`HEARTBEAT.md`存在但实质上为空（仅包含空行和类似`# Heading`的 Markdown 标题），OpenClaw会跳过心跳运行以节省API调用。如果该文件缺失，心跳仍会运行，由模型决定后续操作。

每个代理的覆盖使用 `agents.list[].heartbeat`。文档：[心跳](/gateway/heartbeat)。

### 我需要在WhatsApp群组中添加机器人账号吗？

不是。OpenClaw运行在**您自己的账户**上，因此如果您在该群组中，OpenClaw就能看到它。
默认情况下，群组回复会被阻止，直到您允许发件人发送消息（`groupPolicy: "allowlist"`）。

如果你只想让**你**能够触发群组回复：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"]
    }
  }
}
```

### 如何获取 WhatsApp 群组的 JID？

选项1（最快）：查看日志尾部并在群组中发送一条测试消息：

```bash
openclaw logs --follow --json
```

查找以`@g.us`结尾的`chatId`（或`from`），例如：
`1234567890-1234567890@g.us`。

选项2（如果已配置/列入白名单）：从配置中列出组：

```bash
openclaw directory groups list --channel whatsapp
```

文档：[WhatsApp](/channels/whatsapp)、[目录](/cli/directory)、[日志](/cli/logs)。

### 为什么OpenClaw不在群组中回复？

两个常见原因：

- 提及过滤已启用（默认）。您必须@提及机器人，或匹配`mentionPatterns`。
- 您在未配置`"*"`的情况下配置了`channels.whatsapp.groups`，且该群组未被列入白名单。

请参阅[群组](/concepts/groups)和[群组消息](/concepts/group-messages)。

### 群组对话会与私信共享上下文吗？

默认情况下，直接聊天会折叠到主会话中。群组和频道拥有各自的会话密钥，而 Telegram 主题和 Discord 线程则被视为独立的会话。请参阅[群组](/concepts/groups)和[群组消息](/concepts/group-messages)。

### 我可以创建多少个工作区和客服人员？

没有硬性限制。几十个甚至上百个都没问题，但要注意：

- **磁盘增长：**会话和对话记录存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。
- **令牌成本：**代理数量越多，模型的并发使用量就越大。
- **运维开销：**每个代理都需要独立的身份验证配置文件、工作区以及渠道路由设置。

提示：

- 每个代理保留一个**活跃**的工作空间 (`agents.defaults.workspace`)。
- 如果磁盘空间增长，修剪旧会话（删除 JSONL 或存储条目）。
- 使用 `openclaw doctor` 查找孤立的工作空间并检测配置文件不匹配。

### 我能否在 Slack 中同时运行多个机器人或聊天？如果可以，我该如何设置？

是的。使用**多代理路由**来运行多个隔离的代理，并根据渠道、账户或对等方对入站消息进行路由。Slack 作为渠道受到支持，且可绑定到特定代理。

浏览器访问功能强大，但远不能涵盖“人类所能完成的一切”——反机器人机制、验证码和多因素身份验证依然能够有效抵御自动化攻击。为了实现最可靠、最安全的浏览器控制，请在运行浏览器的设备上安装并使用 Chrome 扩展 Relay，并将网关部署在任意位置。

最佳实践设置：

- 常开网关主机（VPS/Mac mini）。
- 每个角色配备一个代理（绑定）。
- 与这些代理绑定的Slack频道。
- 必要时通过扩展中继（或节点）在本地浏览器中使用。

文档：[多智能体路由](/concepts/multi-agent)，[Slack](/channels/slack)，
[浏览器](/tools/browser)，[Chrome扩展](/tools/chrome-extension)，[节点](/nodes)。

## 模型：默认设置、选择、别名、切换

### 默认模型是什么？

OpenClaw的默认模型是你设置的：

```
agents.defaults.model.primary
```

该模型被引用为 `provider/model`（例如：`anthropic/claude-opus-4-5`）。如果您省略提供商，OpenClaw 当前会暂时将 `anthropic` 作为弃用回退——但您仍应**显式**设置 `provider/model`。

### 你推荐什么型号？

**推荐默认选项：** `anthropic/claude-opus-4-5`。  
**不错的替代方案：** `anthropic/claude-sonnet-4-5`。  
**可靠且更节省字符：** `openai/gpt-5.2`——效果几乎与 Opus 一样好，只是个性稍逊。  
**预算友好：** `zai/glm-4.7`。

MiniMax M2.1 有自己的文档：[MiniMax](/providers/minimax) 和
[本地模型](/gateway/local-models)。

经验法则：在高风险任务中使用你“负担得起的最佳模型”，而在日常聊天或摘要生成等常规任务中则选用更便宜的模型。你可以按智能体路由不同的模型，并利用子智能体来并行处理耗时较长的任务（每个子智能体都会消耗一定数量的标记）。有关详细信息，请参阅[模型](/concepts/models)和[子智能体](/tools/subagents)。

强烈警告：量化程度较低或过度量化的模型更容易遭受提示注入攻击，并可能表现出不安全行为。详情请参阅[安全](/gateway/security)。

更多上下文：[模型](/concepts/models)。

### 我可以使用自托管模型 llamacpp、vLLM 或 Ollama 吗？

是的。如果您的本地服务器公开了一个与OpenAI兼容的API，您可以将其指向自定义提供商。Ollama受到原生支持，也是最简单的选择。

安全提示：规模较小或经过大幅量化的模型更容易遭受提示注入攻击。对于任何可使用工具的机器人，我们强烈建议使用**大型模型**。如果您仍想使用小型模型，请启用沙箱机制并实施严格的工具白名单。

文档：[Ollama](/providers/ollama)、[本地模型](/gateway/local-models)、
[模型提供商](/concepts/model-providers)、[安全](/gateway/security)、
[沙箱化](/gateway/sandboxing)。

### 如何在不清除配置的情况下切换模型？

使用**模型命令**或仅编辑**模型**字段。避免完全替换配置。

安全选项：

- 聊天中的`/model`（快速，每次会话）
- `openclaw models set ...`（仅更新模型配置）
- `openclaw configure --section models`（交互式）
- 在`~/.openclaw/openclaw.json`中编辑`agents.defaults.model`

除非您打算替换整个配置，否则请避免对部分对象使用`config.apply`。
如果您确实覆盖了配置，请从备份中恢复或重新运行`openclaw doctor`以进行修复。

文档：[模型](/concepts/models)，[配置](/cli/configure)，[设置](/cli/config)，[医生](/gateway/doctor)。

__HEADING_0__OpenClaw、Flawd 和 Krill 使用什么模型？

- **OpenClaw + Flawd：** Anthropic Opus (`anthropic/claude-opus-4-5`) - 详情请参阅 [Anthropic](/providers/anthropic)。
- **Krill：** MiniMax M2.1 (`minimax/MiniMax-M2.1`) - 详情请参阅 [MiniMax](/providers/minimax)。

### 如何在不重启的情况下即时切换模型？

将`/model`命令用作独立消息：

```
/model sonnet
/model haiku
/model opus
/model gpt
/model gpt-mini
/model gemini
/model gemini-flash
```

你可以使用`/model`、`/model list`或`/model status`列出可用的模型。

`/model`（和 `/model list`）显示一个紧凑的编号选择器。按编号选择：

```
/model 3
```

你还可以为提供商强制指定特定的身份验证配置文件（按会话）：

```
/model opus@anthropic:default
/model opus@anthropic:work
```

提示：`/model status` 显示当前活动的代理、正在使用的`auth-profiles.json` 文件，以及接下来将尝试的身份验证配置文件。
在可用时，它还会显示已配置的提供商端点(`baseUrl`)和 API 模式(`api`)。

**如何取消我在个人资料设置中固定的个人资料？**

重新运行`/model`，**不带**`@profile`后缀：

```
/model anthropic/claude-opus-4-5
```

如果您想恢复默认设置，请从`/model`中选择（或发送`/model <default provider/model>`）。
使用`/model status`确认当前激活的身份验证配置文件。

### 我可以将GPT 5.2用于日常任务，而将Codex 5.2用于编码吗？

是的。设置一个为默认选项，并根据需要切换：

- **会话级快速切换：** 日常任务使用`/model gpt-5.2`，编码任务使用`/model gpt-5.2-codex`。
- **默认模型+切换：** 将`agents.defaults.model.primary`设置为`openai-codex/gpt-5.2`，然后在编码时切换到`openai-codex/gpt-5.2-codex`（或反之亦然）。
- **子代理：** 将编码任务路由到使用不同默认模型的子代理。

请参阅[模型](/concepts/models)和[斜杠命令](/tools/slash-commands)。

### 为什么我看到“模型不允许”，然后就没有回复？

如果设置了`agents.defaults.models`，它将成为`/model`及任何会话覆盖的**白名单**。选择不在该列表中的模型将返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

该错误会**代替**正常回复而返回。解决方法：将模型添加到
`agents.defaults.models`，移除白名单，或从 `/model list` 中选择一个模型。

### 为什么我看到未知型号 minimaxMiniMaxM21？

这意味着**未配置提供商**（未找到 MiniMax 提供商配置或身份验证配置文件），因此无法解析该模型。针对此检测问题的修复已包含在 **2026.1.12** 版本中（撰写本文时尚未发布）。

修复检查清单：
1) 升级到 **2026.1.12**（或从源代码运行 `main`），然后重启网关。
2) 确保已配置 MiniMax（通过向导或 JSON），或者在 env/auth 配置文件中存在 MiniMax API 密钥，以便能够注入该提供商。
3) 使用精确的模型 ID（区分大小写）：`minimax/MiniMax-M2.1` 或 `minimax/MiniMax-M2.1-lightning`。
4) 运行：

   ```bash
   openclaw models list
   ```

并从列表中选择（或在聊天中输入`/model list`）。

请参阅[MiniMax](/providers/minimax)和[模型](/concepts/models)。

### 我可以把MiniMax设为默认模型，而把OpenAI用于复杂任务吗？

是的。将**MiniMax设为默认模型**，并在需要时**按会话切换模型**。
回退机制用于处理**错误**，而非“困难任务”，因此请使用`/model`或单独的代理。

**选项A：每次会话切换一次**

```json5
{
  env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.1" },
      models: {
        "minimax/MiniMax-M2.1": { alias: "minimax" },
        "openai/gpt-5.2": { alias: "gpt" }
      }
    }
  }
}
```

然后：

```
/model gpt
```

**选项B：独立代理**

- 代理A默认：MiniMax
- 代理B默认：OpenAI
- 按代理路由，或使用`/agent`进行切换

文档：[模型](/concepts/models)，[多智能体路由](/concepts/multi-agent)，[MiniMax](/providers/minimax)，[OpenAI](/providers/openai)。

__HEADING_0__Opus Sonnet GPT 是否内置快捷键？

是的。OpenClaw附带了一些默认简写（仅在模型存在于`agents.defaults.models`中时应用）：

- `opus` → `anthropic/claude-opus-4-5`
- `sonnet` → `anthropic/claude-sonnet-4-5`
- `gpt` → `openai/gpt-5.2`
- `gpt-mini` → `openai/gpt-5-mini`
- `gemini` → `google/gemini-3-pro-preview`
- `gemini-flash` → `google/gemini-3-flash-preview`

如果你设置了同名的自定义别名，你的值将优先生效。

### 如何定义覆盖模型快捷方式别名？

别名来自 `agents.defaults.models.<modelId>.alias`。例如：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-5" },
      models: {
        "anthropic/claude-opus-4-5": { alias: "opus" },
        "anthropic/claude-sonnet-4-5": { alias: "sonnet" },
        "anthropic/claude-haiku-4-5": { alias: "haiku" }
      }
    }
  }
}
```

然后，`/model sonnet`（在支持时为 `/<alias>`）解析为该模型ID。

### 如何添加来自其他提供商（如OpenRouter或ZAI）的模型？

OpenRouter（按令牌付费；多种模型）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
      models: { "openrouter/anthropic/claude-sonnet-4-5": {} }
    }
  },
  env: { OPENROUTER_API_KEY: "sk-or-..." }
}
```

Z.AI（GLM模型）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} }
    }
  },
  env: { ZAI_API_KEY: "..." }
}
```

如果你引用了一个提供程序或模型，但缺少所需的提供程序密钥，你将收到一个运行时身份验证错误（例如 `No API key found for provider "zai"`）。

**在添加新代理后未找到提供商的 API 密钥**

这通常意味着**新代理**的认证存储为空。认证是按代理单独存储的，存储位置为：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

修复选项：

- 运行`openclaw agents add <id>`，并在向导中配置身份验证。
- 或者将主代理的`agentDir`中的`auth-profiles.json`复制到新代理的`agentDir`中。

请勿在不同代理之间重复使用 `agentDir`；这会导致身份验证/会话冲突。

## 模型故障转移与“所有模型均失败”

### 故障转移是如何工作的？

故障转移分两个阶段进行：

1) 在同一提供商内进行**身份验证配置文件轮换**。
2) 当前模型失败时，回退到`agents.defaults.model.fallbacks`中的下一个模型。

冷却时间适用于失败的配置文件（采用指数退避机制），因此即使某个提供商受到速率限制或暂时出现故障，OpenClaw仍能持续响应。

### 这个错误是什么意思？

```
No credentials found for profile "anthropic:default"
```

这意味着系统尝试使用身份验证配置文件ID `anthropic:default`，但在预期的身份验证存储中找不到相应的凭据。

### 修复检查清单：未为配置文件 anthropicdefault 找到凭据

- **确认身份验证配置文件的存储位置**（新路径与旧路径）
  - 当前路径：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 旧路径：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
- **确认您的环境变量已由网关加载**
  - 如果您在 shell 中设置了 `ANTHROPIC_API_KEY`，但通过 systemd 或 launchd 启动网关，网关可能无法继承该环境变量。请将其添加到 `~/.openclaw/.env` 中，或启用 `env.shellEnv`。
- **确保您正在编辑正确的代理配置文件**
  - 在多代理设置中，可能存在多个 `auth-profiles.json` 文件。
- **对模型和身份验证状态进行基本检查**
  - 使用 `openclaw models status` 查看已配置的模型以及提供商是否已完成身份验证。

**修复清单：未为配置文件 anthropic 找到凭据**

这意味着该运行已绑定到一个 Anthropic 身份验证配置文件，但网关在其身份验证存储中找不到它。

- **使用设置令牌**
  - 运行 `claude setup-token`，然后使用 `openclaw models auth setup-token --provider anthropic` 将其粘贴。
  - 如果令牌是在另一台机器上创建的，请使用 `openclaw models auth paste-token --provider anthropic`。
- **如果您想改用 API 密钥**
  - 将 `ANTHROPIC_API_KEY` 放置在**网关主机**上的 `~/.openclaw/.env` 中。
  - 清除任何强制使用缺失配置文件的已置顶订单：

    ```bash
    openclaw models auth order clear --provider anthropic
    ```

- **确认您正在网关主机上运行命令**
  - 在远程模式下，身份验证配置文件存储在网关机器上，而不是您的笔记本电脑上。

### 为什么它也尝试了谷歌Gemini却失败了？

如果您的模型配置将 Google Gemini 用作后备模型（或者您切换到了 Gemini 简写），OpenClaw 会在进行模型回退时尝试使用它。如果您尚未配置 Google 凭据，您将看到 `No API key found for provider "google"`。

修复：要么提供 Google 身份验证，要么在 `agents.defaults.model.fallbacks` 或别名中移除或避免使用 Google 模型，以防止路由回退到那里。

**LLM请求被拒绝的消息：认为需要思维签名，谷歌反重力**

原因：会话历史包含**未签名的思维块**（通常来自已中止或不完整的流程）。Google Antigravity 要求所有思维块必须带有签名。

修复：OpenClaw 现在会为 Google Antigravity Claude 剥离无符号思维块。如果问题仍然存在，请启动**新会话**，或为此智能体设置 `/thinking off`。

## 身份验证配置文件：它们是什么以及如何管理它们

相关：[/concepts/oauth](/concepts/oauth)（OAuth 流程、令牌存储、多账户模式）

### 什么是身份验证配置文件？

身份验证配置文件是与提供商关联的命名凭据记录（OAuth或API密钥）。配置文件存储在：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

### 典型的个人资料ID有哪些？

OpenClaw 使用提供程序前缀的ID，例如：

- `anthropic:default`（在没有电子邮件身份时常见）
- 适用于OAuth身份的`anthropic:<email>`
- 您选择的自定义ID（例如`anthropic:work`）

### 我能否控制首先尝试哪个身份验证配置文件？

是的，Config 支持为配置文件提供可选元数据，并允许按提供商设置顺序（`auth.order.<provider>`）。这**不会**存储机密；它将 ID 映射到提供商/模式，并设置轮换顺序。

如果某个配置文件正处于较短的**冷却期**（如速率限制、超时或身份验证失败）或较长的**禁用状态**（如账单问题或积分不足），OpenClaw可能会暂时跳过该配置文件。要检查这种情况，请运行`openclaw models status --json`并查看`auth.unusableProfiles`。调优：`auth.cooldowns.billingBackoffHours*`。

您还可以通过 CLI 为每个座席设置订单覆盖（存储在该座席的 `auth-profiles.json` 中）：

```bash
# Defaults to the configured default agent (omit --agent)
openclaw models auth order get --provider anthropic

# Lock rotation to a single profile (only try this one)
openclaw models auth order set --provider anthropic anthropic:default

# Or set an explicit order (fallback within provider)
openclaw models auth order set --provider anthropic anthropic:work anthropic:default

# Clear override (fall back to config auth.order / round-robin)
openclaw models auth order clear --provider anthropic
```

要定位特定代理：

```bash
openclaw models auth order set --provider anthropic --agent main anthropic:default
```

__HEADING_0__OAuth与API密钥有何区别？

OpenClaw同时支持两者：

- 在适用情况下，**OAuth** 通常利用订阅访问权限。
- **API 密钥**采用按令牌付费的计费模式。

该向导明确支持 Anthropic 的 setup-token 和 OpenAI Codex 的 OAuth，并可为您存储 API 密钥。

## 网关：端口、“已在运行”和远程模式

### 网关使用哪个端口？

`gateway.port` 控制 WebSocket 和 HTTP 的单个多路复用端口（用于控制 UI、钩子等）。

优先级：

```
--port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
```

### 为什么 OpenClaw 网关状态显示运行时正在运行，但 RPC 探针却失败了？

因为“运行”是**主管**的观点（launchd/systemd/schtasks）。RPC探针实际上是一个通过命令行界面连接到网关WebSocket并调用`status`的工具。

使用`openclaw gateway status`并信任这些行：

- `Probe target:`（探针实际使用的URL）
- `Listening:`（端口上实际绑定的内容）
- `Last gateway error:`（当进程存活但端口未监听时的常见根本原因）

### 为什么OpenCLAW网关状态显示“Config CLI”和“Config服务”不一致？

你正在编辑一个配置文件，而服务正在运行另一个配置文件（通常是因为 `--profile` 和 `OPENCLAW_STATE_DIR` 不匹配）。

修复：

```bash
openclaw gateway install --force
```

从您希望服务使用的同一`--profile`/环境中运行它。

### 另一个网关实例已在监听是什么意思？

OpenClaw通过在启动时立即绑定WebSocket监听器来强制实施运行时锁（默认为`ws://127.0.0.1:18789`）。如果绑定失败并返回`EADDRINUSE`，它将抛出`GatewayLockError`，以表明已有另一个实例正在监听。

解决方法：停止其他实例、释放端口，或使用 `openclaw gateway --port <port>` 运行。

### 如何在远程模式下运行 OpenClaw？客户端连接到位于其他位置的网关。

设置 `gateway.mode: "remote"` 并指向一个远程 WebSocket URL，可选择性地提供令牌或密码：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://gateway.tailnet:18789",
      token: "your-token",
      password: "your-password"
    }
  }
}
```

注释：

- `openclaw gateway` 仅在 `gateway.mode` 为 `local` 时启动（或您传递覆盖标志）。
- macOS 应用会监控配置文件，并在这些值发生变化时实时切换模式。

### 控制界面显示“未授权”或不断重新连接，接下来该怎么办？

您的网关已启用身份验证(`gateway.auth.*`)，但界面未发送匹配的令牌或密码。

事实（来自代码）：

- 控制UI会将令牌存储在浏览器的localStorage键`openclaw.control.settings.v1`中。
- UI可以一次性导入`?token=...`（和/或`?password=...`），然后将其从URL中移除。

修复：

- 最快：`openclaw dashboard`（打印并复制分词后的链接，尝试打开；若为无头模式则显示 SSH 提示）。
- 如果你还没有令牌：`openclaw doctor --generate-gateway-token`。
- 如果是远程连接，先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/?token=...`。
- 在网关主机上设置 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 在控制 UI 设置中，粘贴相同的令牌（或使用一次性 `?token=...` 链接进行刷新）。
- 仍然遇到问题？运行 `openclaw status --all`，并按照 [故障排除](/gateway/troubleshooting) 中的说明操作。有关身份验证详情，请参阅 [仪表板](/web/dashboard)。

### 我设置了 gatewaybind tailnet，但它无法绑定任何监听端口。

`tailnet` 绑定会从你的网络接口（100.64.0.0/10）中选择一个 Tailscale IP。如果机器未连接到 Tailscale（或接口已关闭），则没有可绑定的对象。

修复：

- 在该主机上启动 Tailscale（使其拥有 100.x 地址），或
- 切换到 `gateway.bind: "loopback"` / `"lan"`。

注意：`tailnet` 是显式的。`auto` 更倾向于使用环回；当您只想在尾网中绑定时，请使用 `gateway.bind: "tailnet"`。

### 我可以在同一台主机上运行多个网关吗？

通常，一个网关即可运行多个消息通道和客服人员。只有在需要冗余（例如救援机器人）或严格隔离时，才应使用多个网关。

是的，但你必须隔离：

- `OPENCLAW_CONFIG_PATH`（按实例配置）
- `OPENCLAW_STATE_DIR`（按实例状态）
- `agents.defaults.workspace`（工作区隔离）
- `gateway.port`（唯一端口）

快速设置（推荐）：

- 每个实例使用`openclaw --profile <name> …`（自动创建`~/.openclaw-<name>`）。
- 在每个配置文件中设置唯一的`gateway.port`（或在手动运行时传递`--port`）。
- 安装基于配置文件的服务：`openclaw --profile <name> gateway install`。

配置文件还将在服务名称后添加后缀（`bot.molt.<profile>`；旧版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
完整指南：[多个网关](/gateway/multiple-gateways)。

### 无效握手代码1008是什么意思？

网关是一个**WebSocket服务器**，它要求收到的第一条消息必须是`connect`帧。如果收到任何其他类型的消息，它将使用**代码1008**（违反政策）关闭连接。

常见原因：

- 您是在浏览器中打开了**HTTP** URL（`http://...`），而不是在WS客户端中打开。
- 您使用了错误的端口或路径。
- 代理或隧道剥离了身份验证头，或发送了非网关请求。

快速解决方案：
1) 使用 WS URL：`ws://<host>:18789`（如果使用 HTTPS，则为 `wss://...`）。
2) 请勿在普通浏览器标签页中打开 WS 端口。
3) 如果启用了身份验证，请在 `connect` 框中包含令牌/密码。

如果你使用的是 CLI 或 TUI，URL 应该如下所示：

```
openclaw tui --url ws://<host>:18789 --token <token>
```

协议详情：[网关协议](/gateway/protocol)。

## 日志记录与调试

### 日志在哪里？

文件日志（结构化）：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

您可以通过`logging.file`设置稳定的路径。文件日志级别由`logging.level`控制。控制台详细程度由`--verbose`和`logging.consoleLevel`控制。

最快的日志尾部：

```bash
openclaw logs --follow
```

服务/主管日志（当网关通过 launchd/systemd 运行时）：

- macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；配置文件使用 `~/.openclaw-<profile>/logs/...`）
- Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

更多信息，请参阅[故障排除](/gateway/troubleshooting#log-locations)。

### 如何启动、停止或重启网关服务？

使用网关助手：

```bash
openclaw gateway status
openclaw gateway restart
```

如果您手动运行网关，`openclaw gateway --force` 可以回收该端口。请参阅 [网关](/gateway)。

### 我在Windows上关闭了终端，如何重启OpenClaw？

有两种Windows安装模式：

**1) WSL2（推荐）：**网关在 Linux 中运行。

打开 PowerShell，输入 WSL，然后重启：

```powershell
wsl
openclaw gateway status
openclaw gateway restart
```

如果您从未安装过该服务，请在前台启动它：

```bash
openclaw gateway run
```

**2）原生 Windows（不推荐）：**网关直接在 Windows 中运行。

打开 PowerShell 并运行：

```powershell
openclaw gateway status
openclaw gateway restart
```

如果您手动运行它（无需服务），请使用：

```powershell
openclaw gateway run
```

文档：[Windows (WSL2)](/platforms/windows)，[网关服务操作手册](/gateway)。

### 网关已启动，但回复始终无法到达，我该检查什么？

先进行一次快速健康检查：

```bash
openclaw status
openclaw models status
openclaw channels status
openclaw logs --follow
```

常见原因：

- 在**网关主机**上未加载模型身份验证模块（请检查`models status`）。
- 频道配对或白名单阻止回复（请检查频道配置和日志）。
- 即使缺少正确令牌，WebChat/仪表板仍可访问。

如果您是远程用户，请确保隧道或 Tailscale 连接已建立，并且网关 WebSocket 可访问。

文档：[频道](/channels)、[故障排除](/gateway/troubleshooting)、[远程访问](/gateway/remote)。

### 无故与网关断开连接，现在该怎么办？

这通常意味着用户界面已断开 WebSocket 连接。请检查：

1) 网关正在运行吗？`openclaw gateway status`
2) 网关状态是否正常？`openclaw status`
3) UI 是否拥有正确的令牌？`openclaw dashboard`
4) 如果是远程连接，隧道/Tailscale 链路是否已建立？

然后查看尾部日志：

```bash
openclaw logs --follow
```

文档：[仪表板](/web/dashboard)，[远程访问](/gateway/remote)，[故障排除](/gateway/troubleshooting)。

__HEADING_0__Telegram setMyCommands 因网络错误而失败：我应该检查什么？

从日志和渠道状态开始：

```bash
openclaw channels status
openclaw channels logs --channel telegram
```

如果您使用的是VPS或通过代理访问，请确保允许出站HTTPS流量，并确认DNS运行正常。
如果网关是远程的，请确保您查看的是网关主机上的日志。

文档：[Telegram](/channels/telegram)，[频道故障排除](/channels/troubleshooting)。

__HEADING_0__TUI 没有显示任何输出，我应该检查什么？

首先确认网关可访问且代理可以运行：

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

在 TUI 中，使用 `/status` 查看当前状态。如果您希望在聊天频道中收到回复，请确保已启用送达功能 (`/deliver on`)。

文档：[TUI](/tui)，[斜杠命令](/tools/slash-commands)。

### 如何完全停止并重新启动网关？

如果您已安装该服务：

```bash
openclaw gateway stop
openclaw gateway start
```

这会停止或启动**受管服务**（在macOS上为launchd，在Linux上为systemd）。
当网关以后台守护进程方式运行时，请使用此选项。

如果你在前台运行，请先按 Ctrl‑C 停止，然后：

```bash
openclaw gateway run
```

文档：[网关服务运行手册](/gateway)。

### 用通俗易懂的方式解释OpenClaw网关重启与OpenClaw网关的区别

- `openclaw gateway restart`: 重启**后台服务**（launchd/systemd）。
- `openclaw gateway`: 在此终端会话中**在前台运行**网关。

如果您已安装该服务，请使用网关命令。当您需要一次性在前台运行时，请使用 `openclaw gateway`。

### 当某件事失败时，获取更多详细信息的最快方法是什么？

使用 `--verbose` 启动网关，以获取更详细的控制台信息。然后检查日志文件，查找通道身份验证、模型路由和 RPC 错误。

## 媒体与附件

### 我的技能生成了一张图像PDF，但没有发送任何内容。

座席发出的附件必须包含一行`MEDIA:<path-or-url>`（独占一行）。请参阅[OpenClaw助理设置](/start/openclaw)和[座席执行发送](/tools/agent-send)。

CLI发送：

```bash
openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
```

另请查看：

- 目标渠道支持出站媒体，且未被白名单阻止。
- 文件大小在提供商的限制范围内（图片将被调整为最大2048像素）。

参见[图片](/nodes/images)。

## 安全与访问控制

### 将OpenClaw暴露给入站私信安全吗？

将传入的私信视为不可信输入。默认设置旨在降低风险：

- 在支持私信的频道中，默认行为是**配对**：
  - 未知发件人会收到一个配对代码；机器人不会处理他们的消息。
  - 使用以下内容批准：`openclaw pairing approve <channel> <code>`
  - 每个频道待处理请求上限为**3条**；如果未收到代码，请查看 `openclaw pairing list <channel>`。
- 公开开启私信需要明确选择加入（`dmPolicy: "open"` 和白名单 `"*"`）。

运行`openclaw doctor`以发现有风险的DM策略。

### 提示注入只对公共机器人构成威胁吗？

不，提示注入针对的是**不受信任的内容**，而不仅仅是哪些人可以向机器人发送私信。
如果你的助手会读取外部内容（如网络搜索或抓取结果、浏览器页面、电子邮件、文档、附件或粘贴的日志），这些内容可能包含试图劫持模型的指令。即使**只有你一个人作为内容来源**，这种情况也可能发生。

最大的风险出现在启用工具时：模型可能被诱骗代表你泄露上下文或调用工具。通过以下方式缩小影响范围：

- 使用只读或禁用工具的“阅读器”代理来摘要不可信内容
- 对启用工具的代理，将`web_search` / `web_fetch` / `browser` 保持关闭状态
- 使用沙箱并实施严格的工具白名单

详情：[安全](/gateway/security)。

### 我的机器人应该有自己的电子邮件、GitHub 账户还是电话号码？

是的，大多数设置都是如此。通过为机器人使用独立的账户和手机号码进行隔离，可以在出现问题时有效缩小影响范围。这样一来，你也可以更轻松地轮换凭据或撤销访问权限，而不会波及你的个人账户。

从小处着手。只授予你实际需要的工具和账户访问权限，如有需要再逐步扩展。

文档：[安全](/gateway/security)，[配对](/start/pairing)。

### 我可以让它自主管理我的短信吗？这样做安全吗？

我们**不**建议对您的个人消息实行完全自主管理。最安全的模式是：

- 让DM保持在**配对模式**或严格的白名单中。
- 如果你想让它代表你发消息，请使用**单独的号码或账号**。
- 让它先起草消息，然后在发送前由你**先批准**。

如果你想进行实验，请在一个专用账户上进行，并确保该账户与其余环境隔离。请参阅
[安全](/gateway/security)。

### 我能用更便宜的型号来完成个人助理任务吗？

是的，**如果**代理仅支持聊天且输入可信，则可以使用。较小规模的模型更容易受到指令劫持的影响，因此在使用配备工具的代理或处理不可信内容时应避免选用这些模型。如果你必须使用较小规模的模型，请锁定可用工具并在沙箱中运行。有关详情，请参阅[安全](/gateway/security)。

### 我在Telegram中启动了应用，但没有收到配对码。

配对码**仅**在未知发件人向机器人发送消息且`dmPolicy: "pairing"`已启用时才会发送。单独使用`/start`不会生成代码。

查看待处理请求：

```bash
openclaw pairing list telegram
```

如果您想立即访问，请将您的发件人ID加入白名单，或为该账户设置`dmPolicy: "open"`。

__HEADING_0__WhatsApp会向我的联系人发送消息吗？配对是如何工作的？

否。WhatsApp的默认私信政策是“配对”。未知发件人只会收到一个配对码，其消息不会被处理。OpenClaw仅回复它收到的聊天消息，或由您明确触发发送的消息。

批准与以下设备配对：

```bash
openclaw pairing approve whatsapp <code>
```

列出待处理请求：

```bash
openclaw pairing list whatsapp
```

向导电话号码提示：此号码用于设置您的**白名单/所有者**，以允许您接收自己的私信。它不会用于自动发送消息。如果您使用个人 WhatsApp 号码运行，请使用该号码并启用 `channels.whatsapp.selfChatMode`。

## 聊天命令、中止任务以及“它停不下来”

### 如何阻止内部系统消息显示在聊天中？

大多数内部消息或工具消息仅在该会话启用了**详细模式**或**推理模式**时才会显示。

在你看到它的聊天中修复：

```
/verbose off
/reasoning off
```

如果仍然嘈杂，请在控制界面中检查会话设置，并将详细级别设置为“继承”。此外，请确保您未在配置中使用将 `verboseDefault` 设置为 `on` 的机器人配置文件。

文档：[思考与冗长](/tools/thinking)，[安全](/gateway/security#reasoning--verbose-output-in-groups)。

### 如何停止或取消正在运行的任务？

将这些中的任意一条**作为独立消息发送**（无需加斜杠）：

```
stop
abort
esc
wait
exit
interrupt
```

这些是中止触发器（不是斜杠命令）。

对于后台进程（来自 exec 工具），您可以要求代理运行：

```
process action:kill sessionId:XXX
```

斜杠命令概览：请参阅[斜杠命令](/tools/slash-commands)。

大多数命令必须作为以 `/` 开头的**独立**消息发送，但少数快捷方式（如 `/status`）也适用于已列入白名单的发件人，可直接内联使用。

### 如何从Telegram发送Discord消息？跨上下文消息传递已被拒绝。

OpenClaw默认阻止**跨服务商**消息传递。如果某个工具被绑定到Telegram，它在未经明确授权的情况下不会向Discord发送消息。

为客服启用跨服务商消息功能：

```json5
{
  agents: {
    defaults: {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " }
          }
        }
      }
    }
  }
}
```

编辑配置后重启网关。如果您只想为单个代理启用此设置，请改在 `agents.list[].tools.message` 下进行设置。

### 为什么感觉机器人会忽略连发消息？

队列模式控制新消息与正在进行的运行之间的交互方式。使用`/queue`来更改模式：

- `steer` - 新消息会重定向当前任务
- `followup` - 按顺序逐条处理消息
- `collect` - 批量处理消息并一次性回复（默认）
- `steer-backlog` - 立即响应，随后再处理积压消息
- `interrupt` - 中止当前运行并重新开始

你可以为后续模式添加诸如`debounce:2s cap:25 drop:summarize`之类的选项。

## 根据截图/聊天记录准确回答问题

**问：“使用API密钥时，Anthropic的默认模型是什么？”**

**A：** 在 OpenClaw 中，凭据与模型选择是分开的。通过设置 `ANTHROPIC_API_KEY`（或在身份验证配置文件中存储 Anthropic API 密钥），即可启用身份验证；不过，实际的默认模型是你在 `agents.defaults.model.primary` 中配置的模型（例如 `anthropic/claude-sonnet-4-5` 或 `anthropic/claude-opus-4-5`）。如果你看到 `No credentials found for profile "anthropic:default"`，这表明网关未能在预期的 `auth-profiles.json` 中为正在运行的代理找到 Anthropic 凭据。

---

仍然遇到问题？在[Discord](https://discord.com/invite/clawd)中提问，或在[GitHub讨论区](https://github.com/openclaw/openclaw/discussions)中发起新讨论。
