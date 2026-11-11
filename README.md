# XycAi 大模型 API 中转站 — AI 中转站 Claude / GPT 低至 2 折

**XycAi（星云 AI）** 是面向开发者和企业的 **大模型 API 中转站**：**Claude 中转站、GPT 中转站、API 中转站** 一站接入，Claude / GPT 低至 2 折，**企业合法开票（普票、专票都能开）**，**异常缓存创建费 100% 退还**，**SLA 不达标自动赔付 20%**，**延迟超标自动赔付、无需申请**。

> 本仓库是 XycAi 的一键接入工具：`npx xycai@latest` 把 **Codex**、**Claude Code** 接到 XycAi API 中转站——自动清理本机冲突配置 → 安装/更新 CLI → 写入配置 → 真实请求验证；出问题运行 `npx xycai@latest doctor` 一键排查。

## 为什么选 XycAi 这个 AI 中转站

开发 AI 应用，模型接入、价格对比、密钥管理和费用核算都会影响交付效率。XycAi 把 **GPT、Claude、Gemini、DeepSeek、Qwen** 等模型的接入与管理集中到一个 API 中转站，适合独立开发者、AI 编程用户和企业开发团队，把"接入模型、比较成本、持续使用"连接起来。

### 官方域名

| 用途 | 域名 | 说明 |
|---|---|---|
| 官方主力域名 | [xyc.ai](https://xyc.ai) | 中国大陆需要代理访问 |
| 官方全球域名 | [xycai.us](https://xycai.us) | 全球通用主力域名 |
| 官方备份域名 | [xycai.cn](https://xycai.cn) | 中国境内站，数据互通 |

### 四大保障（全网首创）

1. **Claude / GPT 低至 2 折，全时自建母号** — 官方母号池满血，实测 100+ 小时长任务存活，TTFT 低至 0.9s，企业中转 B 端稳定首选；技术注入产生的 Token 消耗全免费。
2. **企业合法开票，普票专票都能开** — 有进项的安全税务，含模型算法、ICP、EDI 备案；月账单、订单、发票在线申请，普票、专票、财务收据一键申请。
3. **SLA 不达标自动赔付 20%** — 服务可用率低于 98%（工作流 99.9%）或延迟超标时，全自动赔付前 4 小时用量的 20% 金额，无需申请。
4. **异常缓存创建费 100% 退还** — 连续异常缓存收费时，退还 100% 错误缓存创建费用。

### 接入有多方便

1. **OpenAI 兼容接口** — 已用 OpenAI SDK 的项目直接换 API 地址、API Key 与模型名即可；聊天应用、知识库、代码助手、Agent 工作流集中接入，不用维护多套账号和计费入口。
2. **Claude Code、Codex、OpenCode 现成配置** — 密钥页「连接 Key」集中展示端点地址、环境变量、代码示例；本仓库的 `npx xycai@latest` 就是一键版。高频用户可用编程套餐，专属密钥管理套餐额度。
3. **价格和缓存成本一起看** — 模型广场集中展示输入 / 输出 / 缓存创建 / 缓存读取价格、不同分组的折扣、在线率、缓存命中率，按实际任务比较模型与渠道。具体价格以页面当前展示为准。
4. **按项目管理密钥** — 每个项目独立 API Key，可设模型范围、标签、周期额度和有效期；用量记录、费用统计、财务与发票功能方便团队核算。

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
