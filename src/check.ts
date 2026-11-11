import { fetchWithTimeout } from './util';

export type ApiCheck =
  | { status: 'ok'; models: number; ms: number }
  | { status: 'unauthorized'; ms: number; detail: string }
  | { status: 'http'; code: number; ms: number; detail: string }
  | { status: 'network'; detail: string };

/** 用客户本机配置真实打一笔 GET {base}/v1/models，判断「key 对不对」与「网络通不通」 */
export const checkApi = async (baseUrl: string, apiKey: string): Promise<ApiCheck> => {
  const root = baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
  const url = `${root}/v1/models`;
  const t0 = Date.now();
  try {
    const res = await fetchWithTimeout(
      url,
      { headers: { Authorization: `Bearer ${apiKey}`, 'x-api-key': apiKey, accept: 'application/json' } },
      15000
    );
    const ms = Date.now() - t0;
    const text = await res.text();
    if (res.status === 200) {
      let models = 0;
      try {
        const j = JSON.parse(text) as { data?: unknown[] };
        models = Array.isArray(j.data) ? j.data.length : 0;
      } catch {
        /* ignore */
      }
      return { status: 'ok', models, ms };
    }
    const detail = text.replace(/\s+/g, ' ').slice(0, 160);
    if (res.status === 401 || res.status === 403) return { status: 'unauthorized', ms, detail };
    return { status: 'http', code: res.status, ms, detail };
  } catch (e) {
    const err = e as Error;
    return { status: 'network', detail: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err) };
  }
};

/** 备用端点，网络不通时逐个试 */
export const ALT_ENDPOINTS = [
  'https://cn.chatapi.app',
  'https://apicdn.xycai.us',
  'https://jp.chatapi.app',
  'https://apicdn.xyc.ai'
];
