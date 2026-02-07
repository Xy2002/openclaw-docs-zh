---
summary: >-
  Run OpenClaw in a sandboxed macOS VM (local or hosted) when you need isolation
  or iMessage
read_when:
  - You want OpenClaw isolated from your main macOS environment
  - You want iMessage integration (BlueBubbles) in a sandbox
  - You want a resettable macOS environment you can clone
  - You want to compare local vs hosted macOS VM options
---
# 在 macOS 虚拟机上运行 OpenClaw（沙箱环境）

## 推荐的默认方案（适用于大多数用户）

- **小型 Linux VPS**：用作始终在线的网关，且成本低廉。请参阅 [VPS 托管](/vps)。
- **专用硬件**（Mac mini 或 Linux 服务器）：如果您希望完全掌控并为浏览器自动化获取“住宅 IP”。许多网站会屏蔽数据中心 IP，因此在本地浏览器中操作通常效果更好。
- **混合方案**：将网关部署在廉价 VPS 上，当您需要浏览器或 UI 自动化时，再将您的 Mac 连接为一个 **节点**。请参阅 [节点](/nodes) 和 [远程网关](/gateway/remote)。

当您特别需要仅限 macOS 的功能（如 iMessage/BlueBubbles），或者希望与日常使用的 Mac 实现严格隔离时，可以使用 macOS 虚拟机。

## macOS 虚拟机选项

### 在 Apple Silicon Mac 上运行本地虚拟机（Lume）

使用 [Lume](https://cua.ai/docs/lume)，在您现有的 Apple Silicon Mac 上以沙箱方式运行 OpenClaw 的 macOS 虚拟机。

这样您可以获得：

- 提供完整的macOS环境并实现隔离，确保主机保持干净
- 通过BlueBubbles支持iMessage（在Linux/Windows上无法实现）
- 通过克隆虚拟机实现即时重置
- 无需额外的硬件或云成本

### 云端托管Mac服务提供商

如果您希望在云端使用 macOS，也可以选择托管 Mac 服务提供商：

- [MacStadium](https://www.macstadium.com/)（托管 Mac）
- 其他托管 Mac 供应商同样适用；请按照其提供的虚拟机 + SSH 文档进行操作。

一旦您获得对 macOS 虚拟机的 SSH 访问权限，请继续执行下面的第 6 步。

---

## 快速路径（Lume，适用于有经验的用户）

1. 安装 Lume
2. `lume create openclaw --os macos --ipsw latest`
3. 完成设置助理，启用远程登录（SSH）
4. `lume run openclaw --no-display`
5. 通过 SSH 登录，安装 OpenClaw，并配置通道
6. 完成

---

## 您需要准备什么（Lume）

- Apple Silicon Mac（M1/M2/M3/M4）
- 主机需运行 macOS Sequoia 或更高版本
- 每个虚拟机约需 60 GB 可用磁盘空间
- 大约需要 20 分钟

---

## 1) 安装 Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

如果 `~/.local/bin` 未在您的 PATH 中：

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

验证：

```bash
lume --version
```

文档：[Lume 安装](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) 创建 macOS 虚拟机

```bash
lume create openclaw --os macos --ipsw latest
```

此命令会下载 macOS 并创建虚拟机。VNC 窗口将自动打开。

注意：根据您的网络连接速度，下载可能需要一段时间。

---

## 3) 完成设置助理

在 VNC 窗口中：

1. 选择语言和区域
2. 跳过 Apple ID（或登录以稍后使用 iMessage）
3. 创建用户账户（请记住用户名和密码）
4. 跳过所有可选功能

设置完成后，启用 SSH：

1. 打开“系统设置”→“通用”→“共享”
2. 启用“远程登录”

---

## 4) 获取虚拟机的IP地址

```bash
lume get openclaw
```

查找IP地址（通常是`192.168.64.x`）。

---

## 5) 通过 SSH 登录到虚拟机

```bash
ssh youruser@192.168.64.X
```

将 `youruser` 替换为您创建的账户，将 IP 替换为您的虚拟机 IP。

---

## 6) 安装 OpenClaw

在虚拟机内部：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

按照引导提示设置您的模型提供商（Anthropic、OpenAI 等）。

---

## 7) 配置通道

编辑配置文件：

```bash
nano ~/.openclaw/openclaw.json
```

添加您的频道：

```json
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+15551234567"]
    },
    "telegram": {
      "botToken": "YOUR_BOT_TOKEN"
    }
  }
}
```

然后登录 WhatsApp（扫描二维码）：

```bash
openclaw channels login
```

---

## 8) 无头运行虚拟机

停止虚拟机并重新启动，但不显示界面：

```bash
lume stop openclaw
lume run openclaw --no-display
```

虚拟机会在后台运行。OpenClaw的守护进程将持续运行网关。

检查状态：

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 额外福利：iMessage集成

这是在 macOS 上运行的最大亮点。使用 [BlueBubbles](https://bluebubbles.app) 将 iMessage 添加到 OpenClaw。

在虚拟机内部：

1. 从 bluebubbles.app 下载 BlueBubbles
2. 使用您的 Apple ID 登录
3. 启用 Web API 并设置密码
4. 将 BlueBubbles 的 Webhook 指向您的网关（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）

将其添加到 OpenClaw 配置中：

```json
{
  "channels": {
    "bluebubbles": {
      "serverUrl": "http://localhost:1234",
      "password": "your-api-password",
      "webhookPath": "/bluebubbles-webhook"
    }
  }
}
```

重启网关。现在您的代理可以发送和接收 iMessage。

完整设置详情：[BlueBubbles 通道](/channels/bluebubbles)

---

## 保存黄金镜像

在进一步自定义之前，先快照保存干净状态：

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

随时重置：

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

全天候运行

要让虚拟机持续运行：

- 保持 Mac 插电
- 在“系统设置”→“节能”中禁用睡眠
- 如有必要，使用 `caffeinate`

若需实现真正的全天候运行，建议使用专用 Mac mini 或小型 VPS。请参阅 [VPS 托管](/vps)。

---

故障排除

| 问题 | 解决方案 |
|---------|----------|
| 无法通过 SSH 登录虚拟机 | 检查虚拟机的“系统设置”中是否已启用“远程登录” |
| 虚拟机 IP 未显示 | 等待虚拟机完全启动，再次运行 `lume get openclaw` |
| 找不到 Lume 命令 | 将 `~/.local/bin` 添加到您的 PATH |
| WhatsApp QR 码无法扫描 | 确保在运行 `openclaw channels login` 时已登录到虚拟机，而非主机 |

---

## 相关文档

- [VPS 托管](/vps)
- [节点](/nodes)
- [远程网关](/gateway/remote)
- [BlueBubbles 通道](/channels/bluebubbles)
- [Lume 快速入门](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 参考](https://cua.ai/docs/lume/reference/cli-reference)
- [无人值守虚拟机设置](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（进阶）
- [Docker 沙箱](/install/docker)（替代隔离方案）
