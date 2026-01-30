# OpenClaw 中文文档

[![Daily Translation](https://github.com/YOUR_USERNAME/openclaw-docs-zh/actions/workflows/translate.yml/badge.svg)](https://github.com/YOUR_USERNAME/openclaw-docs-zh/actions/workflows/translate.yml)

[OpenClaw](https://github.com/openclaw/openclaw) 官方文档的自动中文翻译。

## 🌟 特性

- 🤖 使用 OpenAI API 自动翻译
- 📅 每日自动同步上游更新
- 🔄 增量翻译（只翻译变更的文件）
- ⚡ RPM/TPM 限流保护
- 📊 翻译进度追踪

## 📖 阅读文档

翻译后的文档位于 [`docs-zh/`](./docs-zh) 目录。

## 🚀 使用方法

### 手动翻译

```bash
# 安装依赖
npm install

# 构建
npm run build

# 从上游同步文档
GITHUB_TOKEN=your_token npm run sync

# 翻译文档
OPENAI_API_KEY=your_key npm run translate

# 增量翻译（只翻译变更的文件）
OPENAI_API_KEY=your_key npm run translate -- --incremental

# 查看翻译状态
npm run dev -- status
```

### 配置

复制 `config.example.json` 为 `config.json` 并根据需要修改：

```json
{
  "upstream": {
    "owner": "openclaw",
    "repo": "openclaw",
    "branch": "main",
    "docsPath": "docs"
  },
  "translation": {
    "model": "gpt-4o-mini",
    "targetLanguage": "zh-CN",
    "outputDir": "docs-zh"
  },
  "rateLimit": {
    "rpm": 500,
    "tpm": 200000,
    "maxConcurrent": 5
  }
}
```

### 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ |
| `OPENAI_BASE_URL` | 自定义 API 端点 (可选) | ❌ |
| `GITHUB_TOKEN` | GitHub 访问令牌 (用于同步) | ❌ |

## 🔧 GitHub Actions 设置

1. Fork 本仓库
2. 在 Settings → Secrets → Actions 中添加：
   - `OPENAI_API_KEY`: 你的 OpenAI API 密钥
   - `OPENAI_BASE_URL`: (可选) 自定义 API 端点
3. 工作流会在每天北京时间 10:00 自动运行
4. 也可以手动触发: Actions → Daily Documentation Translation → Run workflow

## 📁 项目结构

```
openclaw-docs-zh/
├── .github/workflows/   # GitHub Actions
├── src/                 # 翻译工具源码
├── docs/                # 原始英文文档 (从上游同步)
├── docs-zh/             # 翻译后的中文文档
└── config.json          # 配置文件
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进翻译质量！

## 📜 许可证

MIT License - 与上游 OpenClaw 项目保持一致
