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
  const id = new URL(request.url).searchParams.get('id') ?? '';
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
