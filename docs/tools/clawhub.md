---
summary: 'ClawHub guide: public skills registry + CLI workflows'
read_when:
  - Introducing ClawHub to new users
  - 'Installing, searching, or publishing skills'
  - Explaining ClawHub CLI flags and sync behavior
---
# ClawHub

ClawHub是**OpenClaw的公共技能注册表**。这是一项免费服务：所有技能都是公开、开放的，任何人都可以查看、共享和重用。一个技能只是一个包含`SKILL.md`文件（以及相关文本文件）的文件夹。您可以通过网页应用浏览技能，也可以使用CLI来搜索、安装、更新和发布技能。

站点：[clawhub.com](https://clawhub.com)

## 适用人群（适合初学者）

如果您想为您的OpenClaw代理添加新功能，ClawHub是查找和安装技能最简单的方式。您无需了解后端的工作原理。您可以：

- 使用自然语言搜索技能。
- 将技能安装到您的工作区。
- 后续只需一条命令即可更新技能。
- 通过发布自己的技能来备份它们。

## 快速入门（非技术性）

1) 安装CLI（见下节）。
2) 搜索您需要的内容：
   - `clawhub search "calendar"`
3) 安装技能：
   - `clawhub install <skill-slug>`
4) 启动一个新的OpenClaw会话，以便它加载新技能。

## 安装CLI

选择以下任一方式：

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## 在OpenClaw中的位置

默认情况下，CLI会将技能安装到您当前工作目录下的`./skills`中。如果已配置OpenClaw工作区，`clawhub`会回退到该工作区，除非您覆盖了`--workdir`（或`CLAWHUB_WORKDIR`）。OpenClaw会从`<workspace>/skills`加载工作区技能，并在**下一个**会话中加载它们。如果您已经在使用`~/.openclaw/skills`或捆绑技能，工作区技能将优先加载。

有关技能如何加载、共享和受控的更多详细信息，请参阅
[Skills](/tools/skills)。

## 服务提供的功能

- **公开浏览**技能及其`SKILL.md`内容。
- **搜索**由嵌入向量驱动，而不仅仅是基于关键词。
- **版本控制**支持语义版本、变更日志和标签（包括`latest`）。
- **下载**每个版本以zip格式提供。
- **点赞和评论**用于社区反馈。
- **审核**钩子用于审批和审计。
- **CLI友好的API**用于自动化和脚本编写。

## CLI命令和参数

全局选项（适用于所有命令）：

- `--workdir <dir>`: 工作目录（默认：当前目录；回退到OpenClaw工作区）。
- `--dir <dir>`: 技能目录，相对于工作目录（默认：`skills`）。
- `--site <url>`: 站点基础URL（浏览器登录）。
- `--registry <url>`: 注册表API基础URL。
- `--no-input`: 禁用提示（非交互式）。
- `-V, --cli-version`: 打印CLI版本。

认证：

- `clawhub login`（浏览器流程）或 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

选项：

- `--token <token>`: 粘贴API令牌。
- `--label <label>`: 存储浏览器登录令牌的标签（默认：`CLI token`）。
- `--no-browser`: 不打开浏览器（需要 `--token`）。

搜索：

- `clawhub search "query"`
- `--limit <n>`: 最大结果数。

安装：

- `clawhub install <slug>`
- `--version <version>`: 安装特定版本。
- `--force`: 如果文件夹已存在则覆盖。

更新：

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: 更新到特定版本（仅限单个slug）。
- `--force`: 当本地文件与任何已发布版本不匹配时进行覆盖。

列出：

- `clawhub list`（读取 __ INLINE_CODE_45__）

发布：

- `clawhub publish <path>`
- `--slug <slug>`: 技能slug。
- `--name <name>`: 显示名称。
- `--version <version>`: 语义版本号。
- `--changelog <text>`: 变更日志文本（可为空）。
- `--tags <tags>`: 逗号分隔的标签（默认：`latest`）。

删除/恢复（仅限所有者或管理员）：

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

同步（扫描本地技能并发布新增或更新的技能）：

- `clawhub sync`
- `--root <dir...>`: 额外的扫描根目录。
- `--all`: 无提示上传所有内容。
- `--dry-run`: 显示将要上传的内容。
- `--bump <type>`: `patch|minor|major`用于更新（默认：`patch`）。
- `--changelog <text>`: 用于非交互式更新的变更日志。
- `--tags <tags>`: 逗号分隔的标签（默认：`latest`）。
- `--concurrency <n>`: 注册表检查（默认：4）。

## 代理的常见工作流

### 搜索技能

```bash
clawhub search "postgres backups"
```

### 下载新技能

```bash
clawhub install my-skill-pack
```

### 更新已安装技能

```bash
clawhub update --all
```

### 备份您的技能（发布或同步）

对于单个技能文件夹：

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

一次性扫描并备份多个技能：

```bash
clawhub sync --all
```

## 高级细节（技术性）

### 版本控制和标签

- 每次发布都会创建一个新的**语义版本**`SkillVersion`。
- 标签（如`latest`）指向某个版本；移动标签可以让您回滚。
- 变更日志随每个版本附带，同步或发布更新时可以为空。

### 本地更改与注册表版本

更新会使用内容哈希将本地技能内容与注册表版本进行比较。如果本地文件与任何已发布版本都不匹配，CLI会在覆盖之前询问（或在非交互式运行中要求`--force`）。

### 同步扫描和回退根目录

`clawhub sync`首先扫描您当前的工作目录。如果没有找到技能，它会回退到已知的旧位置（例如`~/openclaw/skills`和`~/.openclaw/skills`）。这是为了在无需额外标志的情况下找到较旧的技能安装。

### 存储和锁文件

- 已安装的技能记录在您工作目录下的`.clawhub/lock.json`中。
- 认证令牌存储在ClawHub CLI配置文件中（可通过`CLAWHUB_CONFIG_PATH`覆盖）。

### 遥测（安装计数）

当您在登录状态下运行`clawhub sync`时，CLI会发送一个最小快照来计算安装次数。您可以完全禁用此功能：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 环境变量

- `CLAWHUB_SITE`: 覆盖站点URL。
- `CLAWHUB_REGISTRY`: 覆盖注册表API URL。
- `CLAWHUB_CONFIG_PATH`: 覆盖CLI存储令牌/配置的位置。
- `CLAWHUB_WORKDIR`: 覆盖默认工作目录。
- `CLAWHUB_DISABLE_TELEMETRY=1`: 在`sync`上禁用遥测。
