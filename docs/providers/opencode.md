---
summary: Use OpenCode Zen (curated models) with OpenClaw
read_when:
  - You want OpenCode Zen for model access
  - You want a curated list of coding-friendly models
---
# 开放代码禅

OpenCode Zen是OpenCode团队为编码代理推荐的**精选模型列表**。
它是一种可选的托管模型访问途径，使用API密钥和`opencode`提供商。
Zen目前处于测试阶段。

__HEADING_0__CLI设置

```bash
openclaw onboard --auth-choice opencode-zen
# or non-interactive
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

## 配置片段

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-5" } } }
}
```

## 注意事项

- 同样支持`OPENCODE_ZEN_API_KEY`。
- 您需要登录Zen，添加账单信息，并复制您的API密钥。
- OpenCode Zen按请求计费；有关详细信息，请查看OpenCode仪表板。
