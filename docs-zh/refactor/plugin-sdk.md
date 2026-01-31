---
summary: 'Plan: one clean plugin SDK + runtime for all messaging connectors'
read_when:
  - Defining or refactoring the plugin architecture
  - Migrating channel connectors to the plugin SDK/runtime
---
# 插件 SDK + 运行时重构计划

目标：每个消息传递连接器都作为一个插件（内置或外部）使用一套稳定的 API。任何插件都不直接从 `src/**` 导入。所有依赖项必须通过 SDK 或运行时来解决。

## 为何现在进行重构
- 当前的连接器混用了多种模式：直接导入核心模块、仅提供 dist 的桥接层以及自定义辅助工具。
- 这种混合模式导致升级过程脆弱，并阻碍了干净的外部插件接口的形成。

## 目标架构（两层结构）

### 1) 插件 SDK（编译时、稳定且可发布）
范围：类型、辅助函数和配置实用程序。无运行时状态，无副作用。

内容（示例）：
- 类型：`ChannelPlugin`、适配器、`ChannelMeta`、`ChannelCapabilities`、`ChannelDirectoryEntry`。
- 配置辅助函数：`buildChannelConfigSchema`、`setAccountEnabledInConfigSection`、`deleteAccountFromConfigSection`、`applyAccountNameToChannelSection`。
- 配对辅助函数：`PAIRING_APPROVED_MESSAGE`、`formatPairingApproveHint`。
- 引导辅助函数：`promptChannelAccessConfig`、`addWildcardAllowFrom`，以及引导相关类型。
- 工具参数辅助函数：`createActionGate`、`readStringParam`、`readNumberParam`、`readReactionParams`、`jsonResult`。
- 文档链接辅助函数：`formatDocsLink`。

交付方式：
- 作为 `openclaw/plugin-sdk` 发布（或在 `openclaw/plugin-sdk` 下从核心导出）。
- 使用语义版本控制，并明确保证稳定性。

### 2) 插件运行时（执行层，注入式）
范围：所有涉及核心运行时行为的部分。
通过 `OpenClawPluginApi.runtime` 访问，因此插件永远不会直接导入 `src/**`。

建议的最小但完整的接口：
```ts
export type PluginRuntime = {
  channel: {
    text: {
      chunkMarkdownText(text: string, limit: number): string[];
      resolveTextChunkLimit(cfg: OpenClawConfig, channel: string, accountId?: string): number;
      hasControlCommand(text: string, cfg: OpenClawConfig): boolean;
    };
    reply: {
      dispatchReplyWithBufferedBlockDispatcher(params: {
        ctx: unknown;
        cfg: unknown;
        dispatcherOptions: {
          deliver: (payload: { text?: string; mediaUrls?: string[]; mediaUrl?: string }) =>
            void | Promise<void>;
          onError?: (err: unknown, info: { kind: string }) => void;
        };
      }): Promise<void>;
      createReplyDispatcherWithTyping?: unknown; // adapter for Teams-style flows
    };
    routing: {
      resolveAgentRoute(params: {
        cfg: unknown;
        channel: string;
        accountId: string;
        peer: { kind: "dm" | "group" | "channel"; id: string };
      }): { sessionKey: string; accountId: string };
    };
    pairing: {
      buildPairingReply(params: { channel: string; idLine: string; code: string }): string;
      readAllowFromStore(channel: string): Promise<string[]>;
      upsertPairingRequest(params: {
        channel: string;
        id: string;
        meta?: { name?: string };
      }): Promise<{ code: string; created: boolean }>;
    };
    media: {
      fetchRemoteMedia(params: { url: string }): Promise<{ buffer: Buffer; contentType?: string }>;
      saveMediaBuffer(
        buffer: Uint8Array,
        contentType: string | undefined,
        direction: "inbound" | "outbound",
        maxBytes: number,
      ): Promise<{ path: string; contentType?: string }>;
    };
    mentions: {
      buildMentionRegexes(cfg: OpenClawConfig, agentId?: string): RegExp[];
      matchesMentionPatterns(text: string, regexes: RegExp[]): boolean;
    };
    groups: {
      resolveGroupPolicy(cfg: OpenClawConfig, channel: string, accountId: string, groupId: string): {
        allowlistEnabled: boolean;
        allowed: boolean;
        groupConfig?: unknown;
        defaultConfig?: unknown;
      };
      resolveRequireMention(
        cfg: OpenClawConfig,
        channel: string,
        accountId: string,
        groupId: string,
        override?: boolean,
      ): boolean;
    };
    debounce: {
      createInboundDebouncer<T>(opts: {
        debounceMs: number;
        buildKey: (v: T) => string | null;
        shouldDebounce: (v: T) => boolean;
        onFlush: (entries: T[]) => Promise<void>;
        onError?: (err: unknown) => void;
      }): { push: (v: T) => void; flush: () => Promise<void> };
      resolveInboundDebounceMs(cfg: OpenClawConfig, channel: string): number;
    };
    commands: {
      resolveCommandAuthorizedFromAuthorizers(params: {
        useAccessGroups: boolean;
        authorizers: Array<{ configured: boolean; allowed: boolean }>;
      }): boolean;
    };
  };
  logging: {
    shouldLogVerbose(): boolean;
    getChildLogger(name: string): PluginLogger;
  };
  state: {
    resolveStateDir(cfg: OpenClawConfig): string;
  };
};
```

