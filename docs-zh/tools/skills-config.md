---
summary: Skills config schema and examples
read_when:
  - Adding or modifying skills config
  - Adjusting bundled allowlist or install behavior
---
# 技能配置

所有与技能相关的配置都位于 `skills` 中的 `~/.openclaw/openclaw.json` 下。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: [
        "~/Projects/agent-scripts/skills",
        "~/Projects/oss/some-skill-pack/skills"
      ],
      watch: true,
      watchDebounceMs: 250
    },
    install: {
      preferBrew: true,
      nodeManager: "npm" // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE"
        }
      },
      peekaboo: { enabled: true },
      sag: { enabled: false }
    }
  }
}
```

## 字段

- `allowBundled`: 仅适用于**捆绑**技能的可选白名单。设置后，只有列表中的捆绑技能才符合条件（托管/工作区技能不受影响）。
- `load.extraDirs`: 需要扫描的额外技能目录（优先级最低）。
- `load.watch`: 监视技能文件夹并刷新技能快照（默认：true）。
- `load.watchDebounceMs`: 技能监视器事件的防抖时间，单位为毫秒（默认：250）。
- `install.preferBrew`: 在可用时优先使用 brew 安装程序（默认：true）。
- `install.nodeManager`: Node 安装程序偏好（`npm` | `pnpm` | `yarn` | `bun`, 默认：npm）。
  这仅影响**技能安装**；网关运行时仍应使用 Node（不建议在 WhatsApp/Telegram 中使用 Bun）。
- `entries.<skillKey>`: 每个技能的覆盖设置。

每个技能的字段：
- `enabled`: 将 `false` 设置为禁用某个技能，即使该技能是捆绑或已安装的。
- `env`: 注入到代理运行中的环境变量（仅在尚未设置时生效）。
- `apiKey`: 为声明主要环境变量的技能提供可选便利。

## 注意事项

- 默认情况下，`entries` 下的键会映射到技能名称。如果某个技能定义了 `metadata.openclaw.skillKey`，则使用该键。
- 启用监视器时，对技能所做的更改将在下一次代理轮次中生效。

### 沙箱技能 + 环境变量

当会话被**沙箱化**时，技能进程在 Docker 内运行。沙箱**不会**继承主机的 `process.env`。

请使用以下方法之一：
- `agents.defaults.sandbox.docker.env`（或针对每个代理的 `agents.list[].sandbox.docker.env`）
- 将环境变量烘焙到您的自定义沙箱镜像中

全局 `env` 和 `skills.entries.<skill>.env/apiKey` 仅适用于**主机**运行。
