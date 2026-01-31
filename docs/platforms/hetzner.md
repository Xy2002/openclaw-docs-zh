---
summary: >-
  Run OpenClaw Gateway 24/7 on a cheap Hetzner VPS (Docker) with durable state
  and baked-in binaries
read_when:
  - You want OpenClaw running 24/7 on a cloud VPS (not your laptop)
  - 'You want a production-grade, always-on Gateway on your own VPS'
  - 'You want full control over persistence, binaries, and restart behavior'
  - You are running OpenClaw in Docker on Hetzner or a similar provider
---
# 在 Hetzner 上使用 Docker 部署 OpenClaw（生产级 VPS 指南）

## 目标

在 Hetzner VPS 上通过 Docker 运行一个持久化的 OpenClaw 网关，确保状态持久、内置二进制文件，并具备安全的重启行为。如果你希望以大约 5 美元的成本实现“OpenClaw 全天候运行”，这是最简单且可靠的部署方案。Hetzner 的定价可能会变化，请选择最小的 Debian 或 Ubuntu VPS，如果遇到内存不足问题再考虑升级。

## 简单来说，我们在做什么？

- 租用一台小型 Linux 服务器（Hetzner VPS）
- 安装 Docker（用于隔离的应用运行时）
- 在 Docker 中启动 OpenClaw 网关
- 将 `~/.openclaw` 和 `~/.openclaw/workspace` 持久化到宿主机上（重启或重建后仍能保留）
- 通过 SSH 隧道从笔记本电脑访问控制 UI

网关可通过以下方式访问：

- 从笔记本电脑进行 SSH 端口转发
- 如果你自行管理防火墙和令牌，则可直接暴露端口

本指南假设你在 Hetzner 上使用 Ubuntu 或 Debian。如果你使用的是其他 Linux VPS，请相应调整软件包。有关通用的 Docker 流程，请参阅 [Docker](/install/docker)。

---

## 快速路径（适用于有经验的运维人员）

1. 预配 Hetzner VPS
2. 安装 Docker
3. 克隆 OpenClaw 仓库
4. 创建持久化的宿主机目录
5. 配置 `.env` 和 `docker-compose.yml`
6. 将所需二进制文件烘焙到镜像中
7. `docker compose up -d`
8. 验证持久性和网关访问

---

## 所需条件

- 具有 root 访问权限的 Hetzner VPS
- 可从笔记本电脑进行 SSH 访问
- 熟悉 SSH 操作及复制粘贴
- 大约 20 分钟时间
- Docker 和 Docker Compose
- 模型身份验证凭据
- 可选的提供商凭据：
  - WhatsApp QR 码
  - Telegram 机器人令牌
  - Gmail OAuth 凭据

---

## 1) 预配 VPS

在 Hetzner 中创建一台 Ubuntu 或 Debian VPS。

以 root 用户身份连接：

```bash
ssh root@YOUR_VPS_IP
```

本指南假定 VPS 是有状态的，不要将其视为一次性基础设施。

---

## 2) 在 VPS 上安装 Docker

```bash
apt-get update
apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
```

验证安装：

```bash
docker --version
docker compose version
```

---

## 3) 克隆 OpenClaw 仓库

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

本指南假定你将构建自定义镜像，以确保二进制文件的持久性。

---

## 4) 创建持久化的宿主机目录

Docker 容器是临时的，所有需要长期保存的状态都必须存储在宿主机上。

```bash
mkdir -p /root/.openclaw
mkdir -p /root/.openclaw/workspace

# Set ownership to the container user (uid 1000):
chown -R 1000:1000 /root/.openclaw
chown -R 1000:1000 /root/.openclaw/workspace
```

---

## 5) 配置环境变量

在仓库根目录下创建 `.env`。

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/root/.openclaw
OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

生成强密钥：

```bash
openssl rand -hex 32
```

**请勿提交此文件。**

---

## 6) 配置 Docker Compose

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
      # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
      # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
      - '127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789'

      # Optional: only if you run iOS/Android nodes against this VPS and need Canvas host.
      # If you expose this publicly, read /gateway/security and firewall accordingly.
      # - "18793:18793"
    command:
      [
        'node',
        'dist/index.js',
        'gateway',
        '--bind',
        '${OPENCLAW_GATEWAY_BIND}',
        '--port',
        '${OPENCLAW_GATEWAY_PORT}',
      ]
```

---

## 7) 将所需二进制文件烘焙到镜像中（关键步骤）

在运行中的容器内安装二进制文件是一个陷阱——任何在运行时安装的内容在重启时都会丢失。技能所需的所有外部二进制文件都必须在构建镜像时预先安装。

下面的示例仅展示了三种常见的二进制文件：

- `gog` 用于 Gmail 访问
- `goplaces` 用于 Google Places
- `wacli` 用于 WhatsApp

这些只是示例，并非完整列表。你可以按照相同的模式安装任意数量的二进制文件。

如果你后续添加了依赖于其他二进制文件的新技能，你需要：

1. 更新 Dockerfile
2. 重新构建镜像
3. 重启容器

**示例 Dockerfile**

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

CMD ["node","dist/index.js"]
```

---

## 8) 构建并启动

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

## 9) 验证网关

```bash
docker compose logs -f openclaw-gateway
```

成功：

```
[gateway] listening on ws://0.0.0.0:18789
```

从笔记本电脑访问：

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

打开：

`http://127.0.0.1:18789/`

粘贴你的网关令牌。

---

## 各组件的持久化位置（事实来源）

OpenClaw 在 Docker 中运行，但 Docker 并不是事实来源。所有需要长期保存的态都必须能够在重启、重建和系统重启后依然存在。

| 组件               | 位置                          | 持久化机制          | 备注                            |
| ------------------- | ----------------------------- | ------------------- | -------------------------------- |
| 网关配置           | `/home/node/.openclaw/`       | 宿主机卷挂载        | 包含 `openclaw.json` 和令牌   |
| 模型身份验证凭据   | `/home/node/.openclaw/`       | 宿主机卷挂载        | OAuth 令牌、API 密钥             |
| 技能配置           | `/home/node/.openclaw/skills/`    | 宿主机卷挂载        | 技能级别的状态                  |
| 代理工作区         | `/home/node/.openclaw/workspace/` | 宿主机卷挂载        | 代码和代理工件                  |
| WhatsApp 会话      | `/home/node/.openclaw/`       | 宿主机卷挂载        | 保留 QR 登录                    |
| Gmail 密钥环       | `/home/node/.openclaw/`       | 宿主机卷 + 密码     | 需要 `GOG_KEYRING_PASSWORD`          |
| 外部二进制文件     | `/usr/local/bin/`         | Docker 镜像         | 必须在构建时烘焙                |
| Node 运行时        | 容器文件系统              | Docker 镜像         | 每次构建镜像时都会重建          |
| OS 软件包          | 容器文件系统              | Docker 镜像         | 不应在运行时安装                |
| Docker 容器        | 临时                          | 可重启              | 可安全销毁                      |
