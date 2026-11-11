export type Language = 'en' | 'zh' | 'ja';
export type Target = 'codex' | 'claude';

export const API_KEY_URL = 'https://xyc.ai/keys';
export const CODEX_BASE_URL = 'https://cn.chatapi.app/v1';
export const CLAUDE_BASE_URL_DEFAULT = 'https://cn.chatapi.app/';

export type Messages = {
  welcome: string;
  languagePrompt: string;
  languageChoices: Array<{ value: Language; title: string }>;
  cancel: string;
  targetPrompt: string;
  targets: Record<Target, string>;
  startInstall: (command: string) => string;
  installSuccess: string;
  installFailed: string;
  installConfirm: (command: string) => string;
  installSkipped: string;
  yes: string;
  no: string;
  codexModelPrompt: string;
  claudeModelPrompt: string;
  modelListLive: string;
  modelListFallback: string;
  apiKeyPrompt: string;
  apiKeyHint: string;
  apiKeyValidation: string;
  claudeBaseUrlPrompt: string;
  claudeBaseUrlHint: string;
  baseUrlValidation: string;
  writingConfig: string;
  backupDone: (file: string) => string;
  configWritten: (file: string) => string;
  finished: (targetLabel: string) => string;
  docsHint: string;
  // 版本
  outdated: (cur: string, latest: string) => string;
  // 清理
  scanTitle: string;
  scanClean: string;
  scanEnv: (name: string, value: string) => string;
  scanRc: (file: string, lineNo: number, line: string) => string;
  scanWin: (name: string) => string;
  scanFile: (file: string, reason: string) => string;
  cleanConfirm: string;
  cleanSkipped: string;
  cleanDoneRc: (file: string) => string;
  cleanDoneWin: (name: string) => string;
  cleanDoneRemoved: (file: string) => string;
  cleanDoneEdited: (file: string) => string;
  cleanNeedNewTerminal: string;
  cleanEnvStillSet: (names: string) => string;
  // 验证
  verifyTitle: string;
  verifyOk: (models: number, ms: number) => string;
  verifyUnauthorized: string;
  verifyHttp: (code: number, detail: string) => string;
  verifyNetwork: (detail: string) => string;
  verifyAltOk: (url: string) => string;
  verifyAltNone: string;
  // doctor
  doctorTitle: (target: string) => string;
  doctorCli: (name: string, version: string | null) => string;
  doctorConfigMissing: (file: string) => string;
  doctorConfig: (file: string, summary: string) => string;
  doctorKeyFrom: (source: string, masked: string) => string;
  doctorNoKey: string;
  doctorEnvOverride: (name: string) => string;
  doctorEnvKeyWarn: (name: string) => string;
  doctorProjectOverride: (file: string) => string;
  doctorSummaryOk: string;
  doctorSummaryFix: string;
  doctorRunWizard: string;
};

const common = {
  languageChoices: [
    { value: 'en' as Language, title: 'English' },
    { value: 'zh' as Language, title: '简体中文' },
    { value: 'ja' as Language, title: '日本語' }
  ]
};

