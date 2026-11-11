# xycai

`xycai` is an interactive NPX wizard that wires CodeX or Claude Code CLIs to the XycAi API. It handles language selection, dependency installation, safe backups, and writes the correct API key configuration for you.

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
