---
summary: Linux support + companion app status
read_when:
  - Looking for Linux companion app status
  - Planning platform coverage or contributions
---
__HEADING_0__Linux 应用

网关在 Linux 上得到全面支持。**推荐使用 Node 作为运行时**。
不建议在网关中使用 Bun（存在 WhatsApp/Telegram 相关的 bug）。

我们计划开发原生 Linux 应用。如果你愿意参与构建此类应用，欢迎贡献代码。

## 初学者快速通道（VPS）

1) 安装 Node 22+
2) `npm i -g openclaw@latest`
3) `openclaw onboard --install-daemon`
4) 在你的笔记本上：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5) 打开 `http://127.0.0.1:18789/` 并粘贴你的令牌

详细的VPS指南：[exe.dev](/platforms/exe-dev)

## 安装

- [入门指南](/start/getting-started)
- [安装与更新](/install/updating)
- 可选流程：[Bun（实验性）](/install/bun)、[Nix](/install/nix)、[Docker](/install/docker)

## 网关

- [网关操作手册](/gateway)
- [配置](/gateway/configuration)

## 网关服务安装（命令行界面）

使用以下任一方法：

```
openclaw onboard --install-daemon
```

或者：

```
openclaw gateway install
```

或者：

```
openclaw configure
```

在提示时选择**网关服务**。

修复/迁移：

```
openclaw doctor
```

## 系统控制（systemd 用户单元）

OpenClaw 默认会安装一个 systemd **用户**服务。对于共享服务器或始终在线的服务器，请使用 **系统**服务。有关完整的单元示例和相关说明，请参阅 [网关操作手册](/gateway)。

最小化设置：

创建 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`：

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

启用它：

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
