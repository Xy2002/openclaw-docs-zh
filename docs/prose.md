---
summary: 'OpenProse: .prose workflows, slash commands, and state in OpenClaw'
read_when:
  - You want to run or write .prose workflows
  - You want to enable the OpenProse plugin
  - You need to understand state storage
---
# OpenProse

OpenProse 是一种便携式、以 Markdown 优先的工作流格式，用于编排 AI 会话。在 OpenClaw 中，它以插件形式提供，安装一个 OpenProse 技能包以及一个 `/prose` 斜杠命令。程序存储在 `.prose` 文件中，并且可以以显式控制流启动多个子代理。

官方网站：https://www.prose.md

## 功能概述

- 具有显式并行性的多代理研究与综合。
- 可重复且审批安全的工作流（代码审查、事件分类、内容流水线）。
- 可复用的 `.prose` 程序，可在受支持的代理运行时中运行。

## 安装与启用

捆绑插件默认处于禁用状态。启用 OpenProse：

```bash
openclaw plugins enable open-prose
```

启用插件后重启网关。

开发/本地检出：`openclaw plugins install ./extensions/open-prose`

相关文档：[插件](/plugin)、[插件清单](/plugins/manifest)、[技能](/tools/skills)。

## 斜杠命令

OpenProse 将 `/prose` 注册为用户可调用的技能命令。该命令会路由到 OpenProse 虚拟机指令，并在底层使用 OpenClaw 工具。

常用命令：

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## 示例：一个简单的 `.prose` 文件

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## 文件位置

OpenProse 在您的工作区中将状态保存在 `.prose/` 下：

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

用户级别的持久化代理位于：

```
~/.prose/agents/
```

## 状态模式

OpenProse 支持多种状态后端：
- **filesystem**（默认）：`.prose/runs/...`
- **in-context**：瞬态模式，适用于小型程序
- **sqlite**（实验性）：需要 `sqlite3` 二进制文件
- **postgres**（实验性）：需要 `psql` 和连接字符串

注意事项：
- sqlite/postgres 需手动启用，目前仍处于实验阶段。
- PostgreSQL 凭证会记录在子代理日志中；请使用专用且权限最小化的数据库。

## 远程程序

`/prose run <handle/slug>` 解析为 `https://p.prose.md/<handle>/<slug>`。
直接 URL 会按原样获取。这使用了 `web_fetch` 工具（或对于 POST 请求使用 `exec`）。

## OpenClaw 运行时映射

OpenProse 程序映射到 OpenClaw 原语：

| OpenProse 概念 | OpenClaw 工具 |
| --- | --- |
| 启动会话 / Task 工具 | `sessions_spawn` |
| 文件读写 | `read` / `write` |
| 网页抓取 | `web_fetch` |

如果您的工具白名单阻止了这些工具，OpenProse 程序将无法运行。请参阅 [技能配置](/tools/skills-config)。

## 安全与审批
将 `.prose` 文件视为代码对待。运行前务必审查。使用 OpenClaw 工具白名单和审批门控来控制副作用。

如需确定性、经审批的工作流，请参考 [Lobster](/tools/lobster)。
