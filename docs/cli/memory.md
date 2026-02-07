---
summary: CLI reference for `openclaw memory` (status/index/search)
read_when:
  - You want to index or search semantic memory
  - You’re debugging memory availability or indexing
---
# `openclaw memory`

管理语义记忆的索引和搜索。
由活动记忆插件提供（默认：`memory-core`；设置 `plugins.slots.memory = "none"` 以禁用）。

相关：

- 记忆概念：[记忆](/concepts/memory)
- 插件：[插件](/plugins)

## 示例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory index
openclaw memory index --verbose
openclaw memory search "release checklist"
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 选项

通用：

- `--agent <id>`：将作用域限定为单个智能体（默认：所有已配置智能体）。
- `--verbose`：在探测和索引期间输出详细日志。

备注：

- `memory status --deep` 检测向量和嵌入的可用性。
- `memory status --deep --index` 如果存储了脏数据，则执行重新索引。
- `memory index --verbose` 输出各阶段的详细信息（提供者、模型、来源、批次活动）。
- `memory status` 包含通过 `memorySearch.extraPaths` 配置的任何额外路径。
