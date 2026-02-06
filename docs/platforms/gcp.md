---
summary: >-
  Run OpenClaw Gateway 24/7 on a GCP Compute Engine VM (Docker) with durable
  state
read_when:
  - You want OpenClaw running 24/7 on GCP
  - 'You want a production-grade, always-on Gateway on your own VM'
  - 'You want full control over persistence, binaries, and restart behavior'
---
# 在 GCP Compute Engine 上运行 OpenClaw（Docker 生产 VPS 指南）

## 目标

在 GCP Compute Engine 虚拟机上使用 Docker 运行一个持久化的 OpenClaw 网关，确保状态持久、内置二进制文件，并具备安全的重启行为。

如果你希望以每月约5至12美元的成本让“OpenClaw”全天候运行，那么在Google Cloud上部署是一个可靠的选择。价格因机器类型和区域而异；请根据你的工作负载选择最小的虚拟机实例，如果遇到内存不足的问题再考虑升级。

## 我们要做什么？（简要说明）

- 创建一个 GCP 项目并启用计费
- 创建一个 Compute Engine 虚拟机
- 安装 Docker（用于隔离的应用运行时）
- 在 Docker 中启动 OpenClaw 网关
- 将 `~/.openclaw` 和 `~/.openclaw/workspace` 的状态持久化到主机上（以便在重启或重建后仍能保留）
- 通过 SSH 隧道从笔记本电脑访问控制 UI

网关可通过以下方式访问：

- 通过笔记本电脑的SSH端口转发进行访问
- 如果你自行管理防火墙和令牌，可以直接暴露端口进行访问

本指南以Debian作为GCP Compute Engine的操作系统。Ubuntu同样适用，只需相应调整软件包即可。有关通用的Docker流程，请参阅[Docker](/install/docker)。

---

## 快速路径（适用于有经验的操作人员）

1) 创建 GCP 项目并启用 Compute Engine API
2) 创建 Compute Engine 虚拟机（e2-small，Debian 12，20GB）
3) 通过 SSH 登录到虚拟机
4) 安装 Docker
5) 克隆 OpenClaw 仓库
6) 创建持久化的主机目录
7) 配置 `.env` 和 `docker-compose.yml`
8) 构建所需的二进制文件，构建镜像并启动容器

---

## 所需条件

- GCP 帐户（e2-micro 实例可享受免费层级）
- 已安装 gcloud CLI（或可使用 Cloud Console）
- 能从笔记本电脑通过 SSH 进行访问
- 对 SSH 以及复制/粘贴操作有一定了解
- 预计耗时 20–30 分钟
- Docker 和 Docker Compose
- 模型身份验证凭据
- 可选的提供商凭据：
  - WhatsApp QR 码
  - Telegram 机器人令牌
  - Gmail OAuth 凭据

---

## 1) 安装 gcloud CLI（或使用控制台）

**选项 A：gcloud CLI**（推荐用于自动化）

从 https://cloud.google.com/sdk/docs/install 安装。

初始化并认证：

```bash
gcloud init
gcloud auth login
```

**选项B：云控制台**

所有步骤均可通过https://console.cloud.google.com上的网页界面完成。

---

## 2) 创建 GCP 项目

**命令行界面：**

```bash
gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
gcloud config set project my-openclaw-project
```

在 https://console.cloud.google.com/billing 上启用计费（Compute Engine 所需）。

启用 Compute Engine API：

```bash
gcloud services enable compute.googleapis.com
```

**控制台：**

1. 转到“IAM 和管理”>“创建项目”
2. 为项目命名并创建
3. 为项目启用计费
4. 导航到“API 和服务”>“启用 API”> 搜索“Compute Engine API”> 启用

---

## 3) 创建虚拟机

**机器类型：**

| 类型 | 规格 | 成本 | 备注 |
|------|-------|------|-------|
| e2-small | 2 vCPU，2GB 内存 | ~$12/月 | 推荐 |
| e2-micro | 2 vCPU（共享），1GB 内存 | 符合免费层级 | 在高负载下可能触发 OOM |

**命令行界面：**

