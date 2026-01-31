---
summary: OpenClaw on Raspberry Pi (budget self-hosted setup)
read_when:
  - Setting up OpenClaw on a Raspberry Pi
  - Running OpenClaw on ARM devices
  - Building a cheap always-on personal AI
---
# 在树莓派上运行 OpenClaw

## 目标

在树莓派上运行一个持久、始终在线的 OpenClaw 网关，一次性成本约为 **35–80 美元**（无月费）。非常适合：
- 全天候个人 AI 助手
- 家庭自动化中枢
- 低功耗、随时可用的 Telegram/WhatsApp 机器人

## 硬件要求

| 树莓派型号 | 内存 | 是否可行？ | 备注 |
|------------|--------|----------|------|
| **Pi 5**   | 4GB/8GB | ✅ 最佳 | 速度最快，推荐使用 |
| **Pi 4**   | 4GB    | ✅ 良好 | 大多数用户的理想选择 |
| **Pi 4**   | 2GB    | ✅ 可用 | 可运行，需添加交换空间 |
| **Pi 4**   | 1GB    | ⚠️ 吃力 | 可通过交换空间运行，配置需精简 |
| **Pi 3B+** | 1GB    | ⚠️ 缓慢 | 可运行，但性能较差 |
| **Pi Zero 2 W** | 512MB | ❌ | 不推荐 |

**最低配置：** 1GB RAM、1 核、500MB 磁盘  
**推荐配置：** 2GB+ RAM、64 位操作系统、16GB+ SD 卡（或 USB SSD）

## 所需物品

- 树莓派 4 或 5（推荐 2GB+）
- MicroSD 卡（16GB+）或 USB SSD（性能更优）
- 电源适配器（推荐使用官方 Pi PSU）
- 网络连接（以太网或 WiFi）
- 大约 30 分钟时间

## 1) 刷写操作系统

使用 **Raspberry Pi OS Lite（64 位）** — 无需桌面环境即可运行无头服务器。

1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. 选择操作系统：**Raspberry Pi OS Lite（64 位）**
3. 点击齿轮图标（⚙️）进行预配置：
   - 设置主机名：`gateway-host`
   - 启用 SSH
   - 设置用户名/密码
   - 配置 WiFi（如果不使用以太网）
4. 将系统刷写到 SD 卡或 USB 驱动器
5. 插入并启动树莓派

## 2) 通过 SSH 连接

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) 系统设置

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) 安装 Node.js 22（ARM64 版）

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v22.x.x
npm --version
```

## 5) 添加交换空间（对 2GB 或以下内存至关重要）

交换空间可防止因内存不足而导致的崩溃：

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) 安装 OpenClaw

### 选项 A：标准安装（推荐）

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

### 选项 B：可自定义安装（适合深度调试）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

可自定义安装允许您直接访问日志和代码，有助于排查 ARM 特有的问题。

## 7) 运行入门向导

```bash
openclaw onboard --install-daemon
```

按照向导操作：
1. **网关模式：** 本地
2. **认证：** 推荐使用 API 密钥（OAuth 在无头树莓派上可能比较麻烦）
3. **渠道：** 从 Telegram 开始最容易
4. **守护进程：** 是（使用 systemd）

## 8) 验证安装

```bash
# Check status
openclaw status

# Check service
sudo systemctl status openclaw

# View logs
journalctl -u openclaw -f
```

## 9) 访问仪表板

由于树莓派是无头的，可通过 SSH 隧道访问：

```bash
# From your laptop/desktop
ssh -L 18789:localhost:18789 user@gateway-host

# Then open in browser
open http://localhost:18789
```

或者使用 Tailscale 实现始终在线访问：

```bash
# On the Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Update config
openclaw config set gateway.bind tailnet
sudo systemctl restart openclaw
```

---

## 性能优化

### 使用 USB SSD（大幅提升性能）

SD 卡速度慢且易磨损。使用 USB SSD 可显著提升性能：

```bash
# Check if booting from USB
lsblk
```

有关设置详情，请参阅 [树莓派 USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

### 减少内存占用

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### 监控资源

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ARM 特定注意事项

### 二进制兼容性

大多数 OpenClaw 功能可在 ARM64 上运行，但某些外部二进制文件可能需要 ARM 构建版本：

| 工具       | ARM64 状态 | 备注 |
|------------|------------|------|
| Node.js    | ✅         | 运行良好 |
| WhatsApp（Baileys） | ✅ | 纯 JS，无问题 |
| Telegram   | ✅         | 纯 JS，无问题 |
| gog（Gmail CLI） | ⚠️ | 检查是否有 ARM 版本 |
| Chromium（浏览器） | ✅ | `sudo apt install chromium-browser` |

如果某个技能无法运行，请检查其二进制文件是否提供 ARM 构建版本。许多 Go/Rust 工具都支持；有些则不支持。

### 32 位 vs 64 位

**务必使用 64 位操作系统。** Node.js 和许多现代工具都需要 64 位环境。可通过以下命令检查：

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## 推荐模型配置

由于树莓派仅作为网关（模型在云端运行），请使用基于 API 的模型：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514",
        "fallbacks": ["openai/gpt-4o-mini"]
      }
    }
  }
}
```

**不要尝试在树莓派上运行本地 LLM** — 即使是小型模型也过于缓慢。让 Claude/GPT 承担繁重的计算任务。

---

## 开机自启动

入门向导会自动设置开机自启动，但您也可以通过以下命令进行验证：

```bash
# Check service is enabled
sudo systemctl is-enabled openclaw

# Enable if not
sudo systemctl enable openclaw

# Start on boot
sudo systemctl start openclaw
```

---

## 故障排除

### 内存不足（OOM）

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### 性能缓慢

- 使用 USB SSD 替代 SD 卡
- 禁用未使用的服务：`sudo systemctl disable cups bluetooth avahi-daemon`
- 检查 CPU 节流情况：`vcgencmd get_throttled`（应返回 `0x0`）

### 服务无法启动

```bash
# Check logs
journalctl -u openclaw --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
sudo systemctl restart openclaw
```

### ARM 二进制问题

如果某个技能因“exec 格式错误”而失败：
1. 检查该二进制文件是否有 ARM64 构建版本
2. 尝试从源代码构建
3. 或使用支持 ARM 的 Docker 容器

### WiFi 断连

对于使用 WiFi 的无头树莓派：

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 成本对比

| 设置           | 一次性成本 | 月度成本 | 备注 |
|----------------|------------|----------|------|
| **Pi 4（2GB）** | ~$45      | $0       | 加上电源费用（约 $5/年） |
| **Pi 4（4GB）** | ~$55      | $0       | 推荐使用 |
| **Pi 5（4GB）** | ~$60      | $0       | 性能最佳 |
| **Pi 5（8GB）** | ~$80      | $0       | 过于强大但更具未来性 |
| DigitalOcean   | $0        | $6/月   | 年费 $72 |
| Hetzner        | $0        | €3.79/月 | 年费约 $50 |

**盈亏平衡点：** 树莓派在约 6–12 个月内即可收回成本，优于云 VPS。

---

## 更多参考

- [Linux 指南](/platforms/linux) — 通用 Linux 设置
- [DigitalOcean 指南](/platforms/digitalocean) — 云替代方案
- [Hetzner 指南](/platforms/hetzner) — Docker 设置
- [Tailscale](/gateway/tailscale) — 远程访问
- [Nodes](/nodes) — 将您的笔记本电脑/手机与树莓派网关配对
