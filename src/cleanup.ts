import { homedir } from 'os';
import path from 'path';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import { backupFile, readJsonIfExists, readTextIfExists, runCapture, maskSecret, tomlGet } from './util';

export type Target = 'codex' | 'claude';

/** 会被清理的冲突变量（覆盖配置文件里的 key / 地址 / 模型） */
export const ENV_VARS: Record<Target, string[]> = {
  codex: ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_API_BASE'],
  claude: ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_MODEL', 'ANTHROPIC_SMALL_FAST_MODEL']
};
/** 只提示不清理：改变配置目录位置的变量（写配置时按它来） */
export const DIR_VARS: Record<Target, string> = { codex: 'CODEX_HOME', claude: 'CLAUDE_CONFIG_DIR' };

export const codexHomeDir = () => (process.env.CODEX_HOME?.trim() ? process.env.CODEX_HOME.trim() : path.join(homedir(), '.codex'));
export const claudeConfigDir = () => (process.env.CLAUDE_CONFIG_DIR?.trim() ? process.env.CLAUDE_CONFIG_DIR.trim() : path.join(homedir(), '.claude'));

/** 常见 shell 启动文件（存在才扫） */
export const RC_FILES = [
  '.zshrc',
  '.zprofile',
  '.zshenv',
  '.bashrc',
  '.bash_profile',
  '.profile',
  path.join('.config', 'fish', 'config.fish')
].map((f) => path.join(homedir(), f));

export type EnvHit = { name: string; value: string; source: string };
export type RcHit = { file: string; lineNo: number; line: string; name: string };
export type FileHit = { file: string; reason: string; removable: boolean; keys?: string[] };

export type ScanResult = {
  env: EnvHit[]; // 当前进程继承到的冲突环境变量
  rc: RcHit[]; // shell rc 里写死的 export 行
  winEnv: string[]; // Windows 用户级持久环境变量
  files: FileHit[]; // 残留/冲突配置文件
};

// 只认「整行就是一条赋值」：export NAME=value / NAME=value / set -gx NAME value / setenv NAME value，
// 值后面只能跟注释。像 `CODEX_HOME=x command codex "$@"` 这种函数内的前缀赋值不算，避免误伤。
const rcPattern = (names: string[]) =>
  new RegExp(
    `^\\s*(?:export\\s+|set\\s+-g?x\\s+|setenv\\s+)?(${names.join('|')})(?:\\s*=\\s*|\\s+)("[^"]*"|'[^']*'|\\S*)\\s*(?:#.*)?$`
  );

export const scanConflicts = async (target: Target): Promise<ScanResult> => {
  const names = ENV_VARS[target];
  const result: ScanResult = { env: [], rc: [], winEnv: [], files: [] };

  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) result.env.push({ name: n, value: n.includes('KEY') || n.includes('TOKEN') ? maskSecret(v) : v, source: 'shell' });
  }
  const dirVar = DIR_VARS[target];
  if (process.env[dirVar]?.trim()) result.env.push({ name: dirVar, value: process.env[dirVar]!.trim(), source: 'dir' });

  const re = rcPattern(names);
  for (const file of RC_FILES) {
    const text = await readTextIfExists(file);
    if (text === null) continue;
    text.split(/\r?\n/).forEach((line, i) => {
      const m = line.match(re);
      if (m) result.rc.push({ file, lineNo: i + 1, line: line.trim(), name: m[1] });
    });
  }

  if (process.platform === 'win32') {
    for (const n of names) {
      const out = await runCapture('reg', ['query', 'HKCU\\Environment', '/v', n], 8000);
      if (out && out.includes(n)) result.winEnv.push(n);
    }
  }

  const home = homedir();
  const cwd = process.cwd();
  void home;
  if (target === 'codex') {
    const codexHome = codexHomeDir();
    const cfg = path.join(codexHome, 'config.toml');
    const cfgText = await readTextIfExists(cfg);
    if (cfgText !== null) {
      const provider = tomlGet(cfgText, null, 'model_provider') || 'openai';
      const envKey = tomlGet(cfgText, `model_providers.${provider}`, 'env_key');
      const base = tomlGet(cfgText, `model_providers.${provider}`, 'base_url');
      result.files.push({
        file: cfg,
        reason: `model_provider=${provider}${base ? ` base_url=${base}` : ''}${envKey ? ` env_key=${envKey}` : ''}`,
        removable: true
      });
    }
    const auth = path.join(codexHome, 'auth.json');
    if (existsSync(auth)) result.files.push({ file: auth, reason: 'auth.json', removable: true });
    const projectCfg = path.join(cwd, '.codex', 'config.toml');
    if (projectCfg !== cfg && existsSync(projectCfg)) {
      result.files.push({ file: projectCfg, reason: 'project-level config overrides ~/.codex', removable: true });
    }
  } else {
    const claudeDir = claudeConfigDir();
    const candidates = [
      path.join(claudeDir, 'settings.json'),
      path.join(claudeDir, 'settings.local.json'),
      path.join(cwd, '.claude', 'settings.json'),
      path.join(cwd, '.claude', 'settings.local.json')
    ];
    for (const f of candidates) {
      const j = await readJsonIfExists(f);
      if (!j) continue;
      const env = (j.env && typeof j.env === 'object' ? (j.env as Record<string, unknown>) : {}) as Record<string, unknown>;
      const keys = Object.keys(env).filter((k) => names.includes(k) || k.startsWith('ANTHROPIC_'));
      const helper = typeof j.apiKeyHelper === 'string' ? ['apiKeyHelper'] : [];
      if (f === candidates[0]) {
        result.files.push({ file: f, reason: keys.length ? `env: ${keys.join(', ')}` : 'settings.json', removable: true, keys });
      } else if (keys.length || helper.length) {
        result.files.push({ file: f, reason: `env: ${[...keys, ...helper].join(', ')} (overrides settings.json)`, removable: true, keys: [...keys, ...helper] });
      }
    }
    const claudeJson = path.join(home, '.claude.json');
    const cj = await readJsonIfExists(claudeJson);
    if (cj && cj.oauthAccount) {
      result.files.push({ file: claudeJson, reason: 'logged in with an Anthropic account (oauthAccount); run `claude /logout` if requests ignore the API key', removable: false });
    }
  }
  return result;
};

