# OpenClaw 中文文档

[![Daily Translation](https://github.com/Xy2002/openclaw-docs-zh/actions/workflows/translate.yml/badge.svg)](https://github.com/Xy2002/openclaw-docs-zh/actions/workflows/translate.yml)

[OpenClaw](https://github.com/openclaw/openclaw) 官方文档的自动中文翻译。

## 🌟 特性

- 🤖 使用 OpenAI API 自动翻译
- 📅 每日自动同步上游更新
- 🔄 增量翻译（只翻译变更的文件）
- 🔧 自动修复 MDX 语法错误
- ✅ Mintlify 语法验证
- ⚡ RPM/TPM 限流保护

## 📖 阅读文档

翻译后的文档位于 [`docs/`](./docs) 目录。

## 🚀 使用方法

### 快速开始

```bash
# 安装依赖
npm install

# 构建
npm run build

# 本地运行完整流程（跳过 sync）
npm run workflow:local

# 干跑模式（查看会执行什么，不实际执行）
npm run workflow:dry
```

### 单独命令

```bash
# 从上游同步文档
npm run sync

# 翻译文档（需要 OPENAI_API_KEY）
npm run translate -- --incremental

# 修复语法错误
npm run fix

# 验证 MDX 语法
npm run validate

# 查看翻译状态
node dist/index.js status --source ./docs --output ./docs
```

### 使用 act 本地测试 GitHub Actions

需要安装 Docker 和 [act](https://github.com/nektos/act)。

```bash
# 安装 act
winget install nektos.act

# 创建 secrets 文件
Copy-Item .secrets.example .secrets
# 编辑 .secrets 填入你的 API keys

# 干跑模式
act workflow_dispatch -n

# 实际运行
act workflow_dispatch
```

### 配置

编辑 `config.json`：

```json
{
  "translation": {
    "model": "gpt-4o-mini",
    "targetLanguage": "zh-CN"
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
| `OPENAI_BASE_URL` | 自定义 API 端点 | ❌ |
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
├── .github/workflows/   # GitHub Actions 工作流
├── src/                 # 翻译工具源码
│   ├── index.ts         # CLI 入口
│   ├── translator.ts    # 翻译器
│   ├── sync.ts          # 上游同步
│   ├── syntax-fixer.ts  # 语法修复
│   └── validator.ts     # MDX 验证
├── docs/                # 翻译后的中文文档
├── config.json          # 配置文件
├── .actrc               # act 配置
└── .secrets.example     # secrets 模板
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进翻译质量！

## 📜 许可证

MIT License - 与上游 OpenClaw 项目保持一致
