---
summary: 'Install OpenClaw (recommended installer, global install, or from source)'
read_when:
  - Installing OpenClaw
  - You want to install from GitHub
---
# 安装

除非有特殊原因，否则请使用安装程序。它会设置 CLI 并运行入门流程。

## 快速安装（推荐）

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

Windows（PowerShell）：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

下一步（如果您跳过了入门流程）：

```bash
openclaw onboard --install-daemon
```

## 系统要求

- **Node >=22**
- macOS、Linux 或通过 WSL2 的 Windows
- 仅在您从源代码构建时需要 `pnpm`

## 选择您的安装路径

### 1) 安装脚本（推荐）

通过 npm 全局安装 `openclaw`，并运行入门流程。

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

安装程序标志：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --help
```

详情：[安装程序内部](/install/installer)。

非交互式（跳过入门流程）：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --no-onboard
```

### 2) 全局安装（手动）

如果您已经安装了 Node：

```bash
npm install -g openclaw@latest
```

如果您已全局安装 libvips（在 macOS 上通过 Homebrew 往往如此），并且 `sharp` 安装失败，请强制使用预编译二进制文件：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

如果您看到 `sharp: Please add node-gyp to your dependencies`，请安装构建工具（macOS：Xcode CLT + `npm install -g node-gyp`），或使用上述 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` workaround 来跳过原生构建。

或者：

```bash
pnpm add -g openclaw@latest
```

然后：

```bash
openclaw onboard --install-daemon
```

### 3) 从源代码安装（贡献者/开发者）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard --install-daemon
```

提示：如果您还没有全局安装，请通过 `pnpm openclaw ...` 运行仓库命令。

### 4) 其他安装选项

- Docker：[Docker](/install/docker)
- Nix：[Nix](/install/nix)
- Ansible：[Ansible](/install/ansible)
- Bun（仅 CLI）：[Bun](/install/bun)

## 安装后

- 运行入门流程：`openclaw onboard --install-daemon`
- 快速检查：`openclaw doctor`
- 检查网关健康状况：`openclaw status` + `openclaw health`
- 打开仪表板：`openclaw dashboard`

## 安装方法：npm 与 git（安装程序）

安装程序支持两种方法：

- `npm`（默认）：`npm install -g openclaw@latest`
- `git`：从 GitHub 克隆/构建，并从源代码检出目录中运行

### CLI 标志

```bash
# Explicit npm
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method npm

# Install from GitHub (source checkout)
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git
```

常用标志：

- `--install-method npm|git`
- `--git-dir <path>`（默认：`~/openclaw`）
- `--no-git-update`（使用现有检出目录时跳过 `git pull`）
- `--no-prompt`（禁用提示；在 CI/自动化中必需）
- `--dry-run`（打印将发生什么；不进行任何更改）
- `--no-onboard`（跳过入门流程）

### 环境变量

等效的环境变量（对自动化有用）：

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_GIT_DIR=...`
- `OPENCLAW_GIT_UPDATE=0|1`
- `OPENCLAW_NO_PROMPT=1`
- `OPENCLAW_DRY_RUN=1`
- `OPENCLAW_NO_ONBOARD=1`
- `SHARP_IGNORE_GLOBAL_LIBVIPS=0|1`（默认：`1`；避免 `sharp` 针对系统 libvips 进行构建）

## 故障排除：未找到 `openclaw`（PATH）

快速诊断：

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

如果 `$(npm prefix -g)/bin`（macOS/Linux）或 `$(npm prefix -g)`（Windows）**未**出现在 `echo "$PATH"` 中，您的 shell 就无法找到全局 npm 二进制文件（包括 `openclaw`）。

解决方法：将其添加到您的 shell 启动文件中（zsh：`~/.zshrc`，bash：`~/.bashrc`）：

```bash
# macOS / Linux
export PATH="$(npm prefix -g)/bin:$PATH"
```

在 Windows 上，将 `npm prefix -g` 的输出添加到您的 PATH。

然后打开一个新的终端（或在 zsh 中执行 `rehash` / 在 bash 中执行 `hash -r`）。

## 更新/卸载

- 更新：[更新](/install/updating)
- 迁移到新机器：[迁移](/install/migrating)
- 卸载：[卸载](/install/uninstall)
