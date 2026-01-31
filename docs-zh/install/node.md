---
title: Node.js + npm (PATH sanity)
summary: 'Node.js + npm install sanity: versions, PATH, and global installs'
read_when:
  - You installed OpenClaw but `openclaw` is “command not found”
  - You’re setting up Node.js/npm on a new machine
  - npm install -g ... fails with permissions or PATH issues
---
# Node.js + npm（PATH 环境变量检查）

OpenClaw 的运行时基准是 **Node 22+**。

如果你可以成功运行 `npm install -g openclaw@latest`，但随后看到 `openclaw: command not found`，这几乎总是由 **PATH** 环境变量问题引起：npm 将全局二进制文件放置的目录未包含在你的 shell 的 PATH 中。

## 快速诊断

运行：

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

如果 `$(npm prefix -g)/bin`（macOS/Linux）或 `$(npm prefix -g)`（Windows）并未出现在 `echo "$PATH"` 内，那么你的 shell 就无法找到全局 npm 二进制文件（包括 `openclaw`）。

## 解决方案：将 npm 的全局 bin 目录添加到 PATH

1) 查找你的全局 npm 前缀：

```bash
npm prefix -g
```

2) 将全局 npm 的 bin 目录添加到你的 shell 启动文件中：

- zsh：`~/.zshrc`
- bash：`~/.bashrc`

示例（用你的 `npm prefix -g` 输出替换路径）：

```bash
# macOS / Linux
export PATH="/path/from/npm/prefix/bin:$PATH"
```

然后打开一个 **新终端**（或在 zsh 中运行 `rehash` / 在 bash 中运行 `hash -r`）。

在 Windows 上，将 `npm prefix -g` 的输出添加到你的 PATH。

## 解决方案：避免 `sudo npm install -g` 或权限错误（Linux）

如果 `npm install -g ...` 因 `EACCES` 而失败，请将 npm 的全局前缀切换到一个用户可写目录：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

将 `export PATH=...` 这一行永久添加到你的 shell 启动文件中。

## 推荐的 Node 安装选项

为了尽量减少意外情况，建议以以下方式安装 Node/npm：

- 确保 Node 始终保持最新版本（22+）
- 使全局 npm 的 bin 目录稳定，并在新 shell 中自动包含在 PATH 中

常见选择：

- macOS：Homebrew（`brew install node`）或版本管理器
- Linux：你偏好的版本管理器，或由发行版支持且提供 Node 22+ 的安装方式
- Windows：官方 Node 安装程序、`winget`，或适用于 Windows 的 Node 版本管理器

如果你使用版本管理器（nvm/fnm/asdf 等），请确保它已在你日常使用的 shell（zsh vs bash）中初始化，以便当你运行安装程序时，它设置的 PATH 已生效。
