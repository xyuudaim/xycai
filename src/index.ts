#!/usr/bin/env node
import prompts from 'prompts';
import kleur from 'kleur';
import path from 'path';
import { Language, Target, TRANSLATIONS, detectLanguage, CODEX_BASE_URL, CLAUDE_BASE_URL_DEFAULT } from './i18n';
import { backupFile, writeFileSafely, runInherit, head, ok, warn, bad, info, fetchWithTimeout } from './util';
import { loadModelChoices, DEFAULT_CODEX_MODEL, DEFAULT_CLAUDE_MODEL, CLAUDE_SMALL_FAST_MODEL } from './models';
import { scanConflicts, applyCleanup, ENV_VARS, codexHomeDir, claudeConfigDir } from './cleanup';
import { checkApi, ALT_ENDPOINTS } from './check';
import { runDoctor } from './doctor';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PKG = require('../package.json') as { version: string; name: string };

const onCancel = (lang: Language) => {
  console.log();
  console.log(kleur.yellow(TRANSLATIONS[lang].cancel));
  process.exit(0);
};

const ask = async <T>(q: prompts.PromptObject, lang: Language): Promise<T> => {
  const r = await prompts(q, { onCancel: () => onCancel(lang) });
  return r[q.name as string] as T;
};

const toggle = (lang: Language, message: string, initial = true) =>
  ask<boolean>({ type: 'toggle', name: 'v', message, initial, active: TRANSLATIONS[lang].yes, inactive: TRANSLATIONS[lang].no }, lang);

/** 启动时对比 npm 最新版，旧版提示改用 npx xycai@latest（npx 会缓存旧包） */
const versionCheck = async (lang: Language) => {
  try {
    const res = await fetchWithTimeout(`https://registry.npmjs.org/${PKG.name}/latest`, { headers: { accept: 'application/json' } }, 5000);
    if (!res.ok) return;
    const { version } = (await res.json()) as { version?: string };
    if (version && version !== PKG.version && cmpVer(version, PKG.version) > 0) {
      console.log(kleur.bold().yellow(`⚠  ${TRANSLATIONS[lang].outdated(PKG.version, version)}`));
      console.log();
    }
  } catch {
    /* offline: ignore */
  }
};
const cmpVer = (a: string, b: string) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
};

/** 清理步骤：扫描 → 列出 → 确认 → 执行；返回是否仍有本会话残留的环境变量 */
const cleanupStep = async (lang: Language, target: Target, interactive: boolean): Promise<void> => {
  const m = TRANSLATIONS[lang];
  head(m.scanTitle);
  const scan = await scanConflicts(target);
  const hasEnv = scan.env.length || scan.rc.length || scan.winEnv.length;
  const files = scan.files.filter((f) => f.removable);
  if (!hasEnv && !files.length && !scan.files.length) {
    ok(m.scanClean);
    return;
  }
  for (const e of scan.env) (e.source === 'dir' ? info : warn)(e.source === 'dir' ? `${e.name}=${e.value}` : m.scanEnv(e.name, e.value));
  for (const r of scan.rc) warn(m.scanRc(r.file, r.lineNo, r.line));
  for (const n of scan.winEnv) warn(m.scanWin(n));
  for (const f of scan.files) (f.removable ? info : warn)(m.scanFile(f.file, f.reason));
  const go = interactive ? await toggle(lang, m.cleanConfirm, true) : true;
  if (!go) {
    warn(m.cleanSkipped);
    return;
  }
  const rep = await applyCleanup(target, scan, { removeFiles: true });
  rep.rcEdited.forEach((f) => ok(m.cleanDoneRc(f)));
  rep.winRemoved.forEach((n) => ok(m.cleanDoneWin(n)));
  rep.filesRemoved.forEach((f) => ok(m.cleanDoneRemoved(f)));
  rep.filesEdited.forEach((f) => ok(m.cleanDoneEdited(f)));
  const still = ENV_VARS[target].filter((n) => process.env[n]?.trim());
  if (still.length) {
    warn(m.cleanEnvStillSet(still.join(', ')));
    // 本进程后续验证不能被旧变量影响
    for (const n of still) delete process.env[n];
  }
  if (rep.rcEdited.length || rep.winRemoved.length || still.length) console.log(kleur.bold().yellow(`  → ${m.cleanNeedNewTerminal}`));
};

