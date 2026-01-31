---
summary: >-
  Automated, hardened OpenClaw installation with Ansible, Tailscale VPN, and
  firewall isolation
read_when:
  - You want automated server deployment with security hardening
  - You need firewall-isolated setup with VPN access
  - You're deploying to remote Debian/Ubuntu servers
---
# Ansible 安装

将 OpenClaw 部署到生产服务器的推荐方式是通过 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — 一个以安全为先的自动化安装程序。

## 快速入门

一键安装命令：

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

> **📦 完整指南：[github.com/openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**
>
> openclaw-ansible 仓库是 Ansible 部署的事实来源。本页面仅提供快速概览。

## 您将获得的内容

- 🔒 **防火墙优先的安全性**：UFW + Docker 隔离（仅 SSH 和 Tailscale 可访问）
- 🔐 **Tailscale VPN**：无需公开暴露服务即可实现安全的远程访问
- 🐳 **Docker**：隔离的沙盒容器，仅绑定到本地主机
- 🛡️ **纵深防御**：4 层安全架构
- 🚀 **一键部署**：几分钟内完成完整部署
- 🔧 **Systemd 集成**：启动时自动运行并进行加固

## 系统要求

- **操作系统**：Debian 11+ 或 Ubuntu 20.04+
- **权限**：root 或 sudo 权限
- **网络**：用于软件包安装的互联网连接
- **Ansible**：2.14+（由快速入门脚本自动安装）

## 安装内容

Ansible playbook 会安装并配置以下内容：

1. **Tailscale**（用于安全远程访问的网状 VPN）
2. **UFW 防火墙**（仅开放 SSH 和 Tailscale 端口）
3. **Docker CE + Compose V2**（用于代理沙盒）
4. **Node.js 22.x + pnpm**（运行时依赖）
5. **OpenClaw**（基于主机而非容器化）
6. **Systemd 服务**（带安全加固的自动启动）

注意：网关 **直接运行在主机上**（不在 Docker 中），但代理沙盒使用 Docker 进行隔离。有关详细信息，请参阅 [沙盒化](/gateway/sandboxing)。

## 安装后设置

安装完成后，切换到 openclaw 用户：

```bash
sudo -i -u openclaw
```

安装后脚本将引导您完成以下步骤：

1. **入职向导**：配置 OpenClaw 设置
2. **提供商登录**：连接 WhatsApp/Telegram/Discord/Signal
3. **网关测试**：验证安装是否成功
4. **Tailscale 设置**：连接到您的 VPN 网状网络

### 快速命令

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## 安全架构

### 四层防御

1. **防火墙（UFW）**：仅公开暴露 SSH（22）和 Tailscale（41641/udp）端口
2. **VPN（Tailscale）**：网关仅可通过 VPN 网状网络访问
3. **Docker 隔离**：DOCKER-USER iptables 链可防止外部端口暴露
4. **Systemd 加固**：NoNewPrivileges、PrivateTmp、非特权用户

### 验证

测试外部攻击面：

```bash
nmap -p- YOUR_SERVER_IP
```

应显示 **仅端口 22**（SSH）处于开放状态。所有其他服务（网关、Docker）均已锁定。

### Docker 的可用性

Docker 是为 **代理沙盒**（隔离工具执行）而安装的，而不是用于运行网关本身。网关仅绑定到本地主机，并可通过 Tailscale VPN 访问。

有关沙盒配置的详细信息，请参阅 [多代理沙盒与工具](/multi-agent-sandbox-tools)。

## 手动安装

如果您更倾向于手动控制自动化流程：

```bash
# 1. Install prerequisites
sudo apt update && sudo apt install -y ansible git

# 2. Clone repository
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 3. Install Ansible collections
ansible-galaxy collection install -r requirements.yml

# 4. Run playbook
./run-playbook.sh

# Or run directly (then manually execute /tmp/openclaw-setup.sh after)
# ansible-playbook playbook.yml --ask-become-pass
```

## 更新 OpenClaw

Ansible 安装程序为 OpenClaw 设置了手动更新机制。有关标准更新流程，请参阅 [更新](/install/updating)。

要重新运行 Ansible playbook（例如进行配置更改）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

注意：此操作是幂等的，可多次安全运行。

## 故障排除

### 防火墙阻止了我的连接

如果您被锁定：
- 请确保您首先可以通过 Tailscale VPN 访问
- SSH 访问（端口 22）始终允许
- 根据设计，网关 **仅** 可通过 Tailscale 访问

### 服务无法启动

```bash
# Check logs
sudo journalctl -u openclaw -n 100

# Verify permissions
sudo ls -la /opt/openclaw

# Test manual start
sudo -i -u openclaw
cd ~/openclaw
pnpm start
```

### Docker 沙盒问题

```bash
# Verify Docker is running
sudo systemctl status docker

# Check sandbox image
sudo docker images | grep openclaw-sandbox

# Build sandbox image if missing
cd /opt/openclaw/openclaw
sudo -u openclaw ./scripts/sandbox-setup.sh
```

### 提供商登录失败

请确保您是以 `openclaw` 用户身份运行：

```bash
sudo -i -u openclaw
openclaw channels login
```

## 高级配置

有关详细的安全架构和故障排除信息：
- [安全架构](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技术细节](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [故障排除指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相关内容

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — 完整部署指南
- [Docker](/install/docker) — 容器化网关设置
- [沙盒化](/gateway/sandboxing) — 代理沙盒配置
- [多代理沙盒与工具](/multi-agent-sandbox-tools) — 每个代理的隔离
