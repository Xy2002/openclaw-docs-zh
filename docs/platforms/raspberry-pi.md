---
summary: OpenClaw on Raspberry Pi (budget self-hosted setup)
read_when:
  - Setting up OpenClaw on a Raspberry Pi
  - Running OpenClaw on ARM devices
  - Building a cheap always-on personal AI
---
# 在树莓派上运行 OpenClaw

## 目标

在树莓派上部署一个持久、始终在线的 OpenClaw 网关，一次性成本约为 **35–80 美元**（无月费）。此方案非常适合：

- 全天候个人AI助手
- 家庭自动化中枢
- 低功耗、随时可用的Telegram/WhatsApp机器人

## 硬件要求

| 树莓派型号 | 内存 | 是否可行？ | 备注 |
|------------|--------|----------|------|
| **Pi 5**   | 4GB/8GB | ✅ 最佳 | 速度最快，推荐使用 |
| **Pi 4**   | 4GB    | ✅ 良好 | 大多数用户的理想选择 |
| **Pi 4**   | 2GB    | ✅ 可行 | 可用，需添加交换空间 |
| **Pi 4**   | 1GB    | ⚠️ 吃力 | 可通过交换空间实现，配置需精简 |
| **Pi 3B+** | 1GB    | ⚠️ 缓慢 | 可用，但运行较慢 |
| **Pi Zero 2 W** | 512MB | ❌ | 不推荐 |

**最低配置：** 1GB 内存、1 核、500MB 磁盘  
**推荐配置：** 2GB 及以上内存、64 位操作系统、16GB 及以上 SD 卡（或 USB SSD）

所需物品

- 树莓派 4 或 5（推荐配备 2GB 及以上内存）
- MicroSD 卡（16GB 及以上）或 USB SSD（性能更优）
- 电源适配器（推荐使用官方 Pi 电源适配器）
- 网络连接（以太网或 WiFi）
- 大约 30 分钟时间

## 1) 刷写操作系统

使用 **Raspberry Pi OS Lite（64 位）**——无需桌面环境即可运行无头服务器。

1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. 选择操作系统：**Raspberry Pi OS Lite（64 位）**
3. 点击齿轮图标（⚙️）进行预配置：
   - 设置主机名：`gateway-host`
   - 启用 SSH
   - 设置用户名/密码
   - 配置 WiFi（如果不使用以太网）
4. 将镜像刷写到 SD 卡或 USB 驱动器
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

## 4) 安装 Node.js 22（ARM64）

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v22.x.x
npm --version
```

## 5) 添加交换空间（对于2GB或更少内存至关重要）

交换空间可以防止因内存不足而导致的崩溃：

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

### 选项A：标准安装（推荐）

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

### 选项B：可破解安装（适合折腾）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

可hack安装使您能够直接访问日志和代码，有助于调试ARM特定问题。

## 7) 运行入门向导

```bash
openclaw onboard --install-daemon
```

按照向导操作：

1. **网关模式：** 本地
2. **认证：** 推荐使用 API 密钥（在无头树莓派上，OAuth 可能比较麻烦）
3. **渠道：** 从 Telegram 入手最简单
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

SD卡速度慢且容易磨损。使用USB SSD可显著提升性能：

```bash
# Check if booting from USB
lsblk
```

有关设置，请参阅 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

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

__HEADING_0__ARM 特定注意事项

### 二进制兼容性

大多数 OpenClaw 功能在 ARM64 上均可正常运行，但某些外部二进制文件可能需要针对 ARM 构建的版本：

| 工具       | ARM64 状态 | 备注 |
|------------|------------|------|
| Node.js    | ✅         | 运行良好 |
| WhatsApp (Baileys) | ✅ | 纯 JS，无问题 |
| Telegram   | ✅         | 纯 JS，无问题 |
| gog（Gmail CLI） | ⚠️ | 检查是否有 ARM 版本 |
| Chromium（浏览器） | ✅ | `sudo apt install chromium-browser`

如果某个技能无法运行，请检查其二进制文件是否提供 ARM 构建版本。许多 Go 和 Rust 工具都支持 ARM 构建，但有些工具不支持。

### 32位与64位

**始终使用 64 位操作系统。** Node.js 和许多现代工具都需要 64 位系统。可通过以下命令检查：

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## 推荐模型配置

由于树莓派仅用作网关（模型在云端运行），请使用基于 API 的模型：

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

**不要尝试在树莓派上运行本地大语言模型**——即使是小型模型也过于缓慢。让 Claude/GPT 承担繁重的计算任务。

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

故障排除

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

__HEADING_0__ARM二进制问题

如果某个技能因“exec 格式错误”而失败：

1. 检查该二进制文件是否有 ARM64 构建版本
2. 尝试从源代码构建
3. 或使用支持 ARM 的 Docker 容器

__HEADING_0__WiFi断连

对于使用 WiFi 的无头树莓派：

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 成本对比

| 设置           | 一次性成本 | 月费     | 备注 |
|----------------|------------|----------|------|
| **树莓派 4（2GB）** | ~$45      | $0       | + 电源 (~$5/年) |
| **树莓派 4（4GB）** | ~$55      | $0       | 推荐 |
| **树莓派 5（4GB）** | ~$60      | $0       | 性能最佳 |
| **树莓派 5（8GB）** | ~$80      | $0       | 功能过于强大，但更具未来潜力 |
| DigitalOcean   | $0        | $6/月   | $72/年 |
| Hetzner        | $0        | €3.79/月 | ~$50/年 |

**盈亏平衡点：** 树莓派在约6–12个月内即可收回成本，优于云VPS。

---

## 更多信息

- [Linux 指南](/platforms/linux) — 通用 Linux 设置
- [DigitalOcean 指南](/platforms/digitalocean) — 云替代方案
- [Hetzner 指南](/platforms/hetzner) — Docker 设置
- [Tailscale](/gateway/tailscale) — 实现远程访问
- [Nodes](/nodes) — 将您的笔记本电脑/手机与树莓派网关配对