const verifyStep = async (lang: Language, baseUrl: string, apiKey: string): Promise<void> => {
  const m = TRANSLATIONS[lang];
  head(m.verifyTitle);
  const r = await checkApi(baseUrl, apiKey);
  if (r.status === 'ok') return ok(m.verifyOk(r.models, r.ms));
  if (r.status === 'unauthorized') {
    bad(m.verifyUnauthorized);
    info(r.detail);
    return;
  }
  if (r.status === 'http') return warn(m.verifyHttp(r.code, r.detail));
  warn(m.verifyNetwork(r.detail));
  for (const alt of ALT_ENDPOINTS) {
    if (baseUrl.startsWith(alt)) continue;
    const r2 = await checkApi(alt, apiKey);
    if (r2.status === 'ok' || r2.status === 'unauthorized') return ok(m.verifyAltOk(alt));
  }
  bad(m.verifyAltNone);
};

const installStep = async (lang: Language, pkg: string) => {
  const m = TRANSLATIONS[lang];
  const args = ['install', '-g', pkg];
  const cmd = ['npm', ...args].join(' ');
  if (await toggle(lang, m.installConfirm(cmd), true)) {
    console.log(kleur.cyan(m.startInstall(cmd)));
    if (await runInherit('npm', args)) ok(m.installSuccess);
    else {
      bad(m.installFailed);
      process.exit(1);
    }
  } else warn(m.installSkipped);
};

const askApiKey = (lang: Language) =>
  ask<string>(
    {
      type: 'password',
      name: 'v',
      message: `${TRANSLATIONS[lang].apiKeyPrompt}\n`,
      hint: TRANSLATIONS[lang].apiKeyHint,
      validate: (v: string) => (v.trim().length > 0 ? true : TRANSLATIONS[lang].apiKeyValidation)
    },
    lang
  );

const configureCodex = async (lang: Language) => {
  const m = TRANSLATIONS[lang];
  await cleanupStep(lang, 'codex', true);
  await installStep(lang, '@openai/codex');
  const models = await loadModelChoices();
  info(models.live ? m.modelListLive : m.modelListFallback);
  const model = (await ask<string>({ type: 'select', name: 'v', message: m.codexModelPrompt, choices: models.codex, initial: 0 }, lang)) || DEFAULT_CODEX_MODEL;
  const apiKey = (await askApiKey(lang)).trim();

  const codexHome = codexHomeDir();
  const configPath = path.join(codexHome, 'config.toml');
  const authPath = path.join(codexHome, 'auth.json');
  head(m.writingConfig);
  for (const f of [configPath, authPath]) {
    const b = await backupFile(f);
    if (b) info(m.backupDone(b));
  }
  const configContent = `# Generated by npx xycai@latest (${PKG.version}) ${new Date().toISOString()}
model_provider = "xycai"
model = "${model}"
model_reasoning_effort = "high"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.xycai]
name = "xycai"
base_url = "${CODEX_BASE_URL}"
wire_api = "responses"
requires_openai_auth = false
http_headers = { "x-openai-actor-authorization" = "xyc.ai" }
`;
  await writeFileSafely(configPath, configContent);
  await writeFileSafely(authPath, JSON.stringify({ OPENAI_API_KEY: apiKey }, null, 2) + '\n');
  ok(m.configWritten(configPath));
  ok(m.configWritten(authPath));
  await verifyStep(lang, CODEX_BASE_URL, apiKey);
  console.log();
  console.log(kleur.bold().green(m.finished(m.targets.codex)));
  console.log(kleur.gray(m.docsHint));
};

