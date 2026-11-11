import { spawn } from 'child_process';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import kleur from 'kleur';

export const formatTimestamp = (): string => {
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

export const ensureDir = async (filePath: string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

/** 备份到同目录 <file>.<ts>.bak；文件不存在返回 null */
export const backupFile = async (filePath: string): Promise<string | null> => {
  if (!existsSync(filePath)) return null;
  const backupPath = `${filePath}.${formatTimestamp()}.bak`;
  await fs.copyFile(filePath, backupPath);
  return backupPath;
};

export const writeFileSafely = async (filePath: string, content: string) => {
  await ensureDir(filePath);
  await fs.writeFile(filePath, content, 'utf8');
};

export const readTextIfExists = async (filePath: string): Promise<string | null> => {
  if (!existsSync(filePath)) return null;
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
};

export const readJsonIfExists = async (filePath: string): Promise<Record<string, unknown> | null> => {
  const raw = await readTextIfExists(filePath);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

/** 密钥脱敏：前 7 位 + … + 后 4 位 */
export const maskSecret = (value: string): string => {
  const v = value.trim();
  if (v.length <= 12) return v.length ? `${v.slice(0, 3)}…` : '';
  return `${v.slice(0, 7)}…${v.slice(-4)}`;
};

/** 运行命令并收集 stdout（失败返回 null），用于 `codex --version` 之类探测 */
export const runCapture = (command: string, args: string[], timeoutMs = 15000): Promise<string | null> =>
  new Promise((resolve) => {
    let out = '';
    let done = false;
    const finish = (v: string | null) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    try {
      const child = spawn(command, args, { shell: process.platform === 'win32' });
      const timer = setTimeout(() => {
        child.kill();
        finish(null);
      }, timeoutMs);
      child.stdout.on('data', (d) => (out += d.toString()));
      child.stderr.on('data', (d) => (out += d.toString()));
      child.on('error', () => {
        clearTimeout(timer);
        finish(null);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        finish(code === 0 ? out.trim() : null);
      });
    } catch {
      finish(null);
    }
  });

/** 带继承 stdio 的命令（npm install 等） */
export const runInherit = (command: string, args: string[]): Promise<boolean> =>
  new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });

/** 简单 TOML 取值：顶层 / [table] 内的 key = "value" | key = value */
export const tomlGet = (toml: string, table: string | null, key: string): string | null => {
  let cur: string | null = null;
  for (const rawLine of toml.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const t = line.match(/^\[([^\]]+)\]$/);
    if (t) {
      cur = t[1].trim();
      continue;
    }
    if (cur !== table) continue;
    const kv = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (kv && kv[1] === key) {
      let v = kv[2].trim();
      const hash = v.indexOf(' #');
      if (hash > 0 && !v.startsWith('"')) v = v.slice(0, hash).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      return v;
    }
  }
  return null;
};

export const ok = (s: string) => console.log(kleur.green(`  ✓ ${s}`));
export const warn = (s: string) => console.log(kleur.yellow(`  ! ${s}`));
export const bad = (s: string) => console.log(kleur.red(`  ✗ ${s}`));
export const info = (s: string) => console.log(kleur.gray(`    ${s}`));
export const head = (s: string) => {
  console.log();
  console.log(kleur.bold().cyan(s));
};

/** 带超时的 fetch（Node 18+ 自带 fetch） */
export const fetchWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
};
