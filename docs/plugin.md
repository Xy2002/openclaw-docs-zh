---
summary: 'OpenClaw plugins/extensions: discovery, config, and safety'
read_when:
  - Adding or modifying plugins/extensions
  - Documenting plugin install or load rules
---
# 插件（扩展）

## 快速入门（初次使用插件？）

插件是一个**小型代码模块**，用于通过额外的功能（命令、工具和 Gateway RPC）扩展 OpenClaw。

大多数情况下，当你需要尚未内置到 OpenClaw 核心中的功能时，就会使用插件（或者你希望将可选功能从主安装中分离出来）。

快速路径：

1) 查看当前已加载的内容：

```bash
openclaw plugins list
```

2) 安装官方插件（例如：语音通话）：

```bash
openclaw plugins install @openclaw/voice-call
```

3) 重启 Gateway，然后在 `plugins.entries.<id>.config` 下进行配置。

有关具体插件示例，请参阅 [语音通话](/plugins/voice-call)。

## 可用插件（官方）

- 自 2026.1.15 起，Microsoft Teams 仅支持插件；如果您使用 Teams，请安装 `@openclaw/msteams`。
- 内存（核心）——内置的内存搜索插件（默认通过 `plugins.slots.memory` 启用）
- 内存（LanceDB）——内置的长期记忆插件（自动回忆/捕获；设置 `plugins.slots.memory = "memory-lancedb"`）
- [语音通话](/plugins/voice-call) — `@openclaw/voice-call`
- [Zalo Personal](/plugins/zalouser) — `@openclaw/zalouser`
- [Matrix](/channels/matrix) — `@openclaw/matrix`
- [Nostr](/channels/nostr) — `@openclaw/nostr`
- [Zalo](/channels/zalo) — `@openclaw/zalo`
- [Microsoft Teams](/channels/msteams) — `@openclaw/msteams`
- Google Antigravity OAuth（提供商身份验证）——作为 `google-antigravity-auth` 打包（默认禁用）
- Gemini CLI OAuth（提供商身份验证）——作为 `google-gemini-cli-auth` 打包（默认禁用）
- Qwen OAuth（提供商身份验证）——作为 `qwen-portal-auth` 打包（默认禁用）
- Copilot Proxy（提供商身份验证）——本地 VS Code Copilot Proxy 桥接；与内置的 `github-copilot` 设备登录不同（打包提供，默认禁用）

OpenClaw 插件是通过 jiti 在运行时加载的**TypeScript 模块**。**配置验证不会执行插件代码**；它改用插件清单和 JSON Schema。有关详细信息，请参阅 [插件清单](/plugins/manifest)。

插件可以注册：

- Gateway RPC 方法
- Gateway HTTP 处理程序
- 代理工具
- CLI 命令
- 后台服务
- 可选配置验证
- **技能**（通过在插件清单中列出 `skills` 目录）
- **自动回复命令**（无需调用 AI 代理即可执行）

插件与 Gateway**在同一进程中运行**，因此应将其视为可信代码。工具编写指南：[插件代理工具](/plugins/agent-tools)。

## 运行时辅助函数

插件可以通过 `api.runtime` 访问选定的核心辅助函数。对于电话 TTS：

```ts
const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});
```

注意事项：
- 使用核心 `messages.tts` 配置（OpenAI 或 ElevenLabs）。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为提供商重新采样/编码。
- 电话不支持边缘 TTS。

## 发现与优先级

OpenClaw 按以下顺序扫描：

1) 配置路径
- `plugins.load.paths`（文件或目录）

2) 工作区扩展
- `<workspace>/.openclaw/extensions/*.ts`
- `<workspace>/.openclaw/extensions/*/index.ts`

3) 全局扩展
- `~/.openclaw/extensions/*.ts`
- `~/.openclaw/extensions/*/index.ts`

4) 内置扩展（随 OpenClaw 附带，**默认禁用**）
- `<openclaw>/extensions/*`

内置插件必须通过 `plugins.entries.<id>.enabled` 或 `openclaw plugins enable <id>` 显式启用。已安装的插件默认启用，但也可以以相同方式禁用。

每个插件必须在其根目录中包含一个 `openclaw.plugin.json` 文件。如果路径指向一个文件，则插件根目录为该文件所在的目录，并且必须包含清单。

如果多个插件解析为相同的 ID，则按上述顺序的第一个匹配获胜，较低优先级的副本将被忽略。

### 包装包

