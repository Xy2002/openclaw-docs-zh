---
summary: Optional Docker-based setup and onboarding for OpenClaw
read_when:
  - You want a containerized gateway instead of local installs
  - You are validating the Docker flow
---
# Docker（可选）

Docker 是**可选的**。仅在您需要容器化的网关或验证 Docker 流程时使用。

## Docker 适合我吗？

- **是**：您希望拥有一个隔离且可丢弃的网关环境，或者在没有本地安装的主机上运行 OpenClaw。
- **否**：您在自己的机器上开发，并且只希望获得最快的开发循环。请改用常规安装流程。
- **沙箱注意事项**：代理沙箱也使用 Docker，但并不**要求**整个网关必须在 Docker 中运行。请参阅 [沙箱](/gateway/sandboxing)。

本指南涵盖：
- 容器化网关（完整的 OpenClaw 在 Docker 中）
- 每会话代理沙箱（主机网关 + Docker 隔离的代理工具）

沙箱详情：[沙箱](/gateway/sandboxing)

## 要求

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 足够的磁盘空间用于镜像和日志

## 容器化网关（Docker Compose）

### 快速入门（推荐）

从仓库根目录运行：

```bash
./docker-setup.sh
```

此脚本：
- 构建网关镜像
- 运行引导向导
- 打印可选的提供商设置提示
- 通过 Docker Compose 启动网关
- 生成网关令牌并将其写入 `.env`

可选环境变量：
- `OPENCLAW_DOCKER_APT_PACKAGES` — 在构建过程中安装额外的 apt 包
- `OPENCLAW_EXTRA_MOUNTS` — 添加额外的主机绑定挂载
- `OPENCLAW_HOME_VOLUME` — 将 `/home/node` 持久化到命名卷中

完成后：
- 在浏览器中打开 `http://127.0.0.1:18789/`。
- 将令牌粘贴到控制 UI（设置 → 令牌）。

它会在主机上写入配置/工作区：
- `~/.openclaw/`
- `~/.openclaw/workspace`

在 VPS 上运行？请参阅 [Hetzner (Docker VPS)](/platforms/hetzner)。

### 手动流程（compose）

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

### 额外挂载（可选）

如果您希望将其他主机目录挂载到容器中，请在运行 `docker-setup.sh` 之前设置 `OPENCLAW_EXTRA_MOUNTS`。此参数接受一个由逗号分隔的 Docker 绑定挂载列表，并通过生成 `docker-compose.extra.yml` 将其应用于 `openclaw-gateway` 和 `openclaw-cli`。

示例：

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意事项：
- 在 macOS/Windows 上，路径必须与 Docker Desktop 共享。
- 如果您编辑 `OPENCLAW_EXTRA_MOUNTS`，请重新运行 `docker-setup.sh` 以重新生成额外的 compose 文件。
- 会生成 `docker-compose.extra.yml`。请勿手动编辑。

### 持久化整个容器主目录（可选）

如果您希望 `/home/node` 在容器重建后仍然存在，请通过 `OPENCLAW_HOME_VOLUME` 设置一个命名卷。这会创建一个 Docker 卷，并将其挂载到 `/home/node`，同时保留标准的配置/工作区绑定挂载。此处应使用命名卷（而非绑定路径）；对于绑定挂载，请使用 `OPENCLAW_EXTRA_MOUNTS`。

示例：

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

您可以将其与额外的挂载结合使用：

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意事项：
- 如果您更改 `OPENCLAW_HOME_VOLUME`，请重新运行 `docker-setup.sh` 以重新生成额外的 compose 文件。
- 命名卷会一直存在，直到您使用 `docker volume rm <name>` 将其删除。

### 安装额外的 apt 包（可选）

如果您需要在镜像中包含系统包（例如构建工具或媒体库），请在运行 `docker-setup.sh` 之前设置 `OPENCLAW_DOCKER_APT_PACKAGES`。这些包会在镜像构建过程中安装，因此即使容器被删除，它们也会保留。

示例：

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

注意事项：
- 此参数接受由空格分隔的 apt 包名称列表。
- 如果您更改 `OPENCLAW_DOCKER_APT_PACKAGES`，请重新运行 `docker-setup.sh` 以重新构建镜像。

