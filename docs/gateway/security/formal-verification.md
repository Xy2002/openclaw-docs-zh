---
title: Formal Verification (Security Models)
summary: Machine-checked security models for OpenClaw’s highest-risk paths.
permalink: /security/formal-verification/
---
# 形式化验证（安全模型）

本页面跟踪 OpenClaw 的**形式化安全模型**（目前使用 TLA+/TLC；未来将根据需要扩展更多模型）。

> 注意：部分旧链接可能仍指向项目之前的名称。

**目标（北极星）：** 在明确假设下，提供经机器检查的安全论证，证明 OpenClaw 能够在其预期的安全策略（授权、会话隔离、工具门控以及错误配置安全性）下运行。

**当前定位：** 一套可执行的、由攻击者驱动的**安全回归测试套件**：
- 每个安全断言都对应一个在有限状态空间上运行的可执行模型检查。
- 许多断言还配有对应的**反向模型**，用于针对某一类现实中的漏洞生成反例轨迹。

**尚非：** 这些模型并不构成“OpenClaw 在所有方面都是安全的”的完整证明，也并不意味着完整的 TypeScript 实现是完全正确的。

## 模型存放位置

模型托管在一个独立的代码库中：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要注意事项

- 这些只是**模型**，而非完整的 TypeScript 实现。模型与实际代码之间可能存在偏差。
- 检查结果受限于 TLC 探索的状态空间；即使结果显示为“绿色”，也不意味着在超出建模假设和状态空间限制的情况下仍然安全。
- 部分断言依赖于明确的环境假设（例如，正确的部署方式、正确的配置输入）。

## 结果重现

目前，可通过在本地克隆模型仓库并运行 TLC 来重现结果（见下文）。未来的迭代可能包括：
- 在 CI 中运行模型，并公开相关工件（反例轨迹、运行日志）；
- 提供一个托管的“运行此模型”工作流，用于执行小型且有界的安全检查。

快速入门：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### 网关暴露与开放网关错误配置

**断言：** 如果未启用认证而绑定到环回以外的地址，可能导致远程入侵或增加暴露风险；根据模型假设，令牌或密码可阻止未认证攻击者。

- 绿色运行：
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 红色（预期）：
  - `make gateway-exposure-v2-negative`

另请参阅模型仓库中的 `docs/gateway-exposure-matrix.md`。

### Nodes.run 管道（最高风险功能）

**断言：** `nodes.run` 要求：(a) 节点命令白名单加上已声明的命令；(b) 在配置时需实时批准；批准过程通过令牌化防止重放攻击（在模型中体现）。

- 绿色运行：
  - `make nodes-pipeline`
  - `make approvals-token`
- 红色（预期）：
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 配对存储（DM 门控）

**断言：** 配着请求遵守 TTL 和待处理请求上限。

- 绿色运行：
  - `make pairing`
  - `make pairing-cap`
- 红色（预期）：
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 入口门控（提及与控制命令绕过）

**断言：** 在需要提及的群组上下文中，未经授权的“控制命令”无法绕过提及门控。

- 绿色：
  - `make ingress-gating`
- 红色（预期）：
  - `make ingress-gating-negative`

### 路由/会话密钥隔离

**断言：** 不同对等方之间的 DM 不会在未显式关联或配置的情况下合并到同一会话中。

- 绿色：
  - `make routing-isolation`
- 红色（预期）：
  - `make routing-isolation-negative`


## v1++：额外的有界模型（并发、重试、轨迹正确性）

这些是后续模型，旨在更精确地模拟现实世界中的故障模式（非原子更新、重试以及消息扇出）。

### 配着存储的并发性与幂等性

**断言：** 配着存储应在交错操作下仍能强制实施 `MaxPending` 并保持幂等性（即，“先检查后写入”必须是原子操作或加锁操作；刷新不应产生重复条目）。

含义：
- 在并发请求下，某个通道上的 `MaxPending` 值不能被超过。
- 对同一 `(channel, sender)` 的重复请求或刷新不应导致创建重复的活动待处理行。

- 绿色运行：
  - `make pairing-race`（原子/加锁的上限检查）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 红色（预期）：
  - `make pairing-race-negative`（非原子 begin/commit 上限竞争）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 入口轨迹相关性与幂等性

**断言：** 在扇出过程中，摄取应保持轨迹相关性，并且在提供商重试时应具有幂等性。

含义：
- 当一个外部事件分解为多个内部消息时，每个部分都应保留相同的轨迹/事件标识。
- 重试不会导致重复处理。
- 如果缺少提供商事件 ID，去重机制将回退到一个安全键（如轨迹 ID），以避免丢失不同事件。

- 绿色：
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 红色（预期）：
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 路由 dmScope 优先级 + identityLinks

**断言：** 路由默认应保持 DM 会话隔离，仅在显式配置时才合并会话（通道优先级 + identityLinks）。

含义：
- 特定通道的 dmScope 重写必须优先于全局默认设置。
- identityLinks 只应在显式关联的群组内合并会话，而不应在无关对等方之间合并。

- 绿色：
  - `make routing-precedence`
  - `make routing-identitylinks`
- 红色（预期）：
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
