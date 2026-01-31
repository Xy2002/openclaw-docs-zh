---
summary: Apply multi-file patches with the apply_patch tool
read_when:
  - You need structured file edits across multiple files
  - You want to document or debug patch-based edits
---
# apply_patch 工具

使用结构化补丁格式应用文件更改。这非常适合多文件或多块编辑，其中单个 `edit` 调用会非常脆弱。

该工具接受一个 `input` 字符串，其中封装了一个或多个文件操作：

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## 参数

- `input`（必填）：完整的补丁内容，包括 `*** Begin Patch` 和 `*** End Patch`。

## 注意事项

- 路径是相对于工作区根目录解析的。
- 在 `*** Update File:` 块中使用 `*** Move to:` 来重命名文件。
- 必要时，`*** End of File` 标记仅在文件末尾插入内容。
- 实验性功能，默认禁用。可通过 `tools.exec.applyPatch.enabled` 启用。
- 仅适用于 OpenAI（包括 OpenAI Codex）。也可通过 `tools.exec.applyPatch.allowModels` 按模型有条件地启用。
- 配置仅位于 `tools.exec` 下。

## 示例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