```bash
gcloud compute instances create openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

**控制台：**

1. 转到 Compute Engine > 虚拟机实例 > 创建实例
2. 名称： `openclaw-gateway`
3. 区域： `us-central1`，可用区： `us-central1-a`
4. 机器类型： `e2-small`
5. 引导磁盘：Debian 12，20GB
6. 创建

---

## 4) 通过 SSH 登录到虚拟机

**命令行界面：**

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

**控制台：**

在 Compute Engine 仪表板中，点击你的虚拟机旁边的“SSH”按钮。

注意：SSH密钥传播可能需要1–2分钟才能生效。如果连接被拒绝，请稍后再试。

---

## 5) 在虚拟机上安装 Docker

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

注销并重新登录以使组更改生效：

```bash
exit
```

然后再次通过 SSH 登录：

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

验证：

```bash
docker --version
docker compose version
```

---

## 6) 克隆 OpenClaw 仓库

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

本指南假定您将构建自定义镜像，以确保二进制文件的持久性。

---

## 7) 创建持久化的主机目录

Docker容器是临时的。所有长期状态必须存储在主机上。

```bash
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
```

---

## 8) 配置环境变量

在仓库根目录中创建 `.env`。

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

生成强密码：

```bash
openssl rand -hex 32
```

**请勿提交此文件。**

---

## 9) 配置 Docker Compose

创建或更新 `docker-compose.yml`。

```yaml
services:
  openclaw-gateway:
    image: ${OPENCLAW_IMAGE}
    build: .
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HOME=/home/node
      - NODE_ENV=production
      - TERM=xterm-256color
      - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
      - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
      - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
      - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
    ports:
      # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
      # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
      - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"

      # Optional: only if you run iOS/Android nodes against this VM and need Canvas host.
      # If you expose this publicly, read /gateway/security and firewall accordingly.
      # - "18793:18793"
    command:
      [
        "node",
        "dist/index.mjs",
        "gateway",
        "--bind",
        "${OPENCLAW_GATEWAY_BIND}",
        "--port",
        "${OPENCLAW_GATEWAY_PORT}"
      ]
```

---

## 10) 在镜像中烘焙所需的二进制文件（关键步骤）

在运行中的容器内安装二进制文件是一个陷阱。任何在运行时安装的内容在重启后都会丢失。

构建镜像时必须安装技能所需的所有外部二进制文件。

下面的示例仅展示了三种常见的二进制文件：

- `gog` 用于访问 Gmail
- `goplaces` 用于 Google Places
- `wacli` 用于 WhatsApp

这些只是示例，并非完整列表。你可以按照相同的模式安装任意数量的二进制文件。

如果你以后添加了依赖于其他二进制文件的新技能，你需要：

1. 更新 Dockerfile
2. 重新构建镜像
3. 重启容器

**Dockerfile 示例**

```dockerfile
FROM node:22-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.mjs"]
```

---

## 11) 构建并启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

验证二进制文件：

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

预期输出：

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

---

## 12) 验证网关

```bash
docker compose logs -f openclaw-gateway
```

成功：

```
[gateway] listening on ws://0.0.0.0:18789
```

---

## 13) 从笔记本电脑访问

创建一个 SSH 隧道以转发网关端口：

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

在浏览器中打开：

`http://127.0.0.1:18789/`

粘贴你的网关令牌。

---

## 数据持久化的具体位置（事实来源）

OpenClaw 在 Docker 中运行，但 Docker 并非事实来源。所有长期状态在重启、重建和重新启动后都必须依然存在。

| 组件 | 位置 | 持久化机制 | 备注 |
|---|---|---|---|
| 网关配置 | `/home/node/.openclaw/` | 主机卷挂载 | 包含 `openclaw.json` 和令牌 |
| 模型身份验证配置文件 | `/home/node/.openclaw/` | 主机卷挂载 | OAuth 令牌和 API 密钥 |
| 技能配置 | `/home/node/.openclaw/skills/` | 主机卷挂载 | 技能级别的状态 |
| 代理工作区 | `/home/node/.openclaw/workspace/` | 主机卷挂载 | 代码和代理工件 |
| WhatsApp 会话 | `/home/node/.openclaw/` | 主机卷挂载 | 保留 QR 登入状态 |
| Gmail 密钥环 | `/home/node/.openclaw/` | 主机卷 + 密码 | 需要 `GOG_KEYRING_PASSWORD` |
| 外部二进制文件 | `/usr/local/bin/` | Docker 镜像 | 必须在构建时烘焙 |
| Node 运行时 | 容器文件系统 | Docker 镜像 | 每次构建镜像时都会重建 |
| 操作系统软件包 | 容器文件系统 | Docker 镜像 | 不要在运行时安装 |
| Docker 容器 | 临时 | 可重启 | 可安全销毁 |

---

## 更新

在虚拟机上更新 OpenClaw：

```bash
cd ~/openclaw
git pull
docker compose build
docker compose up -d
```

---

故障排除

**SSH连接被拒绝**

SSH密钥传播可能需要1–2分钟才能生效。请稍后再试。

**操作系统登录问题**

检查你的 OS Login 配置：

```bash
gcloud compute os-login describe-profile
```

确保您的账户具有必要的 IAM 权限（Compute OS Login 或 Compute OS Admin Login）。

**内存不足 (OOM)**

如果使用 e2-micro 并遇到内存不足问题，可升级到 e2-small 或 e2-medium。

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## 服务账户（安全最佳实践）

对于个人使用，你的默认用户账户就足够了。

对于自动化或 CI/CD 流水线，创建一个权限最小化的专用服务账户：

1. 创建服务账户：

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. 授予计算实例管理员角色（或更细化的自定义角色）：

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

避免在自动化中使用所有者角色。遵循最小权限原则。

有关 IAM 角色的详细信息，请参阅 https://cloud.google.com/iam/docs/understanding-roles。

---

## 后续步骤

- 设置消息通道： [通道](/channels)
- 将本地设备配对为节点： [节点](/nodes)
- 配置网关： [网关配置](/gateway/configuration)
