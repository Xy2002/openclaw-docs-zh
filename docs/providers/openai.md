---
summary: Use OpenAI via API keys or Codex subscription in OpenClaw
read_when:
  - You want to use OpenAI models in OpenClaw
  - You want Codex subscription auth instead of API keys
---
# 开放人工智能

OpenAI为GPT模型提供开发者API。Codex支持通过“ChatGPT登录”获取订阅访问权限，或通过“API密钥登录”实现按使用量计费的访问权限。Codex云必须使用ChatGPT登录。

## 选项A：OpenAI API密钥（OpenAI平台）

**最适合：** 直接通过API访问并按使用量计费。
您可从OpenAI仪表板获取API密钥。

__HEADING_0__CLI设置

```bash
openclaw onboard --auth-choice openai-api-key
# or non-interactive
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

配置片段

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.2" } } }
}
```

## 选项B：OpenAI Code（Codex）订阅

**最适合：** 使用ChatGPT或Codex订阅访问权限，而非API密钥。
Codex云必须通过ChatGPT账号登录才能使用，而Codex命令行工具则同时支持ChatGPT登录和API密钥登录。

__HEADING_0__CLI设置

```bash
# Run Codex OAuth in the wizard
openclaw onboard --auth-choice openai-codex

# Or run OAuth directly
openclaw models auth login --provider openai-codex
```

配置片段

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.2" } } }
}
```

## 注意事项

- 模型引用始终使用`provider/model`（参见[/concepts/models](/concepts/models)）。
- 有关身份验证详情及复用规则，请参见[/concepts/oauth](/concepts/oauth)。
