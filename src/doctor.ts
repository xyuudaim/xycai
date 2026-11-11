import { homedir } from 'os';
import path from 'path';
import kleur from 'kleur';
import { Language, TRANSLATIONS, Target } from './i18n';
import { scanConflicts, codexHomeDir, claudeConfigDir } from './cleanup';
import { checkApi, ALT_ENDPOINTS } from './check';
import { head, ok, warn, bad, info, runCapture, readTextIfExists, readJsonIfExists, tomlGet, maskSecret } from './util';

/** 解析当前机器上「实际生效」的 base_url + key，并打印诊断 */
export const runDoctor = async (lang: Language, target: Target): Promise<boolean> => {
  const m = TRANSLATIONS[lang];
  let problems = 0;
  head(m.doctorTitle(m.targets[target]));
  info(`node ${process.version} · ${process.platform} ${process.arch} · cwd ${process.cwd()}`);

  const scan = await scanConflicts(target);
  let baseUrl = '';
  let apiKey = '';
  let keySource = '';

  if (target === 'codex') {
    const v = await runCapture('codex', ['--version']);
    v ? ok(m.doctorCli('codex', v.split('\n')[0])) : (warn(m.doctorCli('codex', null)), problems++);
    const codexHome = codexHomeDir();
    const cfgPath = path.join(codexHome, 'config.toml');
    const cfg = await readTextIfExists(cfgPath);
    if (cfg === null) {
      bad(m.doctorConfigMissing(cfgPath));
      problems++;
    } else {
      const provider = tomlGet(cfg, null, 'model_provider') || 'openai';
      const model = tomlGet(cfg, null, 'model') || '?';
      baseUrl = tomlGet(cfg, `model_providers.${provider}`, 'base_url') || '';
      const envKey = tomlGet(cfg, `model_providers.${provider}`, 'env_key');
      ok(m.doctorConfig(cfgPath, `model_provider=${provider} model=${model} base_url=${baseUrl || '(default OpenAI)'}`));
      if (provider === 'openai' || !baseUrl.includes('chatapi') && !baseUrl.includes('xyc')) {
        warn(`model_provider / base_url does not point to XycAi. ${m.doctorRunWizard}`);
        problems++;
      }
      if (envKey) {
        warn(m.doctorEnvKeyWarn(envKey));
        problems++;
        if (process.env[envKey]) {
          apiKey = process.env[envKey]!;
          keySource = `env ${envKey}`;
        }
      }
    }
    const auth = await readJsonIfExists(path.join(codexHome, 'auth.json'));
    const authKey = auth && typeof auth.OPENAI_API_KEY === 'string' ? (auth.OPENAI_API_KEY as string) : '';
    if (process.env.OPENAI_API_KEY?.trim()) {
      apiKey = process.env.OPENAI_API_KEY;
      keySource = 'env OPENAI_API_KEY';
      if (authKey && authKey !== apiKey) {
        warn(m.doctorEnvOverride('OPENAI_API_KEY'));
        problems++;
      }
    } else if (authKey) {
      apiKey = authKey;
      keySource = path.join(codexHome, 'auth.json');
    }
    const projectCfg = path.join(process.cwd(), '.codex', 'config.toml');
    if ((await readTextIfExists(projectCfg)) !== null) {
      warn(m.doctorProjectOverride(projectCfg));
      problems++;
    }
  } else {
    const v = await runCapture('claude', ['--version']);
    v ? ok(m.doctorCli('claude', v.split('\n')[0])) : (warn(m.doctorCli('claude', null)), problems++);
    const claudeDir = claudeConfigDir();
    const settingsPath = path.join(claudeDir, 'settings.json');
    const settings = await readJsonIfExists(settingsPath);
    if (!settings) {
      bad(m.doctorConfigMissing(settingsPath));
      problems++;
    } else {
      const env = (settings.env && typeof settings.env === 'object' ? settings.env : {}) as Record<string, string>;
      baseUrl = env.ANTHROPIC_BASE_URL || '';
      apiKey = env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY || '';
      keySource = apiKey ? `${settingsPath} env` : '';
      ok(m.doctorConfig(settingsPath, `ANTHROPIC_BASE_URL=${baseUrl || '(default Anthropic)'} ANTHROPIC_MODEL=${env.ANTHROPIC_MODEL || '?'}`));
      if (!baseUrl.includes('chatapi') && !baseUrl.includes('xyc')) {
        warn(`ANTHROPIC_BASE_URL does not point to XycAi. ${m.doctorRunWizard}`);
        problems++;
      }
    }
    for (const n of ['ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY']) {
      const v2 = process.env[n]?.trim();
      if (v2) {
        if (apiKey && apiKey !== v2) {
          warn(m.doctorEnvOverride(n));
          problems++;
        }
        apiKey = v2;
        keySource = `env ${n}`;
        break;
      }
    }
    if (process.env.ANTHROPIC_BASE_URL?.trim() && process.env.ANTHROPIC_BASE_URL !== baseUrl) {
      warn(m.doctorEnvOverride('ANTHROPIC_BASE_URL'));
      baseUrl = process.env.ANTHROPIC_BASE_URL;
      problems++;
    }
    for (const f of scan.files) {
      if (f.file.endsWith('settings.local.json') || f.file.includes(`${path.sep}.claude${path.sep}settings`) && !f.file.startsWith(claudeDir)) {
        warn(m.doctorProjectOverride(`${f.file} (${f.reason})`));
        problems++;
      } else if (!f.removable) {
        warn(f.reason);
      }
    }
  }

  for (const h of scan.rc) {
    warn(m.scanRc(h.file, h.lineNo, h.line));
  }
  for (const n of scan.winEnv) {
    warn(m.scanWin(n));
  }

  if (!apiKey) {
    bad(m.doctorNoKey);
    problems++;
  } else {
    ok(m.doctorKeyFrom(keySource, maskSecret(apiKey)));
    head(m.verifyTitle);
    const base = baseUrl || ALT_ENDPOINTS[0];
    const r = await checkApi(base, apiKey);
    if (r.status === 'ok') ok(m.verifyOk(r.models, r.ms));
    else if (r.status === 'unauthorized') {
      bad(m.verifyUnauthorized);
      info(r.detail);
      problems++;
    } else if (r.status === 'http') {
      warn(m.verifyHttp(r.code, r.detail));
      problems++;
    } else {
      warn(m.verifyNetwork(r.detail));
      problems++;
      let found = false;
      for (const alt of ALT_ENDPOINTS) {
        if (base.startsWith(alt)) continue;
        const r2 = await checkApi(alt, apiKey);
        if (r2.status === 'ok' || r2.status === 'unauthorized') {
          ok(m.verifyAltOk(alt));
          found = true;
          break;
        }
      }
      if (!found) bad(m.verifyAltNone);
    }
  }

  console.log();
  console.log(problems ? kleur.yellow(m.doctorSummaryFix) : kleur.green(m.doctorSummaryOk));
  return problems === 0;
};