export type CleanReport = { rcEdited: string[]; winRemoved: string[]; filesRemoved: string[]; filesEdited: string[] };

/** 执行清理：rc 行注释掉（先备份）、Windows 用户变量删除、残留文件备份后删除、settings.local.json 去掉冲突键 */
export const applyCleanup = async (target: Target, scan: ScanResult, opts: { removeFiles: boolean }): Promise<CleanReport> => {
  const report: CleanReport = { rcEdited: [], winRemoved: [], filesRemoved: [], filesEdited: [] };
  const names = ENV_VARS[target];
  const re = rcPattern(names);

  const byFile = new Map<string, RcHit[]>();
  for (const h of scan.rc) byFile.set(h.file, [...(byFile.get(h.file) || []), h]);
  for (const [file] of byFile) {
    const text = await readTextIfExists(file);
    if (text === null) continue;
    const lines = text.split(/\r?\n/);
    let changed = false;
    const out = lines.map((line) => {
      if (re.test(line)) {
        changed = true;
        return `# [xycai cleanup ${new Date().toISOString().slice(0, 10)}] ${line}`;
      }
      return line;
    });
    if (changed) {
      await backupFile(file);
      await fs.writeFile(file, out.join('\n'), 'utf8');
      report.rcEdited.push(file);
    }
  }

  if (process.platform === 'win32') {
    for (const n of scan.winEnv) {
      const out = await runCapture('reg', ['delete', 'HKCU\\Environment', '/v', n, '/f'], 8000);
      if (out !== null) report.winRemoved.push(n);
    }
  }

  for (const f of scan.files) {
    if (!f.removable) continue;
    const isSettingsLocalLike = target === 'claude' && f.keys && f.keys.length && !f.file.endsWith(`${path.sep}settings.json`);
    if (isSettingsLocalLike) {
      const j = await readJsonIfExists(f.file);
      if (!j) continue;
      const env = (j.env && typeof j.env === 'object' ? (j.env as Record<string, unknown>) : {}) as Record<string, unknown>;
      for (const k of f.keys!) {
        if (k === 'apiKeyHelper') delete j.apiKeyHelper;
        else delete env[k];
      }
      if (Object.keys(env).length) j.env = env;
      else delete j.env;
      await backupFile(f.file);
      await fs.writeFile(f.file, JSON.stringify(j, null, 2) + '\n', 'utf8');
      report.filesEdited.push(f.file);
      continue;
    }
    if (!opts.removeFiles) continue;
    if (existsSync(f.file)) {
      await backupFile(f.file);
      await fs.rm(f.file, { force: true });
      report.filesRemoved.push(f.file);
    }
  }
  return report;
};
