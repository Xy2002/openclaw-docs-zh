---
summary: How OpenClaw memory works (workspace files + automatic memory flush)
read_when:
  - You want the memory file layout and workflow
  - You want to tune the automatic pre-compaction memory flush
---
# 内存

OpenClaw 的内存由代理工作区中的纯 Markdown 文件构成。文件是事实的唯一来源；模型仅“记住”写入磁盘的内容。

内存搜索工具由活动内存插件提供（默认：`memory-core`）。可通过 `plugins.slots.memory = "none"` 禁用内存插件。

## 内存文件（Markdown）

默认的工作区布局采用两层内存：

- `memory/YYYY-MM-DD.md`
  - 每日日志（仅追加）。
  - 在会话开始时读取当天和昨天的内容。
- `MEMORY.md`（可选）
  - 精心维护的长期记忆。
  - **仅在主私密会话中加载**（绝不在群组上下文中加载）。

这些文件位于工作区目录下（`agents.defaults.workspace`，默认为 `~/.openclaw/workspace`）。有关完整布局，请参见 [代理工作区](/concepts/agent-workspace)。

## 何时写入内存

- 决策、偏好和持久性事实应写入 `MEMORY.md`。
- 日常笔记和运行上下文应写入 `memory/YYYY-MM-DD.md`。
- 如果有人要求“记住这一点”，请将其记录下来（不要只保存在 RAM 中）。
- 这一领域仍在不断发展。提醒模型存储记忆非常有帮助；它会知道该怎么做。
- 如果你希望某件事被记住，**请让机器人将其写入内存**。

## 自动内存刷新（预压缩 ping）

当会话**接近自动压缩**时，OpenClaw会触发一个**静默的代理回合**，提醒模型在上下文被压缩**之前**将持久性内存写入磁盘。默认提示明确指出模型*可以回复*，但通常`NO_REPLY`才是正确的响应，因此用户不会看到这一回合。

