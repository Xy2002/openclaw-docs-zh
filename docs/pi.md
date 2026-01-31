# Pi 集成架构

本文档介绍了 OpenClaw 如何与 [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 及其姊妹包（`pi-ai`、`pi-agent-core`、`pi-tui`）集成，从而为其 AI 代理功能提供支持。

## 概述

OpenClaw 使用 pi SDK 将 AI 编码代理嵌入到其消息网关架构中。与将 pi 作为子进程启动或使用 RPC 模式不同，OpenClaw 直接通过 `createAgentSession()` 导入并实例化 pi 的 `AgentSession`。这种嵌入式方法提供了以下优势：

- 完全控制会话生命周期和事件处理
- 自定义工具注入（消息传递、沙箱、特定于渠道的操作）
- 根据渠道/上下文自定义系统提示
- 支持分支和压缩的会话持久化
- 多账户身份验证配置文件轮换及故障转移
- 与提供商无关的模型切换

## 包依赖关系

```json
{
  "@mariozechner/pi-agent-core": "0.49.3",
  "@mariozechner/pi-ai": "0.49.3",
  "@mariozechner/pi-coding-agent": "0.49.3",
  "@mariozechner/pi-tui": "0.49.3"
}
```

| 包 | 用途 |
|---------|---------|
| `pi-ai` | 核心 LLM 抽象：`Model`、`streamSimple`、消息类型、提供商 API |
| `pi-agent-core` | 代理循环、工具执行、`AgentMessage` 类型 |
| `pi-coding-agent` | 高级 SDK：`createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、内置工具 |
| `pi-tui` | 终端 UI 组件（用于 OpenClaw 的本地 TUI 模式） |

## 文件结构

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports from pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Main entry: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Single attempt logic with session setup
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # Build response payloads from run results
│   │   ├── images.ts              # Vision model image injection
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error detection
│   ├── cache-ttl.ts               # Cache TTL tracking for context pruning
│   ├── compact.ts                 # Manual/auto compaction logic
│   ├── extensions.ts              # Load pi extensions for embedded runs
│   ├── extra-params.ts            # Provider-specific stream params
│   ├── google.ts                  # Google/Gemini turn ordering fixes
│   ├── history.ts                 # History limiting (DM vs group)
│   ├── lanes.ts                   # Session/global command lanes
│   ├── logger.ts                  # Subsystem logger
│   ├── model.ts                   # Model resolution via ModelRegistry
│   ├── runs.ts                    # Active run tracking, abort, queue
│   ├── sandbox-info.ts            # Sandbox info for system prompt
│   ├── session-manager-cache.ts   # SessionManager instance caching
│   ├── session-manager-init.ts    # Session file initialization
│   ├── system-prompt.ts           # System prompt builder
│   ├── tool-split.ts              # Split tools into builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel mapping, error description
├── pi-embedded-subscribe.ts       # Session event subscription/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool sent tracking
├── pi-embedded-helpers.ts         # Error classification, turn validation
├── pi-embedded-helpers/           # Helper modules
├── pi-embedded-utils.ts           # Formatting utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal wrapping for tools
├── pi-tools.policy.ts             # Tool allowlist/denylist policy
├── pi-tools.read.ts               # Read tool customizations
├── pi-tools.schema.ts             # Tool schema normalization
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings overrides
├── pi-extensions/                 # Custom pi extensions
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile resolution
├── auth-profiles.ts               # Profile store, cooldown, failover
├── model-selection.ts             # Default model resolution
├── models-config.ts               # models.json generation
├── model-catalog.ts               # Model catalog cache
├── context-window-guard.ts        # Context window validation
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt parameter resolution
├── system-prompt-report.ts        # Debug report generation
├── tool-summaries.ts              # Tool description summaries
├── tool-policy.ts                 # Tool policy resolution
├── transcript-policy.ts           # Transcript validation policy
├── skills.ts                      # Skill snapshot/prompt building
├── skills/                        # Skill subsystem
├── sandbox.ts                     # Sandbox context resolution
├── sandbox/                       # Sandbox subsystem
├── channel-tools.ts               # Channel-specific tool injection
├── openclaw-tools.ts              # OpenClaw-specific tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # Individual tool implementations
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── discord-actions*.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── slack-actions.ts
│   ├── telegram-actions.ts
│   ├── web-*.ts
│   └── whatsapp-actions.ts
└── ...
```

## 核心集成流程

### 1. 运行嵌入式代理

主要入口点是 `pi-embedded-runner/run.ts` 中的 `runEmbeddedPiAgent()`：

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. 创建会话

在 `runEmbeddedAttempt()` 内部（由 `runEmbeddedPiAgent()` 调用），使用 pi SDK：

```typescript
import { createAgentSession, SessionManager, SettingsManager } from "@mariozechner/pi-coding-agent";

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  systemPrompt: createSystemPromptOverride(appendPrompt),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  skills: [],
  contextFiles: [],
  additionalExtensionPaths,
});
```

### 3. 订阅事件

`subscribeEmbeddedPiSession()` 订阅 pi 的 `AgentSession` 事件：

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

处理的事件包括：
- `message_start` / `message_end` / `message_update`（流式文本/思考）
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. 发送提示

设置完成后，向会话发送提示：

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK 处理完整的代理循环：发送至 LLM、执行工具调用、流式响应。

## 工具架构

### 工具管道

1. **基础工具**：pi 的 `codingTools`（读取、bash、编辑、写入）
2. **自定义替换**：OpenClaw 用 `exec`/`process` 替换 bash，并为沙箱定制读取/编辑/写入工具
3. **OpenClaw 工具**：消息传递、浏览器、画布、会话、cron、网关等
4. **渠道工具**：Discord/Telegram/Slack/WhatsApp 特定操作工具
5. **策略过滤**：根据配置文件、提供商、代理、组、沙箱策略过滤工具
6. **模式归一化**：清理模式以适应 Gemini/OpenAI 的特殊要求
7. **AbortSignal 包装**：包装工具以尊重取消信号

### 工具定义适配器

pi-agent-core 的 `AgentTool` 具有与 pi-coding-agent 的 `ToolDefinition` 不同的 `execute` 签名。`pi-tool-definition-adapter.ts` 中的适配器弥合了这一差异：

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### 工具拆分策略

`splitSdkTools()` 通过 `customTools` 传递所有工具：

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [],  // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

这确保了 OpenClaw 的策略过滤、沙箱集成和扩展工具集在不同提供商之间保持一致。

## 系统提示构建

系统提示在 `buildAgentSystemPrompt()` (`system-prompt.ts`) 中构建。它组装了一个完整的提示，包含工具、工具调用风格、OpenClaw CLI 参考、技能、文档、工作区、沙箱、消息传递、回复标签、语音、静默回复、心跳、运行时元数据，以及启用时的记忆和反应，还有可选的上下文文件和额外的系统提示内容。对于子代理使用的最小提示模式，各部分会被裁剪。

提示通过 `systemPrompt` 覆盖传递给 pi：

```typescript
const systemPrompt = createSystemPromptOverride(appendPrompt);
// Returns: (defaultPrompt: string) => trimmed custom prompt
```

## 会话管理

### 会话文件

会话是具有树状结构（id/parentId 链接）的 JSONL 文件。Pi 的 `SessionManager` 负责持久化：

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw 用 `guardSessionManager()` 包装此功能，以确保工具结果的安全性。

### 会话缓存

`session-manager-cache.ts` 缓存 SessionManager 实例，以避免重复解析文件：

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 历史限制

`limitHistoryTurns()` 根据渠道类型（私信 vs 群组）修剪对话历史。

### 压缩

当上下文溢出时触发自动压缩。`compactEmbeddedPiSessionDirect()` 处理手动压缩：

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 身份验证与模型解析

### 身份验证配置文件

OpenClaw 维护一个身份验证配置文件存储，每个提供商有多个 API 密钥：

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

配置文件在出现故障时轮换，并跟踪冷却时间：

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### 模型解析

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider, modelId, agentDir, config
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### 故障转移

当配置时，`FailoverError` 触发模型回退：

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider, model: modelId, profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi 扩展

OpenClaw 加载自定义 pi 扩展以实现特殊行为：

### 压缩保障

`pi-extensions/compaction-safeguard.ts` 为压缩添加护栏，包括自适应令牌预算以及工具故障和文件操作摘要：

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### 上下文修剪

`pi-extensions/context-pruning.ts` 实现基于缓存 TTL 的上下文修剪：

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings, contextWindowTokens, isToolPrunable, lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## 流式传输与阻止回复

### 块分块

`EmbeddedBlockChunker` 管理流式文本，将其分成离散的回复块：

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### 思考/最终标记剥离

流式输出经过处理，以剥离 `<think>`/`<thinking>` 块，并提取 `<final>` 内容：

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### 回复指令

像 `[[media:url]]`、`[[voice]]`、`[[reply:id]]` 这样的回复指令被解析和提取：

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## 错误处理

### 错误分类

`pi-embedded-helpers.ts` 对错误进行分类，以便采取适当的处理措施：

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### 思考级别回退

如果某个思考级别不受支持，则会回退：

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## 沙箱集成

当沙箱模式启用时，工具和路径受到限制：

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## 特定于提供商的处理

### Anthropic

- 拒绝魔法字符串清理
- 连续角色的回合验证
- Claude Code 参数兼容性

### Google/Gemini

- 回合顺序修复（`applyGoogleTurnOrderingFix`）
- 工具模式净化（`sanitizeToolsForGoogle`）
- 会话历史净化（`sanitizeSessionHistory`）

### OpenAI

- 用于 Codex 模型的 `apply_patch` 工具
- 思考级别降级处理

## TUI 集成

OpenClaw 还有一个本地 TUI 模式，直接使用 pi-tui 组件：

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

这提供了类似于 pi 原生模式的交互式终端体验。

## 与 Pi CLI 的关键区别

| 方面 | Pi CLI | OpenClaw 嵌入式 |
|--------|--------|-------------------|
| 调用 | `pi` 命令 / RPC | SDK 通过 `createAgentSession()` |
| 工具 | 默认编码工具 | 自定义 OpenClaw 工具套件 |
| 系统提示 | AGENTS.md + 提示 | 动态按渠道/上下文 |
| 会话存储 | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（或 `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| 身份验证 | 单一凭证 | 多配置文件轮换 |
| 扩展 | 从磁盘加载 | 程序化 + 磁盘路径 |
| 事件处理 | TUI 渲染 | 基于回调（onBlockReply 等） |

## 未来考虑

可能需要重新设计的领域：

1. **工具签名对齐**：目前在 pi-agent-core 和 pi-coding-agent 签名之间进行适配
2. **会话管理器包装**：`guardSessionManager` 增加了安全性，但增加了复杂性
3. **扩展加载**：可以更直接地使用 pi 的 `ResourceLoader`
4. **流式处理器复杂度**：`subscribeEmbeddedPiSession` 已经变得庞大
5. **提供商特异性问题**：许多提供商特有的代码路径，pi 有可能处理

## 测试

涵盖 pi 集成及其扩展的所有现有测试：

- `src/agents/pi-embedded-block-chunker.test.ts`
- `src/agents/pi-embedded-helpers.buildbootstrapcontextfiles.test.ts`
- `src/agents/pi-embedded-helpers.classifyfailoverreason.test.ts`
- `src/agents/pi-embedded-helpers.downgradeopenai-reasoning.test.ts`
- `src/agents/pi-embedded-helpers.formatassistanterrortext.test.ts`
- `src/agents/pi-embedded-helpers.formatrawassistanterrorforui.test.ts`
- `src/agents/pi-embedded-helpers.image-dimension-error.test.ts`
- `src/agents/pi-embedded-helpers.image-size-error.test.ts`
- `src/agents/pi-embedded-helpers.isautherrormessage.test.ts`
- `src/agents/pi-embedded-helpers.isbillingerrormessage.test.ts`
- `src/agents/pi-embedded-helpers.iscloudcodeassistformaterror.test.ts`
- `src/agents/pi-embedded-helpers.iscompactionfailureerror.test.ts`
- `src/agents/pi-embedded-helpers.iscontextoverflowerror.test.ts`
- `src/agents/pi-embedded-helpers.isfailovererrormessage.test.ts`
- `src/agents/pi-embedded-helpers.islikelycontextoverflowerror.test.ts`
- `src/agents/pi-embedded-helpers.ismessagingtoolduplicate.test.ts`
- `src/agents/pi-embedded-helpers.messaging-duplicate.test.ts`
- `src/agents/pi-embedded-helpers.normalizetextforcomparison.test.ts`
- `src/agents/pi-embedded-helpers.resolvebootstrapmaxchars.test.ts`
- `src/agents/pi-embedded-helpers.sanitize-session-messages-images.keeps-tool-call-tool-result-ids-unchanged.test.ts`
- `src/agents/pi-embedded-helpers.sanitize-session-messages-images.removes-empty-assistant-text-blocks-but-preserves.test.ts`
- `src/agents/pi-embedded-helpers.sanitizegoogleturnordering.test.ts`
- `src/agents/pi-embedded-helpers.sanitizesessionmessagesimages-thought-signature-stripping.test.ts`
- `src/agents/pi-embedded-helpers.sanitizetoolcallid.test.ts`
- `src/agents/pi-embedded-helpers.sanitizeuserfacingtext.test.ts`
- `src/agents/pi-embedded-helpers.stripthoughtsignatures.test.ts`
- `src/agents/pi-embedded-helpers.validate-turns.test.ts`
- `src/agents/pi-embedded-runner-extraparams.live.test.ts`（实时）
- `src/agents/pi-embedded-runner-extraparams.test.ts`
- `src/agents/pi-embedded-runner.applygoogleturnorderingfix.test.ts`
- `src/agents/pi-embedded-runner.buildembeddedsandboxinfo.test.ts`
- `src/agents/pi-embedded-runner.createsystempromptoverride.test.ts`
- `src/agents/pi-embedded-runner.get-dm-history-limit-from-session-key.falls-back-provider-default-per-dm-not.test.ts`
- `src/agents/pi-embedded-runner.get-dm-history-limit-from-session-key.returns-undefined-sessionkey-is-undefined.test.ts`
- `src/agents/pi-embedded-runner.google-sanitize-thinking.test.ts`
- `src/agents/pi-embedded-runner.guard.test.ts`
- `src/agents/pi-embedded-runner.limithistoryturns.test.ts`
- `src/agents/pi-embedded-runner.resolvesessionagentids.test.ts`
- `src/agents/pi-embedded-runner.run-embedded-pi-agent.auth-profile-rotation.test.ts`
- `src/agents/pi-embedded-runner.sanitize-session-history.test.ts`
- `src/agents/pi-embedded-runner.splitsdktools.test.ts`
- `src/agents/pi-embedded-runner.test.ts`
- `src/agents/pi-embedded-subscribe.code-span-awareness.test.ts`
- `src/agents/pi-embedded-subscribe.reply-tags.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.calls-onblockreplyflush-before-tool-execution-start-preserve.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-append-text-end-content-is.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-call-onblockreplyflush-callback-is-not.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-duplicate-text-end-repeats-full.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-emit-duplicate-block-replies-text.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-block-replies-text-end-does-not.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-reasoning-as-separate-message-enabled.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.filters-final-suppresses-output-without-start-tag.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.includes-canvas-action-metadata-tool-summaries.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-assistanttexts-final-answer-block-replies-are.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-indented-fenced-blocks-intact.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.reopens-fenced-blocks-splitting-inside-them.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.splits-long-single-line-fenced-blocks-reopen.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.streams-soft-chunks-paragraph-preference.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.subscribeembeddedpisession.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.suppresses-message-end-block-replies-message-tool.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.waits-multiple-compaction-retries-before-resolving.test.ts`
- `src/agents/pi-embedded-subscribe.tools.test.ts`
- `src/agents/pi-embedded-utils.test.ts`
- `src/agents/pi-extensions/compaction-safeguard.test.ts`
- `src/agents/pi-extensions/context-pruning.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-tools-agent-config.test.ts`
- `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-b.test.ts`
- `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-d.test.ts`
- `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-f.test.ts`
- `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping.test.ts`
- `src/agents/pi-tools.policy.test.ts`
- `src/agents/pi-tools.safe-bins.test.ts`
- `src/agents/pi-tools.workspace-paths.test.ts`