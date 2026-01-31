---
summary: 'Network hub: gateway surfaces, pairing, discovery, and security'
read_when:
  - You need the network architecture + security overview
  - You are debugging local vs tailnet access or pairing
  - You want the canonical list of networking docs
---
# 网络中心

此中心链接了 OpenClaw 如何在本地主机、局域网和尾网中连接、配对并保护设备的核心文档。

## 核心模型

- [网关架构](/concepts/architecture)
- [网关协议](/gateway/protocol)
- [网关操作手册](/gateway)
- [Web 界面 + 绑定模式](/web)

## 配对与身份

- [配对概览（DM + 节点）](/start/pairing)
- [由网关管理的节点配对](/gateway/pairing)
- [设备 CLI（配对 + 令牌轮换）](/cli/devices)
- [配对 CLI（DM 审批）](/cli/pairing)

本地信任：
- 本地连接（环回地址或网关主机自身的尾网地址）可自动批准配对，以确保同一主机上的用户体验顺畅。
- 非本地尾网/LAN 客户端仍需明确的配对批准。

## 发现与传输协议

- [发现与传输协议](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [远程访问（SSH）](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## 节点与传输协议

- [节点概览](/nodes)
- [桥接协议（旧版节点）](/gateway/bridge-protocol)
- [节点操作手册：iOS](/platforms/ios)
- [节点操作手册：Android](/platforms/android)

## 安全

- [安全概览](/gateway/security)
- [网关配置参考](/gateway/configuration)
- [故障排除](/gateway/troubleshooting)
- [诊断工具](/gateway/doctor)