这由 `agents.defaults.compaction.memoryFlush` 控制：

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
        }
      }
    }
  }
}
```

详情：

- **软阈值**：当会话令牌估计超过 `contextWindow - reserveTokensFloor - softThresholdTokens` 时触发刷新。
- **默认静默**：提示包含 `NO_REPLY`，因此不会传递任何内容。
- **两个提示**：一个用户提示和一个系统提示附加了提醒。
- **每个压缩周期一次刷新**（在 `sessions.json` 中跟踪）。
- **工作区必须可写**：如果会话以沙盒模式运行，并启用了 `workspaceAccess: "ro"` 或 `"none"`，则跳过刷新。

有关完整的压缩生命周期，请参见 [会观管理 + 压缩](/reference/session-management-compaction)。

## 向量内存搜索

OpenClaw可以为`MEMORY.md`和`memory/*.md`（以及你选择加入的任何其他目录或文件）构建一个小型向量索引，以便即使措辞不同，语义查询也能找到相关笔记。

默认设置：

- 默认启用。
- 监控内存文件的变化（内置去抖动功能）。
- 默认使用远程嵌入。如果未设置 `memorySearch.provider`，OpenClaw 将自动选择：
  1. 如果已配置 `memorySearch.local.modelPath` 且相关文件存在，则使用 `local`。
  2. 如果能够解析 OpenAI 密钥，则使用 `openai`。
  3. 如果能够解析 Gemini 密钥，则使用 `gemini`。
  4. 否则，内存搜索将保持禁用状态，直到完成相应配置。
- 在本地模式下使用 node-llama-cpp，可能需要 `pnpm approve-builds`。
- 如果可用，使用 sqlite-vec 加速 SQLite 中的向量搜索。

远程嵌入**需要**嵌入提供商的API密钥。OpenClaw会从身份验证配置文件、`models.providers.*.apiKey`或环境变量中解析密钥。Codex OAuth仅支持聊天和补全功能，**不**能满足内存搜索所需的嵌入需求。对于Gemini，请使用`GEMINI_API_KEY`或`models.providers.google.apiKey`。当使用自定义的OpenAI兼容端点时，需设置`memorySearch.remote.apiKey`（以及可选的`memorySearch.remote.headers`）。

### 额外的内存路径

如果你想对默认工作区布局之外的 Markdown 文件进行索引，可以添加显式路径：

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

注意事项：

- 路径可以是绝对路径，也可以是相对于工作区的路径。
- 目录会递归扫描 `.md` 文件。
- 只有 Markdown 文件会被索引。
- 符号链接会被忽略（无论是文件还是目录）。

### 双子座嵌入（原生）

将提供商设置为 `gemini`，即可直接使用 Gemini 嵌入 API：

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

注意事项：

- `remote.baseUrl` 是可选的（默认为 Gemini API 的基础 URL）。
- `remote.headers` 允许在需要时添加额外的标头。
- 默认模型： `gemini-embedding-001`。

如果你想使用**自定义的 OpenAI 兼容端点**（OpenRouter、vLLM 或代理），可以使用带有 OpenAI 提供商的 `remote` 配置：

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

如果你不想设置 API 密钥，可以使用 `memorySearch.provider = "local"` 或设置 `memorySearch.fallback = "none"`。

后备方案：

- `memorySearch.fallback` 可以是 `openai`、`gemini`、`local` 或 `none`。
- 备用提供商仅在主要嵌入提供商失败时使用。

批量索引（OpenAI + Gemini）：

- 默认为 OpenAI 和 Gemini 嵌入启用。设置 `agents.defaults.memorySearch.remote.batch.enabled = false` 可禁用。
- 默认行为会等待批量完成；如有需要，可调整 `remote.batch.wait`、`remote.batch.pollIntervalMs` 和 `remote.batch.timeoutMinutes`。
- 设置 `remote.batch.concurrency` 可控制我们并行提交的批量作业数量（默认：2）。
- 当 `memorySearch.provider = "openai"` 或 `"gemini"` 时，会进入批量模式，并使用相应的 API 密钥。
- Gemini 批量作业使用异步嵌入批量端点，需要 Gemini Batch API 可用。

为什么 OpenAI 的批量处理既快速又便宜：

- 对于大规模回填，OpenAI 通常是我们在支持的选项中最快的，因为我们可以在单个批量作业中提交大量嵌入请求，并让 OpenAI 异步处理它们。
- OpenAI 为 Batch API 工作负载提供折扣价格，因此大型索引运行通常比同步发送相同请求更便宜。
- 有关详细信息，请参阅 OpenAI Batch API 文档和定价：
  - https://platform.openai.com/docs/api-reference/batch
  - https://platform.openai.com/pricing

配置示例：

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```

工具：

- `memory_search` — 返回包含文件和行范围的片段。
- `memory_get` — 根据路径读取内存文件内容。

本地模式：

- 设置 `agents.defaults.memorySearch.provider = "local"`。
- 提供 `agents.defaults.memorySearch.local.modelPath`（GGUF 或 `hf:`URI）。
- 可选：设置 `agents.defaults.memorySearch.fallback = "none"` 以避免回退到远程。

### 内存工具的工作原理

- `memory_search` 以语义方式搜索来自 `MEMORY.md` + `memory/**/*.md` 的 Markdown 块（目标约为 400 个标记，重叠 80 个标记）。它返回片段文本（上限约 700 个字符）、文件路径、行范围、得分、提供商/模型，以及是否从本地 → 远程嵌入回退。不会返回完整的文件载荷。
- `memory_get` 读取特定的内存 Markdown 文件（相对于工作区），可以选择从某一行开始读取 N 行。只有在 `memorySearch.extraPaths` 中显式列出的情况下，才允许使用 `MEMORY.md` / `memory/` 之外的路径。
- 两种工具仅在 `memorySearch.enabled` 对代理解析为真时启用。

### 什么会被索引（以及何时）

- 文件类型：仅支持 Markdown（`MEMORY.md`、`memory/**/*.md` 以及 `.md` 下的所有文件）。
- 索引存储：每个代理使用 SQLite 数据库，存储位置为 `~/.openclaw/memory/<agentId>.sqlite`（可通过 `agents.defaults.memorySearch.store.path` 进行配置，支持 `{agentId}` 个标记）。
- 新鲜度：针对 `MEMORY.md`、`memory/` 和 `memorySearch.extraPaths` 的监视器会将索引标记为“脏”（去抖动时间为 1.5 秒）。同步可在会话开始时、搜索时或按预设间隔触发，并以异步方式运行。会话记录使用增量阈值来触发后台同步。
- 重新索引触发条件：索引会存储嵌入的**提供商/模型 + 端点指纹 + 分块参数**。如果其中任何一项发生变化，OpenClaw 将自动重置并重新索引整个存储。

### 混合搜索（BM25 + 向量）

启用后，OpenClaw 结合：

- 向量相似性（语义匹配，措辞可以不同）
- BM25关键词相关性（精确标记，如ID、环境变量、代码符号）

如果您的平台无法进行全文搜索，OpenClaw 将回退到仅使用向量搜索。

#### 为什么采用混合搜索？

向量搜索非常适合处理“意思相同”的情况：

- “Mac Studio 网关主机”与“运行网关的机器”
- “去抖更新文件”与“避免每次写入都索引”

但在精确性和高信号标记方面可能较弱：

- ID（`a828e60`、`b3b9895a…`）
- 代码符号（`memorySearch.query.hybrid`）
- 错误字符串（“sqlite-vec 不可用”）

BM25（全文）则相反：在精确匹配方面表现优异，但在语义相似性检索方面相对较弱。混合搜索提供了一种务实的折中方案：**同时利用两种检索信号**，从而无论面对“自然语言”查询还是“大海捞针”式查询，都能取得良好的检索效果。

#### 我们如何合并结果（当前设计）

实现草图：

1) 从双方检索候选池：

- **向量**：根据余弦相似度排名前 `maxResults * candidateMultiplier`。
- **BM25**：根据 FTS5 BM25 排名前 `maxResults * candidateMultiplier`（数值越低越好）。

2) 将 BM25 排名转换为介于 0 和 1 左右的分数：

- `textScore = 1 / (1 + max(0, bm25Rank))`

3) 按块ID合并候选人，并计算加权分数：

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

注意事项：

- 在配置解析中，`vectorWeight` + `textWeight` 被归一化为 1.0，因此权重以百分比形式呈现。
- 如果嵌入不可用（或提供商返回零向量），我们仍会运行 BM25 并返回关键词匹配结果。
- 如果无法创建 FTS5，我们将继续使用仅基于向量的搜索（不会导致系统硬故障）。

这并非“IR理论上的完美”，但它简单、快速，而且往往能显著提升真实笔记的召回率和精确度。如果我们今后希望进一步优化模型，常见的下一步包括使用互反排序融合（RRF），或者在进行混合之前对分数进行归一化处理（例如采用最小/最大值归一化或Z分数归一化）。

配置：

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4
        }
      }
    }
  }
}
```