### 更快的重建（推荐）

为加快重建速度，调整 Dockerfile 的顺序，使依赖层能够被缓存。这样可以避免在锁文件未更改的情况下重复运行 `pnpm install`：

```dockerfile
FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Cache dependencies unless package metadata changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

### 渠道设置（可选）

使用 CLI 容器配置渠道，然后在必要时重启网关。

WhatsApp（QR）：
```bash
docker compose run --rm openclaw-cli channels login
```

Telegram（bot token）：
```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord（bot token）：
```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

文档：[WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)

### 健康检查

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### 端到端冒烟测试（Docker）

```bash
scripts/e2e/onboard-docker.sh
```

### QR 导入冒烟测试（Docker）

```bash
pnpm test:docker:qr
```

### 注意事项

- 网关绑定默认为 `lan`，供容器使用。
- 网关容器是会话的权威来源（`~/.openclaw/agents/<agentId>/sessions/`）。

## 代理沙箱（主机网关 + Docker 工具）

深度解析：[沙箱](/gateway/sandboxing)

### 功能说明

当 `agents.defaults.sandbox` 启用时，**非主会话**会在 Docker 容器中运行工具。网关保留在您的主机上，但工具执行被隔离：
- 默认范围：`"agent"`（每个代理一个容器和工作区）
- 范围：`"session"` 提供每会话隔离
- 每个范围的工作区文件夹挂载在 `/workspace` 上
- 可选的代理工作区访问权限（`agents.defaults.sandbox.workspaceAccess`）
- 允许/拒绝工具策略（拒绝优先）
- 入站媒体会被复制到活动沙箱工作区（`media/inbound/*`），以便工具可以读取（通过 `workspaceAccess: "rw"`，数据会进入代理工作区）

警告：`scope: "shared"` 会禁用跨会话隔离。所有会话共享一个容器和一个工作区。

### 多代理沙箱配置文件

如果您使用多代理路由，每个代理都可以覆盖沙箱和工具设置：
`agents.list[].sandbox` 和 `agents.list[].tools`（以及 `agents.list[].tools.sandbox.tools`）。这让您可以在一个网关中运行具有不同访问级别的代理：
- 完全访问（个人代理）
- 只读工具 + 只读工作区（家庭/工作代理）
- 无文件系统/Shell 工具（公共代理）

有关示例、优先级和故障排除，请参阅 [多代理沙箱与工具](/multi-agent-sandbox-tools)。

### 默认行为

- 镜像：`openclaw-sandbox:bookworm-slim`
- 每个代理一个容器
- 代理工作区访问：`workspaceAccess: "none"`（默认）使用 `~/.openclaw/sandboxes`
  - `"ro"` 将沙箱工作区保持在 `/workspace`，并将代理工作区以只读方式挂载在 `/agent` 上（禁用 `write`/`edit`/`apply_patch`）
  - `"rw"` 将代理工作区以读写方式挂载在 `/workspace` 上
- 自动修剪：空闲超过 24 小时 OR 使用时间超过 7 天
- 网络：`none` 默认启用（如需出站流量，需显式启用）
- 默认允许：`exec`、`process`、`read`、`write`、`edit`、`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- 默认拒绝：`browser`、`canvas`、`nodes`、`cron`、`discord`、`gateway`

### 启用沙箱

如果您计划在 `setupCommand` 中安装软件包，请注意：
- 默认的 `docker.network` 是 `"none"`（无出站流量）。
- `readOnlyRoot: true` 会阻止软件包安装。
- `user` 必须为 root 才能使用 `apt-get`（请省略 `user` 或设置 `user: "0:0"`）。
OpenClaw 会在 `setupCommand`（或 docker 配置）发生变化时自动重建容器，除非该容器**最近被使用过**（在 ~5 分钟内）。热容器会记录一条带有确切 `openclaw sandbox recreate ...` 命令的警告。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent is default)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"]
        },
        prune: {
          idleHours: 24, // 0 disables idle pruning
          maxAgeDays: 7  // 0 disables max-age pruning
        }
      }
    }
  },
  tools: {
    sandbox: {
      tools: {
        allow: ["exec", "process", "read", "write", "edit", "sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status"],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"]
      }
    }
  }
}
```

强化选项位于 `agents.defaults.sandbox.docker` 下：
`network`、`user`、`pidsLimit`、`memory`、`memorySwap`、`cpus`、`ulimits`、
`seccompProfile`、`apparmorProfile`、`dns`、`extraHosts`。

多代理：可通过 `agents.list[].sandbox.{docker,browser,prune}.*` 按代理覆盖 `agents.defaults.sandbox.{docker,browser,prune}.*`（当 `agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope` 为 `"shared"` 时忽略）。

### 构建默认沙箱镜像

```bash
scripts/sandbox-setup.sh
```

此命令使用 `Dockerfile.sandbox` 构建 `openclaw-sandbox:bookworm-slim`。

### 沙箱通用镜像（可选）

如果您想要一个包含常用构建工具（Node、Go、Rust 等）的沙箱镜像，可以构建通用镜像：

```bash
scripts/sandbox-common-setup.sh
```

此命令构建 `openclaw-sandbox-common:bookworm-slim`。要使用它：

```json5
{
  agents: { defaults: { sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } } } }
}
```

### 沙箱浏览器镜像

要在沙箱中运行浏览器工具，可以构建浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

此命令使用 `Dockerfile.sandbox-browser` 构建 `openclaw-sandbox-browser:bookworm-slim`。容器运行启用了 CDP 的 Chromium，并可选配备 noVNC 观察器（通过 Xvfb 实现有头模式）。

注意事项：
- 有头模式（Xvfb）比无头模式更不容易被机器人拦截。
- 通过设置 `agents.defaults.sandbox.browser.headless=true`，仍可使用无头模式。
- 不需要完整的桌面环境（GNOME）；Xvfb 提供显示功能。

使用配置：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: { enabled: true }
      }
    }
  }
}
```

自定义浏览器镜像：

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-openclaw-browser" } }
    }
  }
}
```

启用后，代理会收到：
- 一个沙箱浏览器控制 URL（用于 `browser` 工具）
- 一个 noVNC URL（如果启用且无头=false）

请注意：如果您对工具使用白名单，请添加 `browser`（并从拒绝列表中移除），否则工具仍将被阻止。
修剪规则（`agents.defaults.sandbox.prune`）同样适用于浏览器容器。

### 自定义沙箱镜像

构建您自己的镜像，并将配置指向它：

```bash
docker build -t my-openclaw-sbx -f Dockerfile.sandbox .
```

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "my-openclaw-sbx" } }
    }
  }
}
```

### 工具政策（允许/拒绝）

- `deny` 优先于 `allow`。
- 如果 `allow` 为空：所有工具（拒绝除外）均可使用。
- 如果 `allow` 非空：只有 `allow` 中的工具可用（减去拒绝）。

### 修剪策略

有两个旋钮：
- `prune.idleHours`：移除 X 小时内未使用的容器（0 = 禁用）
- `prune.maxAgeDays`：移除 X 天以上的容器（0 = 禁用）

示例：
- 保留繁忙会话，但限制生命周期：
  `idleHours: 24`、`maxAgeDays: 7`
- 永不修剪：
  `idleHours: 0`、`maxAgeDays: 0`

### 安全注意事项

- 硬墙仅适用于**工具**（执行/读取/写入/编辑/应用补丁）。  
- 主机专用工具，如浏览器/相机/画布，默认会被阻止。  
- 在沙箱中允许 `browser` 会**破坏隔离**（浏览器将在主机上运行）。

## 故障排除

- 镜像缺失：使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) 构建，或设置 `agents.defaults.sandbox.docker.image`。
- 容器未运行：它会按需为每个会话自动创建。
- 沙箱中的权限错误：将 `docker.user` 设置为与您挂载的工作区所有权匹配的 UID:GID（或对工作区文件夹进行 chown）。
- 自定义工具未找到：OpenClaw 使用 `sh -lc`（登录 shell）运行命令，这会加载 `/etc/profile` 并可能重置 PATH。将 `docker.env.PATH` 设置为在您的自定义工具路径前缀（例如 `/custom/bin:/usr/local/share/npm-global/bin`），或在您的 Dockerfile 中的 `/etc/profile.d/` 下添加脚本。