插件目录可以包含一个 `package.json`，其中包含 `openclaw.extensions`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```

每个条目都会成为一个插件。如果包装包列出了多个扩展，则插件 ID 将成为 `name/<fileBase>`。

如果您的插件导入 npm 依赖项，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

### 渠道目录元数据

渠道插件可以通过 `openclaw.channel` 宣传入职元数据，并通过 `openclaw.install` 提供安装提示。这使得核心目录保持无数据状态。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
```

OpenClaw 还可以合并**外部渠道目录**（例如，MPM 注册表导出）。将 JSON 文件放入以下位置之一：
- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。

## 插件 ID

默认插件 IDs：

- 包装包：`package.json` `name`
- 独立文件：文件基本名称（`~/.../voice-call.ts` → `voice-call`）

如果插件导出 `id`，OpenClaw 会使用它，但在其与配置的 ID 不匹配时发出警告。

## 配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } }
    }
  }
}
```

字段：
- `enabled`：主开关（默认：真）
- `allow`：白名单（可选）
- `deny`：黑名单（可选；黑名单优先）
- `load.paths`：额外的插件文件/目录
- `entries.<id>`：每插件开关 + 配置

配置更改**需要重启网关**。

严格验证规则：
- 在 `entries`、`allow`、`deny` 或 `slots` 中出现未知插件 ID 会被视为**错误**。
- 未知 `channels.<id>` 键除非插件清单声明了渠道 ID，否则被视为**错误**。
- 插件配置使用嵌入在 `openclaw.plugin.json` 中的 JSON Schema 进行验证（`configSchema`）。
- 如果插件被禁用，其配置将被保留，并发出**警告**。

## 插件槽位（独占类别）

某些插件类别是**独占的**（一次只能有一个处于活动状态）。使用 `plugins.slots` 选择哪个插件拥有该槽位：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core" // or "none" to disable memory plugins
    }
  }
}
```

如果多个插件声明 `kind: "memory"`，则只有选定的一个会被加载。其他插件将被禁用，并生成诊断信息。

## 控制 UI（模式 + 标签）

控制 UI 使用 `config.schema`（JSON Schema + `uiHints`）来渲染更好的表单。

OpenClaw 在运行时根据发现的插件增强 `uiHints`：

- 为 `plugins.entries.<id>` / `.enabled` / `.config` 添加每插件标签
- 在以下位置合并可选插件提供的配置字段提示：
  `plugins.entries.<id>.config.<field>`

如果您希望插件配置字段显示良好的标签/占位符（并将机密标记为敏感），请在插件清单中与 JSON Schema 一起提供 `uiHints`。

示例：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "region": { "type": "string" }
    }
  },
  "uiHints": {
    "apiKey": { "label": "API Key", "sensitive": true },
    "region": { "label": "Region", "placeholder": "us-east-1" }
  }
}
```

## CLI

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins install <path>                 # copy a local file/dir into ~/.openclaw/extensions/<id>
openclaw plugins install ./extensions/voice-call # relative path ok
openclaw plugins install ./plugin.tgz           # install from a local tarball
openclaw plugins install ./plugin.zip           # install from a local zip
openclaw plugins install -l ./extensions/voice-call # link (no copy) for dev
openclaw plugins install @openclaw/voice-call # install from npm
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins doctor
```

`plugins update` 仅适用于在 `plugins.installs` 下跟踪的 npm 安装。

插件还可以注册自己的顶级命令（例如：`openclaw voicecall`）。

## 插件 API（概述）

插件导出以下内容之一：

- 函数：`(api) => { ... }`
- 对象：`{ id, name, configSchema, register(api) { ... } }`

## 插件钩子

插件可以提供钩子并在运行时注册它们。这使插件能够在无需单独安装钩子包的情况下捆绑事件驱动的自动化。

### 示例

```
import { registerPluginHooksFromDir } from "openclaw/plugin-sdk";

export default function register(api) {
  registerPluginHooksFromDir(api, "./hooks");
}
```

注意事项：
- 钩子目录遵循正常的钩子结构（`HOOK.md` + `handler.ts`）。
- 钩子资格规则仍然适用（操作系统/二进制文件/环境/配置要求）。
- 插件管理的钩子会在 `openclaw hooks list` 中显示，并带有 `plugin:<id>`。
- 您无法通过 `openclaw hooks` 启用或禁用插件管理的钩子；请改为启用或禁用插件。

## 提供商插件（模型身份验证）

插件可以注册**模型提供商身份验证**流程，以便用户可以在 OpenClaw 内部完成 OAuth 或 API 密钥设置（无需外部脚本）。

