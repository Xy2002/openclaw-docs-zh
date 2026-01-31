---
summary: CLI reference for `openclaw configure` (interactive configuration prompts)
read_when:
  - 'You want to tweak credentials, devices, or agent defaults interactively'
---
# `openclaw configure`

用于设置凭据、设备和代理默认值的交互式提示。

注意：**模型**部分现在包含一个用于`agents.defaults.models`白名单的多选框（显示在`/model`和模型选择器中）。

提示：不带子命令的`openclaw config`会打开相同的向导。使用`openclaw config get|set|unset`进行非交互式编辑。

相关：
- 网关配置参考：[配置](/gateway/configuration)
- 配置 CLI：[Config](/cli/config)

注意事项：
- 选择网关运行位置始终会更新`gateway.mode`。如果只需更改这一点，您可以跳过其他部分并直接选择“继续”。
- 面向频道的服务（Slack/Discord/Matrix/Microsoft Teams）在设置过程中会提示输入频道/房间白名单。您可以输入名称或 ID；向导会在可能的情况下将名称解析为 ID。

## 示例

```bash
openclaw configure
openclaw configure --section models --section channels
```
