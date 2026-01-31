---
summary: OpenClaw on Oracle Cloud (Always Free ARM)
read_when:
  - Setting up OpenClaw on Oracle Cloud
  - Looking for low-cost VPS hosting for OpenClaw
  - Want 24/7 OpenClaw on a small server
---
# 在 Oracle Cloud (OCI) 上运行 OpenClaw

## 目标

在 Oracle Cloud 的 **Always Free** ARM 层上运行一个持久的 OpenClaw 网关。

Oracle 的免费层非常适合 OpenClaw（尤其是如果你已经拥有 OCI 账户），但这也带来了一些权衡：

- ARM 架构（大多数功能正常，但某些二进制文件可能仅支持 x86）
- 容量和注册可能存在限制

## 成本对比（2026 年）

| 供应商 | 方案 | 规格 | 月费 | 备注 |
|----------|------|-------|----------|-------|
| Oracle Cloud | Always Free ARM | 最高 4 OCPU，24GB RAM | $0 | ARM，容量有限 |
| Hetzner | CX22 | 2 vCPU，4GB RAM | ~ $4 | 最便宜的付费方案 |
| DigitalOcean | Basic | 1 vCPU，1GB RAM | $6 | 界面友好，文档完善 |
| Vultr | Cloud Compute | 1 vCPU，1GB RAM | $6 | 数据中心分布广泛 |
| Linode | Nanode | 1 vCPU，1GB RAM | $5 | 现为 Akamai 旗下 |

---

## 先决条件

- Oracle Cloud 账户（[注册](https://www.oracle.com/cloud/free/)) — 如果遇到问题，请参阅 [社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账户（免费，访问 [tailscale.com](https://tailscale.com))
- 大约 30 分钟

## 1) 创建 OCI 实例

1. 登录 [Oracle Cloud 控制台](https://cloud.oracle.com/)
2. 导航到 **计算 → 实例 → 创建实例**
3. 配置：
   - **名称：** `openclaw`
   - **镜像：** Ubuntu 24.04 (aarch64)
   - **形状：** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs：** 2（或最多 4）
   - **内存：** 12 GB（或最多 24 GB）
   - **启动卷：** 50 GB（免费最高 200 GB）
   - **SSH 密钥：** 添加你的公钥
4. 点击 **创建**
5. 记下公网 IP 地址

**提示：** 如果实例创建失败并显示“容量不足”，请尝试不同的可用性域，或稍后再试。免费层的容量有限。

## 2) 连接并更新

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注意：** `build-essential` 是编译部分依赖项所需的 ARM 工具链。

## 3) 配置用户和主机名

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) 安装 Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

这将启用 Tailscale SSH，因此你可以通过 `ssh openclaw` 从你尾网中的任何设备连接——无需公网 IP。

验证：
```bash
tailscale status
```

**从现在起，通过 Tailscale 连接：** `ssh ubuntu@openclaw`（或使用 Tailscale IP）。

## 5) 安装 OpenClaw

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
source ~/.bashrc
```

当系统提示“你想如何孵化你的机器人？”时，选择 **“稍后操作”**。

> 注意：如果遇到 ARM 原生构建问题，先尝试系统包（例如 `sudo apt install -y build-essential`），再考虑使用 Homebrew。

## 6) 配置网关（环回 + 令牌认证）并启用 Tailscale Serve

默认使用令牌认证。这种方式更可靠，且无需使用任何“不安全认证”的 Control UI 标志。

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway
```

## 7) 验证

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) 锁定 VCN 安全

现在一切已就绪，锁定 VCN 以阻止除 Tailscale 之外的所有流量。OCI 的虚拟云网络充当网络边缘的防火墙——流量在到达你的实例之前就被拦截。

1. 在 OCI 控制台中，转到 **网络 → 虚拟云网络**
2. 点击你的 VCN → **安全列表** → 默认安全列表
3. **移除**所有入站规则，仅保留：
   - `0.0.0.0/0 UDP 41641`（Tailscale）
4. 保持默认出站规则（允许所有出站流量）

这将在网络边缘阻止 SSH 端口 22、HTTP、HTTPS 以及其他所有流量。从现在起，你只能通过 Tailscale 进行连接。

---

## 访问 Control UI

从你 Tailscale 网络中的任何设备：

```
https://openclaw.<tailnet-name>.ts.net/
```

将 `<tailnet-name>` 替换为你尾网的名称（可在 `tailscale status` 中查看）。

无需 SSH 隧道。Tailscale 提供：
- HTTPS 加密（自动证书）
- 通过 Tailscale 身份进行认证
- 可从你尾网中的任何设备（笔记本电脑、手机等）访问

---

## 安全：VCN + Tailscale（推荐基线）

通过锁定 VCN（仅开放 UDP 41641）并将网关绑定到环回地址，你可以获得强大的纵深防御：公共流量在网络边缘被拦截，管理访问则通过你的尾网进行。

这种设置通常可以消除对额外基于主机的防火墙规则的需求——这些规则原本是为了防止针对互联网的 SSH 暴力破解攻击。不过，你仍应保持操作系统更新，运行 `openclaw security audit`，并确保自己没有意外监听公共接口。

### 已经受到保护的内容

| 传统步骤 | 是否需要？ | 为什么 |
|------------------|---------|-----|
| UFW 防火墙 | 否 | VCN 在流量到达实例前即已拦截 |
| fail2ban | 否 | 如果 VCN 已封锁端口 22，则不存在暴力破解风险 |
| sshd 强化 | 否 | Tailscale SSH 不使用 sshd |
| 禁用 root 登录 | 否 | Tailscale 使用 Tailscale 身份，而非系统用户 |
| 仅限 SSH 密钥认证 | 否 | Tailscale 通过尾网身份进行认证 |
| IPv6 强化 | 通常不需要 | 取决于你的 VCN/子网设置；需确认实际分配或暴露的内容 |

### 仍然推荐的操作

- **凭证权限：** `chmod 700 ~/.openclaw`
- **安全审计：** `openclaw security audit`
- **系统更新：** 定期运行 `sudo apt update && sudo apt upgrade`
- **监控 Tailscale：** 查看 [Tailscale 管理控制台](https://login.tailscale.com/admin) 中的设备

### 验证安全状态

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## 备用方案：SSH 隧道

如果 Tailscale Serve 无法正常工作，可使用 SSH 隧道：

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

---

## 故障排除

### 实例创建失败（“容量不足”）
免费层的 ARM 实例很受欢迎。可尝试：
- 更改可用性域
- 在非高峰时段重试（如清晨）
- 在选择实例形状时使用“Always Free”筛选器

### Tailscale 无法连接
```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### 网关无法启动
```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway -n 50
```

### 无法访问 Control UI
```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway
```

### ARM 二进制问题
某些工具可能没有 ARM 版本。请检查：
```bash
uname -m  # Should show aarch64
```

大多数 npm 包都能正常运行。对于二进制文件，可查找 `linux-arm64` 或 `aarch64` 发布版本。

---

## 持久性

所有状态存储在：
- `~/.openclaw/` — 配置、凭据、会话数据
- `~/.openclaw/workspace/` — 工作空间（SOUL.md、记忆、工件）

请定期备份：
```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

---

## 参见

- [Gateway 远程访问](/gateway/remote) — 其他远程访问模式
- [Tailscale 集成](/gateway/tailscale) — Tailscale 完整文档
- [Gateway 配置](/gateway/configuration) — 所有配置选项
- [DigitalOcean 指南](/platforms/digitalocean) — 如果你希望付费且注册更简便
- [Hetzner 指南](/platforms/hetzner) — 基于 Docker 的替代方案
