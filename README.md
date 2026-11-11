# xycai — XycAi（星云 AI）Claude / GPT API 中转与 AI 编程接入向导

> 一条命令把 **Codex**、**Claude Code** 接入 XycAi：`npx xycai@latest`  
> 自动清理本机冲突配置 → 安装/更新 CLI → 写入配置 → 真实请求验证；出问题运行 `npx xycai@latest doctor` 一键排查。

## XycAi（星云 AI）是什么：Claude、GPT API 中转与 AI 编程接入

开发 AI 应用，模型接入、价格对比、密钥管理和费用核算都会影响项目交付效率。**XycAi（星云 AI）** 提供多模型 **API 聚合与中转服务**，将 **GPT、Claude、Gemini、DeepSeek、Qwen** 等模型的接入与管理集中到一个平台，适合独立开发者、AI 编程用户和企业开发团队。

从功能设计来看，XycAi 值得关注的地方，是把"接入模型、比较成本、持续使用"这几个环节连接了起来。

### 官方域名

| 用途 | 域名 | 说明 |
|---|---|---|
| 官方主力域名 | [xyc.ai](https://xyc.ai) | 中国大陆需要代理访问 |
| 官方全球域名 | [xycai.us](https://xycai.us) | 全球通用主力域名 |
| 官方备份域名 | [xycai.cn](https://xycai.cn) | 中国境内站，数据互通 |

### 四大首创，让每次调用都有保障

1. **全时自建母号** — 官方母号池满血，实测 100+ 小时长任务存活，TTFT 低至 0.9s，企业中转 B 端稳定首选；首创技术注入产生的 Token 消耗全免费。
2. **全球税务合法可达** — 有进项的安全税务，含模型算法、ICP、EDI 备案；提供按订单、金额、月账单的普票、专票、财务收据在线申请。
3. **全网首创 SLA 自动赔付** — 服务 SLA 可用率低于 98%（工作流 99.9%）时，全自动赔付前 4 小时用量的 20% 金额。
4. **全网首创异常缓存 100% 退还** — 连续异常缓存收费时，退还 100% 错误缓存创建费用。

### 调用的便捷性

1. **OpenAI 兼容接口，减少重复接入工作** — 已使用 OpenAI SDK 的项目可以沿用熟悉的开发方式，只需配置平台提供的 API 地址、API Key 与模型名称；聊天应用、知识库、代码助手和 Agent 工作流都能集中接入，减少维护多套账号和计费入口的工作。
2. **Claude Code、Codex 接入，有现成配置可参考** — 密钥页面提供"连接 Key"入口，集中展示端点地址、环境变量、代码示例，以及 Codex、Claude Code、OpenCode 等工具的配置方式；本仓库的 `npx xycai@latest` 就是这套配置的一键版本。高频用户还可查看编程套餐，通过专属密钥管理套餐额度。
3. **比较模型价格，也把缓存成本算清楚** — 选择 Claude API 或 GPT API 服务时，值得一起查看输入、输出、缓存创建和缓存读取价格；长上下文任务和 Coding Agent 的缓存费用是总成本的重要部分。XycAi 模型广场集中展示模型能力、上下文信息、不同分组的价格与折扣，并提供在线率、缓存命中率等信息。具体价格和可用档位以页面当前展示为准。
4. **按项目管理密钥，让团队用量更清楚** — 不同项目分别创建 API Key，设置模型选择、管理标签、周期额度和有效期，结合用量记录与费用统计追踪成本；财务与发票功能方便团队处理费用核算。

服务保障方面，平台公开了 SLA 自动赔付与异常缓存费用退还机制，接入前可查看适用条件与规则。如果你正在寻找支持 OpenAI 兼容接口的 AI API 平台，可以先查看模型广场，选出常用模型，再参考文档完成接入，用自己的典型任务评估效果与成本。

把模型选择权留给开发者，让接入、用量和费用管理更清楚。 [访问官网](https://xyc.ai) · [查看模型与价格](https://xyc.ai/pricing) · [阅读接入文档](https://xyc.ai/docs)

---

# xycai CLI (English)

`xycai` is an interactive NPX wizard that wires CodeX or Claude Code CLIs to the XycAi API. It cleans up conflicting settings, installs the CLI, writes the configuration, and verifies it with a real API call.

## Highlights
- **Always use `npx xycai@latest`** — plain `npx xycai` may run a stale cached copy
- `npx xycai@latest doctor` diagnoses a broken setup: finds overriding env vars, leftover configs, `env_key` traps, and tests the API with the key that is actually in effect
- Cleanup step before writing: comments out `OPENAI_API_KEY` / `ANTHROPIC_*` exports in shell rc files (backed up), removes Windows user env vars, backs up & replaces stale configs, strips conflicting keys from `settings.local.json`
- Live verification after writing: one real `GET /v1/models` with your key, with automatic fallback endpoint probing
- Model list is fetched from xyc.ai so it is always the current line-up
- Zero-install: run everything in one command with `npx xycai@latest`
- Guided flow in English, 简体中文, and 日本語 with automatic locale detection
- Verifies the latest CodeX or Claude Code CLI by re-running the official npm installs
- Creates timestamped `.bak` backups before touching your configuration
- Writes production-ready templates for `~/.codex` and `~/.claude`

## Quick Start
1. Make sure you have Node.js 18+ and npm installed.
2. Run the wizard:
   ```bash
   npx xycai@latest
   ```
3. Choose your language and whether you want to configure **CodeX** or **Claude Code**.
4. Decide whether to let the wizard re-run the official npm install for the CLI you picked (recommended for the latest features).
5. Confirm that it can back up and overwrite your existing config files.
6. Paste your XycAi API key (the wizard links to <https://xyc.ai/keys>) and answer any remaining prompts.
7. Launch your CLI (`codex` or `claude`) and enjoy!

> Backups are written right next to the original files with names like `config.toml.20260101-103000.bak` so you can roll back instantly.

## What Gets Configured
### CodeX
- `~/.codex/config.toml` is rewritten with XycAi defaults, including the base URL `https://cn.chatapi.app/v1`
- Model choices are loaded live from xyc.ai; the first entry is the recommended default
- `~/.codex/auth.json` stores your `OPENAI_API_KEY` for XycAi

### Claude Code
- Installs/updates `@anthropic-ai/claude-code`
- `~/.claude/settings.json` gets an `env` block that points to XycAi (`https://cn.chatapi.app/`)
- You can override the base URL if you prefer a different XycAi edge host

## Development
```bash
npm install     # install dependencies
npm run lint    # type-check the project
npm run build   # compile TypeScript to dist/
```

During development you can run the CLI locally with `node dist/index.js` after building.

## Credits
Thanks to DogeNet LLC. This software is released under the MIT License (see [LICENSE](LICENSE)).