通过 `api.registerProvider(...)` 注册提供商。每个提供商公开一种或多种身份验证方法（OAuth、API 密钥、设备代码等）。这些方法支持：

- `openclaw models auth login --provider <id> [--method <id>]`

示例：

```ts
api.registerProvider({
  id: "acme",
  label: "AcmeAI",
  auth: [
    {
      id: "oauth",
      label: "OAuth",
      kind: "oauth",
      run: async (ctx) => {
        // Run OAuth flow and return auth profiles.
        return {
          profiles: [
            {
              profileId: "acme:default",
              credential: {
                type: "oauth",
                provider: "acme",
                access: "...",
                refresh: "...",
                expires: Date.now() + 3600 * 1000,
              },
            },
          ],
          defaultModel: "acme/opus-1",
        };
      },
    },
  ],
});
```

注意事项：
- `run` 接收一个 `ProviderAuthContext`，其中包含 `prompter`、`runtime`、`openUrl` 和 `oauth.createVpsAwareHandlers` 辅助函数。
- 当您需要添加默认模型或提供商配置时，返回 `configPatch`。
- 返回 `defaultModel`，以便 `--set-default` 可以更新代理默认值。

### 注册消息通道

插件可以注册**通道插件**，其行为类似于内置通道（WhatsApp、Telegram 等）。通道配置位于 `channels.<id>` 下，并由您的通道插件代码进行验证。

```ts
const myChannel = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "demo channel plugin.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      (cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? { accountId }),
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async () => ({ ok: true }),
  },
};

export default function (api) {
  api.registerChannel({ plugin: myChannel });
}
```

注意事项：
- 配置应放在 `channels.<id>` 下（而不是 `plugins.entries`）。
- `meta.label` 用于 CLI/UI 列表中的标签。
- `meta.aliases` 添加备用 ID，用于规范化和 CLI 输入。
- `meta.preferOver` 列出要跳过自动启用的通道 ID，当两者都已配置时。
- `meta.detailLabel` 和 `meta.systemImage` 使 UI 能够显示更丰富的通道标签/图标。

### 编写新的消息通道（分步指南）

当您想要一个**新的聊天界面**（“消息通道”），而不是模型提供商时，请使用此指南。模型提供商文档位于 `/providers/*` 下。

1) 选择 ID + 配置形状
- 所有通道配置都位于 `channels.<id>` 下。
- 对于多账户设置，优先选择 `channels.<id>.accounts.<accountId>`。

2) 定义通道元数据
- `meta.label`、`meta.selectionLabel`、`meta.docsPath`、`meta.blurb` 控制 CLI/UI 列表。
- `meta.docsPath` 应指向像 `/channels/<id>` 这样的文档页面。
- `meta.preferOver` 允许插件替换另一个通道（自动启用优先考虑它）。
- `meta.detailLabel` 和 `meta.systemImage` 由 UI 用于详细文本/图标。

3) 实现所需的适配器
- `config.listAccountIds` + `config.resolveAccount`
- `capabilities`（聊天类型、媒体、线程等）
- `outbound.deliveryMode` + `outbound.sendText`（用于基本发送）

4) 根据需要添加可选适配器
- `setup`（向导）、`security`（DM 政策）、 `status`（健康/诊断）
- `gateway`（启动/停止/登录）、`mentions`、`threading`、`streaming`
- `actions`（消息操作）、 `commands`（原生命令行为）

5) 在您的插件中注册通道
- `api.registerChannel({ plugin })`

最小配置示例：

```json5
{
  channels: {
    acmechat: {
      accounts: {
        default: { token: "ACME_TOKEN", enabled: true }
      }
    }
  }
}
```

最小通道插件（仅限出站）：

```ts
const plugin = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "AcmeChat messaging channel.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      (cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? { accountId }),
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // deliver `text` to your channel here
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin });
}
```

加载插件（扩展目录或 `plugins.load.paths`），重启网关，然后在您的配置中配置 `channels.<id>`。

### 代理工具

请参阅专用指南：[插件代理工具](/plugins/agent-tools)。

### 注册网关 RPC 方法

```ts
export default function (api) {
  api.registerGatewayMethod("myplugin.status", ({ respond }) => {
    respond(true, { ok: true });
  });
}
```

### 注册 CLI 命令

```ts
export default function (api) {
  api.registerCli(({ program }) => {
    program.command("mycmd").action(() => {
      console.log("Hello");
    });
  }, { commands: ["mycmd"] });
}
```

### 注册自动回复命令

