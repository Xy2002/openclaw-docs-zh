---
summary: Use Qwen OAuth (free tier) in OpenClaw
read_when:
  - You want to use Qwen with OpenClaw
  - You want free-tier OAuth access to Qwen Coder
---
# Qwen

Qwen为Qwen Coder和Qwen Vision模型提供免费层级的OAuth流程
（每日2,000次请求，受Qwen速率限制约束）。

## 启用插件

```bash
openclaw plugins enable qwen-portal-auth
```

启用后请重启网关。

## 进行身份验证

```bash
openclaw models auth login --provider qwen-portal --set-default
```

此操作会运行Qwen设备码OAuth流程，并将提供商条目写入您的
`models.json`（并创建一个用于快速切换的`qwen`别名）。

## 模型ID

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

可通过以下命令切换模型：

```bash
openclaw models set qwen-portal/coder-model
```

## 复用Qwen Code CLI登录信息

如果您已使用Qwen Code CLI登录，OpenClaw在加载身份验证存储时会从
`~/.qwen/oauth_creds.json`同步凭据。您仍然需要一个`models.providers.qwen-portal`条目（可使用上述登录命令创建）。

## 注意事项

- 令牌会自动刷新；如果刷新失败或访问被撤销，请重新运行登录命令。
- 默认基础URL：`https://portal.qwen.ai/v1`（如果Qwen提供不同的端点，可用
  `models.providers.qwen-portal.baseUrl`进行覆盖）。
- 有关适用于所有提供商的规则，请参阅[模型提供商](/concepts/model-providers)。
