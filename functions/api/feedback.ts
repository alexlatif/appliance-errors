/**
 * Cloudflare Pages Function — /api/feedback
 * POST {id, vote: "yes"|"no"} → increments KV counter
 * GET  ?id=samsung-washer-4c  → {yes, no}
 * Requires KV binding FEEDBACK (set in wrangler.toml / Pages dashboard).
 */
interface Env {
  FEEDBACK?: KVNamespace;
}

const ID_RE = /^[a-z0-9-]{3,80}$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.FEEDBACK) return json({ error: 'feedback store not configured' }, 503);
  let body: { id?: string; vote?: string };
  try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
  const { id, vote } = body;
  if (!id || !ID_RE.test(id) || (vote !== 'yes' && vote !== 'no')) {
    return json({ error: 'invalid payload' }, 400);
  }
  const key = `${id}:${vote}`;
  const current = parseInt((await env.FEEDBACK.get(key)) ?? '0', 10);
  await env.FEEDBACK.put(key, String(current + 1));
  return json({ ok: true });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.FEEDBACK) return json({ error: 'feedback store not configured' }, 503);
  const url = new URL(request.url);

  // Bulk export: GET /api/feedback?all=1 → { stats: { id: {yes,no} } }.
  // Consumed by scripts/fetch-feedback.mjs at build time so aggregated
  // success rates get baked into the static HTML (crawlable first-party data).
  if (url.searchParams.get('all') === '1') {
    const stats: Record<string, { yes: number; no: number }> = {};
    let cursor: string | undefined;
    do {
      const list = await env.FEEDBACK.list({ limit: 1000, cursor });
      const pairs = await Promise.all(
        list.keys.map(async (k) => [k.name, parseInt((await env.FEEDBACK!.get(k.name)) ?? '0', 10)] as const),
      );
      for (const [key, count] of pairs) {
        const sep = key.lastIndexOf(':');
        if (sep < 0) continue;
        const id = key.slice(0, sep);
        const vote = key.slice(sep + 1);
        if (vote !== 'yes' && vote !== 'no') continue;
        (stats[id] ??= { yes: 0, no: 0 })[vote] = count;
      }
      cursor = list.list_complete ? undefined : list.cursor;
    } while (cursor);
    return json({ stats }, 200, 'public, max-age=600');
  }

  const id = url.searchParams.get('id') ?? '';
  if (!ID_RE.test(id)) return json({ error: 'invalid id' }, 400);
  const [yes, no] = await Promise.all([
    env.FEEDBACK.get(`${id}:yes`),
    env.FEEDBACK.get(`${id}:no`),
  ]);
  return json({ yes: parseInt(yes ?? '0', 10), no: parseInt(no ?? '0', 10) });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
