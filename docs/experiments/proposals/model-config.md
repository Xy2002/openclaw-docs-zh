---
summary: 'Exploration: model config, auth profiles, and fallback behavior'
read_when:
  - Exploring future model selection + auth profile ideas
---
# 模型配置（探索）

本文档记录了未来模型配置的**构想**，并非正式发布的规范。如需了解当前行为，请参阅：
- [模型](/concepts/models)
- [模型故障转移](/concepts/model-failover)
- [OAuth + 个人资料](/concepts/oauth)

## 动机

运营商希望：
- 每个提供商支持多个身份验证个人资料（例如个人与工作）。
- 能够以简单的方式进行`/model`选择，并具备可预测的回退机制。
- 在文本模型与具备图像处理能力的模型之间实现清晰分离。

## 可能的方向（高层次）

- 保持模型选择的简洁性：使用`provider/model`，并可选地提供别名。
- 允许提供商拥有多个身份验证个人资料，并明确指定其优先级顺序。
- 使用全局回退列表，确保所有会话的故障转移行为一致。
- 仅在显式配置时才覆盖图像路由。

## 待解决的问题

- 个人资料轮换应按提供商还是按模型进行？
- UI 应如何呈现会话的个人资料选择界面？
- 从旧版配置键迁移到新配置的安全路径是什么？
