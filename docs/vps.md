---
summary: VPS hosting hub for OpenClaw (Oracle/Fly/Hetzner/GCP/exe.dev)
read_when:
  - You want to run the Gateway in the cloud
  - You need a quick map of VPS/hosting guides
---
# VPS 托管

本中心链接到受支持的 VPS/托管指南，并从高层次解释云部署的工作原理。

## 选择提供商

- **Railway**（一键式 + 浏览器设置）：[Railway](/railway)
- **Northflank**（一键式 + 浏览器设置）：[Northflank](/northflank)
- **Oracle Cloud（Always Free）**：[Oracle](/platforms/oracle) — 每月 $0（Always Free，ARM；容量和注册可能比较挑剔）
- **Fly.io**：[Fly.io](/platforms/fly)
- **Hetzner（Docker）**：[Hetzner](/platforms/hetzner)
- **GCP（Compute Engine）**：[GCP](/platforms/gcp)
- **exe.dev**（虚拟机 + HTTPS 代理）：[exe.dev](/platforms/exe-dev)
- **AWS（EC2/Lightsail/免费层级）**：同样适用。视频指南：
  https://x.com/techfrenAJ/status/2014934471095812547

## 云设置的工作原理

- **网关在 VPS 上运行**，并负责管理状态和工作区。
- 您通过 **控制 UI** 或 **Tailscale/SSH** 从笔记本电脑或手机连接。
- 将 VPS 视为事实来源，并对状态和工作区进行 **备份**。
- 默认安全策略：将网关保留在环回地址上，并通过 SSH 隧道或 Tailscale Serve 访问。如果您绑定到 `lan`/`tailnet`，则需要启用 `gateway.auth.token` 或 `gateway.auth.password`。

远程访问：[Gateway remote](/gateway/remote)  
平台中心：[Platforms](/platforms)

## 在 VPS 上使用节点

您可以将网关保留在云端，并在本地设备上配对 **节点**（Mac/iOS/Android/无头设备）。节点在网关保持在云端的同时，提供本地屏幕/摄像头/画布以及 `system.run` 功能。

文档：[Nodes](/nodes), [Nodes CLI](/cli/nodes)
