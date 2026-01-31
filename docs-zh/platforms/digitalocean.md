---
summary: OpenClaw on DigitalOcean (simple paid VPS option)
read_when:
  - Setting up OpenClaw on DigitalOcean
  - Looking for cheap VPS hosting for OpenClaw
---
# 在 DigitalOcean 上部署 OpenClaw

## 目标

在 DigitalOcean 上以 **每月 6 美元**（或使用预留定价时每月 4 美元）的价格运行一个持久的 OpenClaw 网关。

如果你想要一个零成本选项，并且不介意使用 ARM 架构及特定云提供商的设置，可以参考 [Oracle Cloud 指南](/platforms/oracle)。

## 成本对比（2026 年）

| 云提供商 | 方案 | 规格 | 月费 | 备注 |
|----------|------|-------|----------|-------|
| Oracle Cloud | Always Free ARM | 最高 4 OCPU，24GB RAM | $0 | ARM 架构，容量有限，注册流程较为复杂 |
| Hetzner | CX22 | 2 vCPU，4GB RAM | €3.79（约 $4） | 最便宜的付费方案 |
| DigitalOcean | Basic | 1 vCPU，1GB RAM | $6 | 界面简单易用，文档完善 |
| Vultr | Cloud Compute | 1 vCPU，1GB RAM | $6 | 数据中心分布广泛 |
| Linode | Nanode | 1 vCPU，1GB RAM | $5 | 现为 Akamai 旗下 |

**选择云提供商：**
- DigitalOcean：最简单的用户体验 + 可预测的部署流程（本指南）
- Hetzner：性价比高（参见 [Hetzner 指南](/platforms/hetzner)）
- Oracle Cloud：可实现零成本，但配置更复杂且仅支持 ARM 架构（参见 [Oracle 指南](/platforms/oracle)）

---

## 前置条件

- DigitalOcean 账户（[注册即享 200 美元免费额度](https://m.do.co/c/signup)）
- SSH 密钥对（或愿意使用密码认证）
- 大约 20 分钟时间

## 1) 创建 Droplet

1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)
2. 点击 **创建 → Droplets**
3. 选择：
   - **区域：** 最接近你或你的用户的区域
   - **镜像：** Ubuntu 24.04 LTS
   - **规格：** Basic → Regular → **$6/月**（1 vCPU，1GB RAM，25GB SSD）
   - **认证方式：** 推荐使用 SSH 密钥，也可使用密码
4. 点击 **创建 Droplet**
5. 记下 IP 地址

## 2) 通过 SSH 连接

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) 安装 OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.bot/install.sh | bash

# Verify
openclaw --version
```

## 4) 运行初始化向导

```bash
openclaw onboard --install-daemon
```

向导将引导你完成以下步骤：
- 模型认证（API 密钥或 OAuth）
- 渠道设置（Telegram、WhatsApp、Discord 等）
- 网关令牌（自动生成）
- 守护进程安装（systemd）

## 5) 验证网关

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) 访问仪表板

默认情况下，网关绑定到环回地址。要访问控制界面：

**选项 A：SSH 隧道（推荐）**
```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**选项 B：Tailscale Serve（HTTPS，仅限环回）**
```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

打开： `https://<magicdns>/`

注意事项：
- Serve 会将网关限制为仅在环回地址上运行，并通过 Tailscale 身份标头进行身份验证。
- 如果需要使用令牌或密码进行验证，可设置 `gateway.auth.allowTailscale: false` 或使用 `gateway.auth.mode: "password"`。

**选项 C：Tailnet 绑定（无需 Serve）**
```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

打开： `http://<tailscale-ip>:18789`（需要令牌）。

## 7) 连接你的渠道

### Telegram
```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp
```bash
openclaw channels login whatsapp
# Scan QR code
```

有关其他提供商的信息，请参阅 [渠道](/channels)。

---

## 针对 1GB RAM 的优化

6 美元的 Droplet 仅有 1GB RAM。为确保系统平稳运行：

### 添加交换分区（推荐）
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 使用轻量级模型
如果遇到内存不足问题，可以考虑：
- 使用基于 API 的模型（Claude、GPT）而非本地模型
- 将 `agents.defaults.model.primary` 设置为较小的模型

### 监控内存
```bash
free -h
htop
```

---

## 持久性

所有状态存储在以下位置：
- `~/.openclaw/` — 配置、凭据、会话数据
- `~/.openclaw/workspace/` — 工作空间（SOUL.md、记忆等）

这些文件在重启后仍会保留。请定期备份：
```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

---

## Oracle Cloud 免费替代方案

Oracle Cloud 提供 **Always Free** ARM 实例，其性能远超此处任何付费方案——而且完全免费。

| 你能获得什么 | 规格 |
|--------------|-------|
| **4 OCPUs** | ARM Ampere A1 |
| **24GB RAM** | 完全足够 |
| **200GB 存储** | 块存储卷 |
| **永久免费** | 不收取信用卡费用 |

**注意事项：**
- 注册过程可能比较复杂（失败时请重试）
- ARM 架构——大多数软件都能正常运行，但部分二进制文件需要 ARM 版本

有关完整部署指南，请参阅 [Oracle Cloud](/platforms/oracle)。有关注册技巧和注册流程故障排除，请参阅此 [社区指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)。

---

## 故障排除

### 网关无法启动
```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl -u openclaw --no-pager -n 50
```

### 端口已被占用
```bash
lsof -i :18789
kill <PID>
```

### 内存不足
```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 参考资料

- [Hetzner 指南](/platforms/hetzner) — 更便宜、性能更强
- [Docker 安装](/install/docker) — 容器化部署
- [Tailscale](/gateway/tailscale) — 安全的远程访问
- [配置](/gateway/configuration) — 完整配置参考
