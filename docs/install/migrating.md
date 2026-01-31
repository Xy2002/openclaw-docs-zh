---
summary: Move (migrate) a OpenClaw install from one machine to another
read_when:
  - You are moving OpenClaw to a new laptop/server
  - 'You want to preserve sessions, auth, and channel logins (WhatsApp, etc.)'
---
# 将 OpenClaw 迁移到新机器

本指南介绍如何将 OpenClaw 网关从一台机器迁移到另一台机器，**无需重新完成初始设置**。

从概念上讲，迁移过程非常简单：

- 复制 **状态目录**（`$OPENCLAW_STATE_DIR`，默认为 `~/.openclaw/`）——这包括配置、身份验证、会话和频道状态。
- 复制您的 **工作区**（默认为 `~/.openclaw/workspace/`）——这包括您的代理文件（记忆、提示等）。

不过，在处理 **配置文件**、**权限** 和 **部分复制** 时，容易出现一些常见陷阱。

## 开始之前（您要迁移的内容）

### 1) 确定您的状态目录

大多数安装使用默认设置：

- **状态目录：** `~/.openclaw/`

但如果您使用以下选项，状态目录可能会有所不同：

- `--profile <name>`（通常会变为 `~/.openclaw-<profile>/`）
- `OPENCLAW_STATE_DIR=/some/path`

如果您不确定，请在 **旧** 机器上运行以下命令：

```bash
openclaw status
```

在输出中查找与 `OPENCLAW_STATE_DIR` 或配置文件相关的条目。如果您运行多个网关，请为每个配置文件重复此步骤。

### 2) 确定您的工作区

常见的默认设置：

- `~/.openclaw/workspace/`（推荐的工作区）
- 您创建的自定义文件夹

您的工作区是 `MEMORY.md`、`USER.md` 和 `memory/*.md` 等文件所在的位置。

### 3) 了解您将保留的内容

如果您同时复制 **状态目录** 和 **工作区**，则会保留以下内容：

- 网关配置（`openclaw.json`）
- 身份验证配置文件 / API 密钥 / OAuth 令牌
- 会话历史记录 + 代理状态
- 频道状态（例如 WhatsApp 登录/会话）
- 您的工作区文件（记忆、技能笔记等）

如果您仅复制 **工作区**（例如通过 Git），则不会保留以下内容：

- 会话
- 凭据
- 频道登录信息

这些内容存储在 `$OPENCLAW_STATE_DIR` 下。

## 推荐的迁移步骤

### 步骤 0 — 在旧机器上制作备份

在 **旧** 机器上，首先停止网关，以防止文件在复制过程中被修改：

```bash
openclaw gateway stop
```

（可选但建议）归档状态目录和工作区：

```bash
# Adjust paths if you use a profile or custom locations
cd ~
tar -czf openclaw-state.tgz .openclaw

tar -czf openclaw-workspace.tgz .openclaw/workspace
```

如果您有多个配置文件或状态目录（例如 `~/.openclaw-main`、`~/.openclaw-work`），请分别为每个归档。

### 步骤 1 — 在新机器上安装 OpenClaw

在 **新** 机器上，安装 CLI（以及必要的 Node.js）：

- 参见：[安装](/install)

在此阶段，即使初始设置创建了一个新的 `~/.openclaw/` 也无妨——您将在下一步中覆盖它。

### 步骤 2 — 将状态目录和工作区复制到新机器

同时复制以下内容：

- `$OPENCLAW_STATE_DIR`（默认为 `~/.openclaw/`）
- 您的工作区（默认为 `~/.openclaw/workspace/`）

常用方法：

- 使用 tarball 进行 `scp` 并解压
- 通过 SSH 进行 `rsync -a`
- 使用外部硬盘

复制完成后，请确保：

- 已包含隐藏目录（例如 `.openclaw/`）
- 文件所有权正确，适用于运行网关的用户

### 步骤 3 — 运行 Doctor（迁移与服务修复）

在 **新** 机器上：

```bash
openclaw doctor
```

Doctor 是一个“安全且稳妥”的命令。它可以修复服务、应用配置迁移，并对不匹配的情况发出警告。

然后：

```bash
openclaw gateway restart
openclaw status
```

## 常见陷阱及规避方法

### 陷阱：配置文件与状态目录不匹配

如果您在旧网关上使用某个配置文件（或 `OPENCLAW_STATE_DIR`），而新网关使用不同的配置文件，则会出现以下症状：

- 配置更改未生效
- 频道丢失或注销
- 会话历史为空

解决方法：使用您迁移时使用的 **相同** 配置文件和状态目录来运行网关和服务，然后重新运行：

```bash
openclaw doctor
```

### 陷阱：仅复制 `openclaw.json`

仅复制 `openclaw.json` 是不够的。许多提供商将状态存储在以下位置：

- `$OPENCLAW_STATE_DIR/credentials/`
- `$OPENCLAW_STATE_DIR/agents/<agentId>/...`

始终迁移整个 `$OPENCLAW_STATE_DIR` 文件夹。

### 陷阱：权限或所有权问题

如果您以 root 用户身份复制文件或切换了用户，网关可能无法读取凭据或会话。

解决方法：确保状态目录和工作区由运行网关的用户拥有。

### 陷阱：在远程模式和本地模式之间迁移

- 如果您的 UI（WebUI/TUI）指向的是 **远程** 网关，则远程主机负责管理会话存储和工作区。
- 您迁移笔记本电脑并不会移动远程网关的状态。

如果您处于远程模式，请迁移 **网关主机**。

### 陷阱：备份中的密钥

`$OPENCLAW_STATE_DIR` 包含密钥（API 密钥、OAuth 令牌、WhatsApp 凭据）。请将备份视为生产环境中的密钥：

- 加密存储
- 避免通过不安全渠道共享
- 如果怀疑密钥泄露，请轮换密钥

## 验证检查清单

在新机器上，请确认：

- `openclaw status` 显示网关正在运行
- 您的频道仍然连接（例如 WhatsApp 不需要重新配对）
- 控制面板可以打开并显示现有会话
- 您的工作区文件（记忆、配置）存在

## 相关内容

- [Doctor](/gateway/doctor)
- [网关故障排除](/gateway/troubleshooting)
- [OpenClaw 的数据存储位置](/help/faq#where-does-openclaw-store-its-data)