注意事项：
- 运行时是访问核心行为的唯一途径。
- SDK 有意设计得小巧且稳定。
- 每个运行时方法都对应于现有的核心实现，不存在重复代码。

## 迁移计划（分阶段、安全可靠）

### 阶段 0：脚手架搭建
- 引入 `openclaw/plugin-sdk`。
- 将上述接口添加到 `api.runtime` 中的 `OpenClawPluginApi`。
- 在过渡期内保留现有导入，并发出弃用警告。

### 阶段 1：桥接层清理（低风险）
- 用 `api.runtime` 替换各扩展中的 `core-bridge.ts`。
- 先迁移 BlueBubbles 和 Zalo/Zalo Personal（两者已接近）。
- 移除重复的桥接代码。

### 阶段 2：轻量级直接导入插件
- 将 Matrix 迁移到 SDK + 运行时架构。
- 验证引导、目录和群组提及逻辑。

### 阶段 3：重量级直接导入插件
- 迁移 MS Teams（拥有最多运行时辅助函数）。
- 确保回复和打字语义与当前行为一致。

### 阶段 4：iMessage 插件化
- 将 iMessage 移至 `extensions/imessage`。
- 用 `api.runtime` 替代直接调用核心的行为。
- 保持配置键、CLI 行为和文档不变。

### 阶段 5：强制执行
- 添加 lint 规则 / CI 检查：禁止从 `src/**` 导入 `extensions/**`。
- 添加插件 SDK/运行时版本兼容性检查（运行时 + SDK 采用语义版本控制）。

## 兼容性和版本管理
- SDK：采用语义版本控制，公开发布并记录变更。
- 运行时：随核心版本进行版本管理，并增加 `api.runtime.version`。
- 插件需声明其所需的运行时范围（例如，`openclawRuntime: ">=2026.2.0"`）。

## 测试策略
- 适配器级别的单元测试：使用真实的核心实现来测试运行时函数。
- 每个插件的 Golden 测试：确保行为无漂移（路由、配对、白名单、提及控制等）。
- 在 CI 中使用单个端到端插件示例：安装、运行并执行冒烟测试。

## 待定问题
- SDK 类型应托管在独立包中，还是作为核心的导出？
- 运行时类型应分布于 SDK（仅包含类型）中，还是分布于核心中？
- 如何为内置插件和外部插件分别暴露文档链接？
- 在过渡期间，是否允许内部仓库插件有限度地直接导入核心？

## 成功标准
- 所有通道连接器都基于 SDK + 运行时作为插件。
- 不再从 `src/**` 导入 `extensions/**`。
- 新的连接器模板仅依赖于 SDK + 运行时。
- 外部插件无需访问核心源码即可开发和更新。

相关文档：[插件](/plugin)、[通道](/channels/index)、[配置](/gateway/configuration)。