### 嵌入缓存

OpenClaw可以在SQLite中缓存**块嵌入**，从而在重新索引和频繁更新（尤其是会话记录）时，无需对未更改的文本重新进行嵌入。

配置：

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

### 会话内存搜索（实验性）

你可以选择对**会话记录**进行索引，并通过 `memory_search` 将其呈现出来。此功能受实验性标志的限制。

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

注意事项：

- 会话索引是**可选的**（默认关闭）。
- 会话更新经过去抖动处理，并在超过增量阈值后以**异步方式建立索引**（尽力而为）。
- `memory_search` 绝不会因索引操作而阻塞；在后台同步完成之前，查询结果可能会略显陈旧。
- 查询结果仍然仅包含片段；`memory_get` 仍受限于内存文件。
- 会话索引按代理进行隔离——只有该代理的会话日志会被索引。
- 会话日志存储在磁盘上（`~/.openclaw/agents/<agentId>/sessions/*.jsonl`）。任何拥有文件系统访问权限的进程或用户都可以读取这些日志，因此请将磁盘访问视为信任边界。若需更严格的隔离，可在单独的操作系统用户或主机下运行代理。

增量阈值（显示默认值）：

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // JSONL lines
        }
      }
    }
  }
}
```

__HEADING_0__SQLite向量加速（sqlite-vec）

当 sqlite-vec 扩展可用时，OpenClaw 会将嵌入存储在 SQLite 虚拟表中（`vec0`），并在数据库中执行向量距离查询。这样一来，无需将所有嵌入加载到 JavaScript 中，就能显著提升搜索速度。

配置（可选）：

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

注意事项：

- `enabled` 默认为 true；禁用后，搜索将回退到基于存储嵌入的进程内余弦相似度。
- 如果 sqlite-vec 扩展缺失或无法加载，OpenClaw 会记录错误，并继续使用 JS 回退（无向量表）。
- `extensionPath` 会覆盖捆绑的 sqlite-vec 路径（适用于自定义构建或非标准安装位置）。

### 本地嵌入自动下载

- 默认本地嵌入模型：`hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf`（约 0.6 GB）。
- 当 `memorySearch.provider = "local"`、`node-llama-cpp` 解析为 `modelPath` 时，如果 GGUF 缺失，它会**自动下载**到缓存（或如果设置了 `local.modelCacheDir`，则下载到指定位置），然后加载它。下载会在重试时恢复。
- 本地构建要求：运行 `pnpm approve-builds`，选择 `node-llama-cpp`，然后 `pnpm rebuild node-llama-cpp`。
- 备用方案：如果本地设置失败且 `memorySearch.fallback = "openai"`，我们会自动切换到远程嵌入（除非另有规定），并记录原因。

### 自定义 OpenAI 兼容端点示例

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

注意事项：

- `remote.*` 优先于 `models.providers.openai.*`。
- `remote.headers` 与 OpenAI 标头合并；在密钥冲突时，远程设置优先。省略 `remote.headers` 可使用 OpenAI 默认设置。