const configureClaude = async (lang: Language) => {
  const m = TRANSLATIONS[lang];
  await cleanupStep(lang, 'claude', true);
  await installStep(lang, '@anthropic-ai/claude-code');
  const models = await loadModelChoices();
  info(models.live ? m.modelListLive : m.modelListFallback);
  const model = (await ask<string>({ type: 'select', name: 'v', message: m.claudeModelPrompt, choices: models.claude, initial: 0 }, lang)) || DEFAULT_CLAUDE_MODEL;
  const apiKey = (await askApiKey(lang)).trim();
  const baseRaw = await ask<string>(
    {
      type: 'text',
      name: 'v',
      message: m.claudeBaseUrlPrompt,
      initial: CLAUDE_BASE_URL_DEFAULT,
      hint: m.claudeBaseUrlHint,
      validate: (v: string) => {
        try {
          new URL(v.trim());
          return true;
        } catch {
          return m.baseUrlValidation;
        }
      }
    },
    lang
  );
  const baseUrl = baseRaw.trim().endsWith('/') ? baseRaw.trim() : `${baseRaw.trim()}/`;

  const settingsPath = path.join(claudeConfigDir(), 'settings.json');
  head(m.writingConfig);
  const b = await backupFile(settingsPath);
  if (b) info(m.backupDone(b));
  const settings = {
    env: {
      DISABLE_TELEMETRY: '1',
      ANTHROPIC_API_KEY: apiKey,
      ANTHROPIC_AUTH_TOKEN: apiKey,
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_MODEL: model,
      ANTHROPIC_SMALL_FAST_MODEL: CLAUDE_SMALL_FAST_MODEL,
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
      API_TIMEOUT_MS: '500000',
      BASH_DEFAULT_TIMEOUT_MS: '500000'
    },
    includeCoAuthoredBy: false,
    apiKeyHelper: `echo ${apiKey}`,
    permissions: { allow: [] as string[], deny: [] as string[] }
  };
  await writeFileSafely(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  ok(m.configWritten(settingsPath));
  await verifyStep(lang, baseUrl, apiKey);
  console.log();
  console.log(kleur.bold().green(m.finished(m.targets.claude)));
  console.log(kleur.gray(m.docsHint));
};

const pickLanguage = async (): Promise<Language> => {
  const def = detectLanguage();
  const choices = TRANSLATIONS[def].languageChoices;
  const idx = Math.max(0, choices.findIndex((c) => c.value === def));
  const v = await ask<Language>({ type: 'select', name: 'v', message: TRANSLATIONS[def].languagePrompt, choices, initial: idx }, def);
  return v || def;
};

const pickTarget = async (lang: Language): Promise<Target> => {
  const m = TRANSLATIONS[lang];
  const v = await ask<Target>(
    { type: 'select', name: 'v', message: m.targetPrompt, choices: [{ title: m.targets.codex, value: 'codex' }, { title: m.targets.claude, value: 'claude' }], initial: 0 },
    lang
  );
  return v || 'codex';
};

const usage = () => {
  console.log(`xycai ${PKG.version}
  npx xycai@latest                 interactive setup (clean → install → configure → verify)
  npx xycai@latest doctor [codex|claude]   diagnose the current machine and test the API with the effective key
  npx xycai@latest clean  [codex|claude]   only remove conflicting env vars / leftover config (with backups)
  npx xycai@latest --version | --help`);
};

const main = async () => {
  const argv = process.argv.slice(2);
  if (argv.includes('--version') || argv.includes('-v')) return console.log(PKG.version);
  if (argv.includes('--help') || argv.includes('-h')) return usage();
  const cmd = argv[0];
  const targetArg = (argv[1] === 'codex' || argv[1] === 'claude' ? argv[1] : undefined) as Target | undefined;
  const lang = argv.includes('--en') ? 'en' : argv.includes('--zh') ? 'zh' : argv.includes('--ja') ? 'ja' : detectLanguage();

  await versionCheck(lang);

  if (cmd === 'doctor') {
    const t = targetArg ?? (await pickTarget(lang));
    const good = await runDoctor(lang, t);
    process.exit(good ? 0 : 2);
  }
  if (cmd === 'clean') {
    const t = targetArg ?? (await pickTarget(lang));
    await cleanupStep(lang, t, true);
    return;
  }
  if (cmd && cmd !== 'setup') {
    usage();
    process.exit(1);
  }

  const chosenLang = await pickLanguage();
  const m = TRANSLATIONS[chosenLang];
  console.log();
  console.log(kleur.bold().magenta(m.welcome));
  const target = await pickTarget(chosenLang);
  if (target === 'codex') await configureCodex(chosenLang);
  else await configureClaude(chosenLang);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
