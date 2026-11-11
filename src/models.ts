import { fetchWithTimeout } from './util';

export type ModelChoice = { value: string; title: string; description?: string };

/** 线上定价接口（公开）：按分组筛出当前在售的 GPT / Claude 型号，接口不可达时回退静态表 */
const PRICING_URL = 'https://www.xyc.ai/api/pricing';

type PricingModel = {
  model_name: string;
  vendor_id: number;
  enable_groups?: string[];
  sort_order?: number;
  description?: string;
};

const FALLBACK_CODEX: ModelChoice[] = [
  { value: 'gpt-6.1-sol', title: 'gpt-6.1-sol' },
  { value: 'gpt-6-astra', title: 'gpt-6-astra' },
  { value: 'gpt-6-sol', title: 'gpt-6-sol' },
  { value: 'gpt-6.1-terra', title: 'gpt-6.1-terra' },
  { value: 'gpt-6-luna', title: 'gpt-6-luna' },
  { value: 'gpt-5.6-sol', title: 'gpt-5.6-sol' },
  { value: 'gpt-5.6-terra', title: 'gpt-5.6-terra' },
  { value: 'gpt-5.5', title: 'gpt-5.5' }
];

const FALLBACK_CLAUDE: ModelChoice[] = [
  { value: 'claude-opus-5-5', title: 'claude-opus-5-5' },
  { value: 'claude-fable-5-2', title: 'claude-fable-5-2' },
  { value: 'claude-fable-5-1', title: 'claude-fable-5-1' },
  { value: 'claude-sonnet-5-5', title: 'claude-sonnet-5-5' },
  { value: 'claude-opus-5', title: 'claude-opus-5' },
  { value: 'claude-sonnet-5', title: 'claude-sonnet-5' },
  { value: 'claude-haiku-5-5', title: 'claude-haiku-5-5' }
];

export const DEFAULT_CODEX_MODEL = FALLBACK_CODEX[0].value;
export const DEFAULT_CLAUDE_MODEL = FALLBACK_CLAUDE[0].value;
export const CLAUDE_SMALL_FAST_MODEL = 'claude-haiku-5-5';

let cache: { codex: ModelChoice[]; claude: ModelChoice[] } | null = null;

const shortDesc = (d?: string) => {
  if (!d) return undefined;
  const s = d.replace(/\s+/g, ' ').trim();
  return s.length > 48 ? `${s.slice(0, 48)}…` : s;
};

export const loadModelChoices = async (): Promise<{ codex: ModelChoice[]; claude: ModelChoice[]; live: boolean }> => {
  if (cache) return { ...cache, live: true };
  try {
    const res = await fetchWithTimeout(PRICING_URL, { headers: { accept: 'application/json' } }, 8000);
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as { data?: PricingModel[] };
    const data = Array.isArray(body.data) ? body.data : [];
    const pick = (prefix: string, groups: string[]) =>
      data
        .filter(
          (m) =>
            typeof m.model_name === 'string' &&
            m.model_name.startsWith(prefix) &&
            Array.isArray(m.enable_groups) &&
            m.enable_groups.some((g) => groups.includes(g))
        )
        .sort((a, b) => (a.sort_order ?? 10) - (b.sort_order ?? 10) || a.model_name.localeCompare(b.model_name))
        .map<ModelChoice>((m) => ({ value: m.model_name, title: m.model_name, description: shortDesc(m.description) }));
    // Codex 只要新一代推理模型（gpt-5.x / gpt-6.x），过滤掉 nano / mini / 历史 4.x
    const codex = pick('gpt-', ['gpt-ent', 'gpt-eco']).filter(
      (m) => /^gpt-(5\.[4-9]|6)/.test(m.value) && !/(nano|mini|chat|image|realtime|audio|search)/.test(m.value)
    );
    const claude = pick('claude-', ['claude-ent', 'claude-eco']).filter(
      (m) => /^claude-(fable|opus|sonnet|haiku)-[45]/.test(m.value) && !/\d{8}$/.test(m.value)
    );
    if (codex.length >= 3 && claude.length >= 3) {
      cache = { codex, claude };
      return { codex, claude, live: true };
    }
  } catch {
    // 回退静态表
  }
  return { codex: FALLBACK_CODEX, claude: FALLBACK_CLAUDE, live: false };
};