export const TRANSLATIONS: Record<Language, Messages> = {
  en: {
    ...common,
    welcome: '🚀  Wire CodeX or Claude Code to XycAi — this wizard cleans up conflicts, writes the config and verifies it live.',
    languagePrompt: 'Select the language for this setup wizard',
    cancel: 'Setup cancelled. Nothing was changed.',
    targetPrompt: 'Which CLI do you want to configure?',
    targets: { codex: 'CodeX (OpenAI)', claude: 'Claude Code (Anthropic)' },
    startInstall: (c) => `Running ${c} ...`,
    installSuccess: 'Installation check completed.',
    installFailed: 'Installation failed. Review the errors above and run the wizard again.',
    installConfirm: (c) => `Run ${c} now to get the latest CLI release?`,
    installSkipped: 'Skipped installation; using the version already on this machine.',
    yes: 'Yes',
    no: 'No',
    codexModelPrompt: 'Pick the default CodeX model',
    claudeModelPrompt: 'Pick the default Claude Code model',
    modelListLive: 'Model list loaded from xyc.ai (current line-up).',
    modelListFallback: 'Could not reach xyc.ai; using the built-in model list.',
    apiKeyPrompt: `Paste your XycAi API key (create one at ${API_KEY_URL})`,
    apiKeyHint: 'Stored on this device only.',
    apiKeyValidation: 'Please enter a non-empty API key.',
    claudeBaseUrlPrompt: 'Claude Code base URL',
    claudeBaseUrlHint: `Press enter for ${CLAUDE_BASE_URL_DEFAULT}`,
    baseUrlValidation: 'Please enter a valid URL.',
    writingConfig: 'Writing configuration files...',
    backupDone: (f) => `Backup saved: ${f}`,
    configWritten: (f) => `Updated ${f}`,
    finished: (t) => `✅  All done! ${t} is now configured for XycAi.`,
    docsHint: 'Tip: `npx xycai@latest doctor` diagnoses a broken setup; `npx xycai@latest` re-runs this wizard.',
    outdated: (cur, latest) => `You are running xycai ${cur}; ${latest} is available. Please run: npx xycai@latest`,
    scanTitle: 'Scanning this machine for conflicting settings...',
    scanClean: 'No conflicting environment variables or leftover files found.',
    scanEnv: (n, v) => `Environment variable ${n} is set in your shell (${v}) — it overrides the config file.`,
    scanRc: (f, l, line) => `${f}:${l}  ${line}`,
    scanWin: (n) => `Windows user environment variable ${n} is set persistently.`,
    scanFile: (f, r) => `${f}  (${r})`,
    cleanConfirm: 'Clean these up now? (shell lines are commented out, files are backed up as .bak first)',
    cleanSkipped: 'Cleanup skipped — the leftovers above may keep overriding the new config.',
    cleanDoneRc: (f) => `Commented out conflicting lines in ${f}`,
    cleanDoneWin: (n) => `Removed Windows user variable ${n}`,
    cleanDoneRemoved: (f) => `Removed ${f} (backup kept)`,
    cleanDoneEdited: (f) => `Removed conflicting keys from ${f} (backup kept)`,
    cleanNeedNewTerminal: 'Open a NEW terminal window after this wizard so the removed variables are really gone.',
    cleanEnvStillSet: (n) => `Still set in this terminal session: ${n}. They are harmless after you open a new terminal.`,
    verifyTitle: 'Verifying with a real request to the API...',
    verifyOk: (m, ms) => `API reachable and key accepted (${m} models, ${ms} ms).`,
    verifyUnauthorized: 'The API rejected this key (401). Check it at https://xyc.ai/keys — copy the whole key, no spaces.',
    verifyHttp: (c, d) => `API answered HTTP ${c}: ${d}`,
    verifyNetwork: (d) => `Could not reach the endpoint (${d}). Trying the backup endpoints...`,
    verifyAltOk: (u) => `Backup endpoint works: ${u}. Re-run the wizard and enter this base URL if the default stays unreachable.`,
    verifyAltNone: 'No endpoint reachable from this network. Check proxy/VPN/firewall, then run `npx xycai@latest doctor`.',
    doctorTitle: (t) => `🩺  XycAi doctor — ${t}`,
    doctorCli: (n, v) => (v ? `${n} installed: ${v}` : `${n} is not installed or not on PATH`),
    doctorConfigMissing: (f) => `Config file missing: ${f} — run \`npx xycai@latest\` to create it.`,
    doctorConfig: (f, s) => `${f}: ${s}`,
    doctorKeyFrom: (s, m) => `Effective API key comes from ${s}: ${m}`,
    doctorNoKey: 'No API key found anywhere — run `npx xycai@latest`.',
    doctorEnvOverride: (n) => `${n} is set in the environment and overrides the key in the config file. If it is an old key you will get 401.`,
    doctorEnvKeyWarn: (n) => `config.toml sets env_key = "${n}" — CodeX will demand that environment variable ("Missing environment variable"). The XycAi template does not use env_key.`,
    doctorProjectOverride: (f) => `Project-level config found at ${f}; it overrides your user config inside this folder.`,
    doctorSummaryOk: 'Everything looks good. If the CLI still fails, copy this output to support.',
    doctorSummaryFix: 'Problems found above. Easiest fix: run `npx xycai@latest`, let it clean up, then open a new terminal.',
    doctorRunWizard: 'Run `npx xycai@latest` to (re)configure.'
  },
  zh: {
    ...common,
    welcome: '🚀  把 CodeX / Claude Code 接入 XycAi：先清理本机冲突，再写入配置，最后真实请求验证。',
    languagePrompt: '请选择向导语言',
    cancel: '已取消，未做任何修改。',
    targetPrompt: '要配置哪一个 CLI？',
    targets: { codex: 'CodeX（OpenAI）', claude: 'Claude Code（Anthropic）' },
    startInstall: (c) => `正在执行 ${c} ……`,
    installSuccess: '安装检查完成。',
    installFailed: '安装失败，请查看上方报错后重新运行向导。',
    installConfirm: (c) => `是否现在执行 ${c} 更新到最新版 CLI？`,
    installSkipped: '已跳过安装，使用本机现有版本。',
    yes: '是',
    no: '否',
    codexModelPrompt: '选择 CodeX 默认模型',
    claudeModelPrompt: '选择 Claude Code 默认模型',
    modelListLive: '模型列表已从 xyc.ai 实时获取。',
    modelListFallback: '无法连接 xyc.ai，使用内置模型列表。',
    apiKeyPrompt: `粘贴你的 XycAi API Key（在 ${API_KEY_URL} 创建）`,
    apiKeyHint: '密钥只保存在本机。',
    apiKeyValidation: 'API Key 不能为空。',
    claudeBaseUrlPrompt: 'Claude Code 的 Base URL',
    claudeBaseUrlHint: `直接回车使用 ${CLAUDE_BASE_URL_DEFAULT}`,
    baseUrlValidation: '请输入合法的 URL。',
    writingConfig: '正在写入配置文件……',
    backupDone: (f) => `已备份：${f}`,
    configWritten: (f) => `已更新 ${f}`,
    finished: (t) => `✅  完成！${t} 已配置为使用 XycAi。`,
    docsHint: '提示：配置出问题时运行 `npx xycai@latest doctor` 一键排查；重新配置运行 `npx xycai@latest`。',
    outdated: (cur, latest) => `你运行的是旧版 xycai ${cur}（最新 ${latest}）。请改用：npx xycai@latest`,
    scanTitle: '正在扫描本机的冲突配置……',
    scanClean: '没有发现冲突的环境变量或残留文件。',
    scanEnv: (n, v) => `当前 shell 里设置了环境变量 ${n}（${v}），它会覆盖配置文件里的值。`,
    scanRc: (f, l, line) => `${f}:${l}  ${line}`,
    scanWin: (n) => `Windows 用户级环境变量 ${n} 被永久设置了。`,
    scanFile: (f, r) => `${f}（${r}）`,
    cleanConfirm: '现在清理这些？（shell 里的行会被注释掉，文件先备份为 .bak 再处理）',
    cleanSkipped: '已跳过清理——上面这些残留可能继续覆盖新配置。',
    cleanDoneRc: (f) => `已注释 ${f} 中的冲突行`,
    cleanDoneWin: (n) => `已删除 Windows 用户变量 ${n}`,
    cleanDoneRemoved: (f) => `已删除 ${f}（保留备份）`,
    cleanDoneEdited: (f) => `已从 ${f} 移除冲突键（保留备份）`,
    cleanNeedNewTerminal: '向导结束后请【新开一个终端窗口】再使用，旧窗口里的环境变量仍然生效。',
    cleanEnvStillSet: (n) => `当前终端会话里仍带着：${n}。新开终端后即消失。`,
    verifyTitle: '正在用刚写入的配置真实请求 API 验证……',
    verifyOk: (m, ms) => `API 可达、密钥有效（${m} 个模型，${ms} ms）。`,
    verifyUnauthorized: 'API 拒绝了这把密钥（401）。请到 https://xyc.ai/keys 核对：整串复制、不要带空格、确认密钥未被删除或停用。',
    verifyHttp: (c, d) => `API 返回 HTTP ${c}：${d}`,
    verifyNetwork: (d) => `连不上端点（${d}），正在尝试备用端点……`,
    verifyAltOk: (u) => `备用端点可用：${u}。如默认端点一直不通，重新运行向导并填写这个地址。`,
    verifyAltNone: '当前网络连不上任何端点。请检查代理/VPN/防火墙，然后运行 `npx xycai@latest doctor`。',
    doctorTitle: (t) => `🩺  XycAi 排查 — ${t}`,
    doctorCli: (n, v) => (v ? `${n} 已安装：${v}` : `${n} 未安装或不在 PATH 里`),
    doctorConfigMissing: (f) => `配置文件不存在：${f} —— 运行 \`npx xycai@latest\` 生成。`,
    doctorConfig: (f, s) => `${f}：${s}`,
    doctorKeyFrom: (s, m) => `实际生效的 API Key 来自 ${s}：${m}`,
    doctorNoKey: '任何地方都没有找到 API Key —— 运行 `npx xycai@latest`。',
    doctorEnvOverride: (n) => `环境变量 ${n} 已设置，会覆盖配置文件里的密钥；如果它是旧密钥就会报 401 Invalid token。`,
    doctorEnvKeyWarn: (n) => `config.toml 里写了 env_key = "${n}"，CodeX 会强制要求这个环境变量（报 Missing environment variable）。XycAi 模板不用 env_key。`,
    doctorProjectOverride: (f) => `发现项目级配置 ${f}，在这个目录下它会覆盖用户配置。`,
    doctorSummaryOk: '一切正常。如果 CLI 仍然报错，把以上输出发给客服。',
    doctorSummaryFix: '以上有问题。最简单的修法：运行 `npx xycai@latest`，让它清理并重写配置，然后新开终端。',
    doctorRunWizard: '运行 `npx xycai@latest` 重新配置。'
  },
  ja: {
    ...common,
    welcome: '🚀  CodeX / Claude Code を XycAi に接続します。競合を掃除し、設定を書き込み、実際に API を呼んで確認します。',
    languagePrompt: 'ウィザードの言語を選択してください',
    cancel: '中止しました。何も変更していません。',
    targetPrompt: 'どの CLI を設定しますか？',
    targets: { codex: 'CodeX（OpenAI）', claude: 'Claude Code（Anthropic）' },
    startInstall: (c) => `${c} を実行中…`,
    installSuccess: 'インストール確認が完了しました。',
    installFailed: 'インストールに失敗しました。上のエラーを確認して再実行してください。',
    installConfirm: (c) => `${c} を実行して最新版にしますか？`,
    installSkipped: 'インストールをスキップしました。',
    yes: 'はい',
    no: 'いいえ',
    codexModelPrompt: 'CodeX のデフォルトモデル',
    claudeModelPrompt: 'Claude Code のデフォルトモデル',
    modelListLive: 'モデル一覧を xyc.ai から取得しました。',
    modelListFallback: 'xyc.ai に接続できないため内蔵の一覧を使います。',
    apiKeyPrompt: `XycAi の API Key を貼り付けてください（${API_KEY_URL} で作成）`,
    apiKeyHint: 'この端末にのみ保存されます。',
    apiKeyValidation: 'API Key を入力してください。',
    claudeBaseUrlPrompt: 'Claude Code の Base URL',
    claudeBaseUrlHint: `Enter で ${CLAUDE_BASE_URL_DEFAULT}`,
    baseUrlValidation: '正しい URL を入力してください。',
    writingConfig: '設定ファイルを書き込んでいます…',
    backupDone: (f) => `バックアップ: ${f}`,
    configWritten: (f) => `${f} を更新しました`,
    finished: (t) => `✅  完了！${t} は XycAi で利用できます。`,
    docsHint: 'ヒント: 不調時は `npx xycai@latest doctor`、再設定は `npx xycai@latest`。',
    outdated: (cur, latest) => `古い xycai ${cur} を実行しています（最新 ${latest}）。npx xycai@latest を使ってください。`,
    scanTitle: '競合する設定をスキャンしています…',
    scanClean: '競合する環境変数や残存ファイルはありません。',
    scanEnv: (n, v) => `シェルに環境変数 ${n}（${v}）が設定されており、設定ファイルより優先されます。`,
    scanRc: (f, l, line) => `${f}:${l}  ${line}`,
    scanWin: (n) => `Windows のユーザー環境変数 ${n} が永続設定されています。`,
    scanFile: (f, r) => `${f}（${r}）`,
    cleanConfirm: '今すぐ掃除しますか？（シェルの行はコメントアウト、ファイルは .bak に退避）',
    cleanSkipped: '掃除をスキップしました。残存設定が新しい設定を上書きする可能性があります。',
    cleanDoneRc: (f) => `${f} の競合行をコメントアウトしました`,
    cleanDoneWin: (n) => `Windows ユーザー変数 ${n} を削除しました`,
    cleanDoneRemoved: (f) => `${f} を削除しました（バックアップあり）`,
    cleanDoneEdited: (f) => `${f} から競合キーを削除しました（バックアップあり）`,
    cleanNeedNewTerminal: '終了後は新しいターミナルを開いてください。',
    cleanEnvStillSet: (n) => `このセッションにはまだ残っています: ${n}（新しいターミナルで消えます）`,
    verifyTitle: '実際に API を呼んで確認しています…',
    verifyOk: (m, ms) => `API に到達し、キーは有効です（${m} モデル、${ms} ms）。`,
    verifyUnauthorized: 'API がこのキーを拒否しました（401）。https://xyc.ai/keys で確認してください。',
    verifyHttp: (c, d) => `API 応答 HTTP ${c}: ${d}`,
    verifyNetwork: (d) => `エンドポイントに接続できません（${d}）。予備エンドポイントを試します…`,
    verifyAltOk: (u) => `予備エンドポイントが利用可能: ${u}`,
    verifyAltNone: 'どのエンドポイントにも接続できません。プロキシ/VPN/ファイアウォールを確認してください。',
    doctorTitle: (t) => `🩺  XycAi doctor — ${t}`,
    doctorCli: (n, v) => (v ? `${n}: ${v}` : `${n} が見つかりません`),
    doctorConfigMissing: (f) => `設定ファイルがありません: ${f}`,
    doctorConfig: (f, s) => `${f}: ${s}`,
    doctorKeyFrom: (s, m) => `有効な API Key の出所: ${s}（${m}）`,
    doctorNoKey: 'API Key が見つかりません。`npx xycai@latest` を実行してください。',
    doctorEnvOverride: (n) => `環境変数 ${n} が設定ファイルのキーを上書きしています。古いキーなら 401 になります。`,
    doctorEnvKeyWarn: (n) => `config.toml に env_key = "${n}" があり、CodeX はその環境変数を必須にします。`,
    doctorProjectOverride: (f) => `プロジェクト設定 ${f} がユーザー設定を上書きします。`,
    doctorSummaryOk: '問題は見つかりませんでした。',
    doctorSummaryFix: '問題があります。`npx xycai@latest` を実行して掃除・再設定し、新しいターミナルを開いてください。',
    doctorRunWizard: '`npx xycai@latest` で再設定してください。'
  }
};

export const detectLanguage = (): Language => {
  const env = (process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || process.env.LC_MESSAGES || '').toLowerCase();
  if (env.startsWith('zh')) return 'zh';
  if (env.startsWith('ja')) return 'ja';
  return 'en';
};