插件可以注册自定义斜杠命令，这些命令**无需调用 AI 代理**即可执行。这对于切换命令、状态检查或不需要 LLM 处理的快速操作非常有用。

```ts
export default function (api) {
  api.registerCommand({
    name: "mystatus",
    description: "Show plugin status",
    handler: (ctx) => ({
      text: `Plugin is running! Channel: ${ctx.channel}`,
    }),
  });
}
```

命令处理器上下文：

- `senderId`：发件人的 ID（如有）
- `channel`：发送命令的渠道
- `isAuthorizedSender`：发件人是否为授权用户
- `args`：命令后传递的参数（如果 `acceptsArgs: true`）
- `commandBody`：完整的命令文本
- `config`：当前 OpenClaw 配置

命令选项：

- `name`：命令名称（不带前导 `/`）
- `description`：命令列表中显示的帮助文本
- `acceptsArgs`：命令是否接受参数（默认：否）。如果为否且提供了参数，命令将不匹配，消息将传递给其他处理器
- `requireAuth`：是否需要授权发件人（默认：是）
- `handler`：返回 `{ text: string }` 的函数（可以是异步的）

具有授权和参数的示例：

```ts
api.registerCommand({
  name: "setmode",
  description: "Set plugin mode",
  acceptsArgs: true,
  requireAuth: true,
  handler: async (ctx) => {
    const mode = ctx.args?.trim() || "default";
    await saveMode(mode);
    return { text: `Mode set to: ${mode}` };
  },
});
```

注意事项：
- 插件命令在内置命令和 AI 代理之前处理
- 命令在全球范围内注册，在所有渠道中均有效
- 命令名称不区分大小写（`/MyStatus` 与 `/mystatus` 匹配）
- 命令名称必须以字母开头，只能包含字母、数字、连字符和下划线
- 保留的命令名称（如 `help`、`status`、`reset` 等）不能被插件覆盖
- 插件之间重复注册命令将导致诊断错误。

### 注册后台服务

```ts
export default function (api) {
  api.registerService({
    id: "my-service",
    start: () => api.logger.info("ready"),
    stop: () => api.logger.info("bye"),
  });
}
```

## 命名约定

- 网关方法：`pluginId.action`（例如：`voicecall.status`）
- 工具：`snake_case`（例如：`voice_call`）
- CLI 命令：采用短横线或驼峰命名法，但避免与核心命令冲突

## 技能

插件可以在仓库中提供一项技能（`skills/<name>/SKILL.md`）。
通过 `plugins.entries.<id>.enabled`（或其他配置门控）启用它，并确保它存在于您的工作区或受管理技能的位置。

## 分发（npm）

推荐的打包方式：

- 主包：`openclaw`（本仓库）
- 插件：单独的 npm 包，位于 `@openclaw/*` 下（例如：`@openclaw/voice-call`）

发布合同：

- 插件 `package.json` 必须包含 `openclaw.extensions`，其中包含一个或多个入口文件。
- 入口文件可以是 `.js` 或 `.ts`（jiti 在运行时加载 TS）。
- `openclaw plugins install <npm-spec>` 使用 `npm pack`，提取到 `~/.openclaw/extensions/<id>/`，并在配置中启用它。
- 配置键稳定性：范围包被归一化为 `plugins.entries.*` 的**非范围** ID。

## 示例插件：语音通话

本仓库包含一个语音通话插件（Twilio 或日志回退）：

- 源：`extensions/voice-call`
- 技能：`skills/voice-call`
- CLI：`openclaw voicecall start|status`
- 工具：`voice_call`
- RPC：`voicecall.start`、`voicecall.status`
- 配置（twilio）：`provider: "twilio"` + `twilio.accountSid/authToken/from`（可选 `statusCallbackUrl`、`twimlUrl`）
- 配置（开发）：`provider: "log"`（无网络）

有关设置和使用，请参阅 [语音通话](/plugins/voice-call) 和 `extensions/voice-call/README.md`。

## 安全注意事项

插件与 Gateway 在同一进程中运行。请将其视为可信代码：

- 仅安装您信任的插件。
- 优先使用 `plugins.allow` 白名单。
- 更改后请重启 Gateway。

## 测试插件

插件可以（并且应该）提供测试：

- 仓库内的插件可以将 Vitest 测试保留在 `src/**` 下（例如：`src/plugins/voice-call.plugin.test.ts`）。
- 单独发布的插件应运行自己的 CI（lint/构建/测试），并验证 `openclaw.extensions` 是否指向构建的入口点（`dist/index.mjs`）。
