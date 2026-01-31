# 创建自定义技能 🛠

OpenClaw 旨在易于扩展。“技能”是为你的助手添加新功能的主要方式。

## 什么是技能？
技能是一个目录，其中包含一个 `SKILL.md` 文件（为大语言模型提供指令和工具定义），还可选择包含一些脚本或资源。

## 分步指南：创建你的第一个技能

### 1. 创建目录
技能位于你的工作区中，通常在 `~/.openclaw/workspace/skills/`。为你的技能创建一个新文件夹：
```bash
mkdir -p ~/.openclaw/workspace/skills/hello-world
```

### 2. 定义 `SKILL.md`
在该目录中创建一个 `SKILL.md` 文件。此文件使用 YAML 前置元数据来存储元信息，并使用 Markdown 来编写指令。

```markdown
---
name: hello_world
description: A simple skill that says hello.
---

# Hello World Skill
When the user asks for a greeting, use the `echo` tool to say "Hello from your custom skill!".
```

### 3. 添加工具（可选）
你可以在前置元数据中定义自定义工具，或者指示代理使用现有的系统工具，例如 `bash` 或 `browser`。

### 4. 刷新 OpenClaw
让你的代理执行“刷新技能”命令，或重启网关。OpenClaw 将发现新目录并索引 `SKILL.md`。

## 最佳实践
- **保持简洁**：只需告诉模型 *做什么*，而无需教它如何扮演 AI。
- **安全第一**：如果你的技能使用了 `bash`，请确保提示不会因不受信任的用户输入而导致任意命令注入。
- **本地测试**：使用 `openclaw agent --message "use my new skill"` 进行测试。

## 共享技能
你还可以浏览并贡献技能到 [ClawHub](https://clawhub.com)。