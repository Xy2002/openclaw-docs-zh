---
summary: >-
  How the installer scripts work (install.sh + install-cli.sh), flags, and
  automation
read_when:
  - You want to understand `openclaw.bot/install.sh`
  - You want to automate installs (CI / headless)
  - You want to install from a GitHub checkout
---
# 安装程序内部

OpenClaw 提供了两个安装脚本（通过 `openclaw.ai` 提供）：

- `https://openclaw.bot/install.sh` — “推荐”安装程序（默认全局 npm 安装；也可从 GitHub 仓库检出进行安装）
- `https://openclaw.bot/install-cli.sh` — 非 root 友好的 CLI 安装程序（安装到带有独立 Node 的前缀中）
- `https://openclaw.ai/install.ps1` — Windows PowerShell 安装程序（默认使用 npm；可选 Git 安装）

要查看当前的标志/行为，请运行：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --help
```

Windows（PowerShell）帮助信息：

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -?
```

如果安装程序已完成，但在新终端中找不到 `openclaw`，这通常是 Node/npm PATH 问题。请参阅：[安装](/install#nodejs--npm-path-sanity)。

## install.sh（推荐）

高层次功能描述：

- 检测操作系统（macOS / Linux / WSL）。
- 确保 Node.js **22+**（macOS 通过 Homebrew；Linux 通过 NodeSource）。
- 选择安装方法：
  - `npm`（默认）：`npm install -g openclaw@latest`
  - `git`：克隆/构建源代码仓库并安装包装脚本
- 在 Linux 上：在必要时将 npm 的前缀切换为 `~/.npm-global`，以避免全局 npm 权限错误。
- 如果升级现有安装：尽可能运行 `openclaw doctor --non-interactive`。
- 对于 Git 安装：在安装/更新后尽可能运行 `openclaw doctor --non-interactive`。
- 默认启用 `sharp`，以缓解原生安装中的陷阱，并默认启用 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`（避免针对系统 libvips 进行构建）。

如果您*希望* `sharp` 链接到全局安装的 libvips（或您正在调试），请设置：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL https://openclaw.bot/install.sh | bash
```

### 可发现性 / “Git 安装”提示

如果您在**已位于 OpenClaw 源代码仓库内**时运行安装程序（通过 `package.json` + `pnpm-workspace.yaml` 检测到），它会提示您：

- 更新并使用此仓库 (`git`)
- 或迁移到全局 npm 安装 (`npm`)

在非交互式上下文（无 TTY / `--no-prompt`）中，您必须传递 `--install-method git|npm`（或设置 `OPENCLAW_INSTALL_METHOD`），否则脚本将以代码 `2` 退出。

### 为什么需要 Git

Git 是 `--install-method git` 路径（克лон/拉取）所必需的。

对于 `npm` 安装，Git*通常*不是必需的，但某些环境仍然需要 Git（例如，当某个包或依赖项通过 Git URL 获取时）。目前，安装程序会确保 Git 存在，以避免在全新发行版上出现 `spawn git ENOENT` 的意外情况。

### 为什么 npm 在全新 Linux 系统上会命中 `EACCES`

在某些 Linux 设置中（尤其是在通过系统包管理器或 NodeSource 安装 Node 后），npm 的全局前缀指向一个由 root 拥有的位置。此时 `npm install -g ...` 会因 `EACCES` / `mkdir` 权限错误而失败。

`install.sh` 通过将前缀切换为以下位置来缓解此问题：

- `~/.npm-global`（并在 `~/.bashrc` / `~/.zshrc` 中将其添加到 `PATH`）

## install-cli.sh（非 root CLI 安装程序）

此脚本将 `openclaw` 安装到一个前缀中（默认：`~/.openclaw`），并在该前缀下安装一个专用的 Node 运行时，以便在您不希望修改系统 Node/npm 的机器上也能正常工作。

帮助信息：

```bash
curl -fsSL https://openclaw.bot/install-cli.sh | bash -s -- --help
```

## install.ps1（Windows PowerShell）

高层次功能描述：

- 确保 Node.js **22+**（通过 winget/Chocolatey/Scoop 或手动）。
- 选择安装方法：
  - `npm`（默认）：`npm install -g openclaw@latest`
  - `git`：克лон/构建源代码仓库并安装包装脚本
- 在升级和 Git 安装时尽可能运行 `openclaw doctor --non-interactive`。

示例：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex -InstallMethod git
```

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex -InstallMethod git -GitDir "C:\\openclaw"
```

环境变量：

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_GIT_DIR=...`

Git 要求：

如果您选择 `-InstallMethod git` 且缺少 Git，安装程序将打印 Windows 版 Git 的链接（`https://git-scm.com/download/win`）并退出。

常见的 Windows 问题：

- **npm 错误 spawn git / ENOENT**：安装 Windows 版 Git 并重新打开 PowerShell，然后重新运行安装程序。
- **“openclaw”未被识别**：您的 npm 全局 bin 文件夹不在 PATH 中。大多数系统使用 `%AppData%\\npm`。您也可以运行 `npm config get prefix` 并将 `\\bin` 添加到 PATH，然后重新打开 PowerShell。
