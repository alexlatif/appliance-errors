export async function GET() {
  // AI/LLM crawlers — explicitly welcome them so we appear in AI Overviews,
  // Perplexity, ChatGPT, and Claude citations. Default is to allow, but being
  // explicit matters as these bots check user-agent rules before crawling.
  // Common bots as of 2026: GPTBot (OpenAI), anthropic-ai / Claude-Web (Anthropic),
  // PerplexityBot, meta-externalagent (Meta AI), Omgilibot (Webz), cohere-ai.
  const body = `User-agent: *
Allow: /

# AI assistants — explicitly welcome for AI Overview / Perplexity / ChatGPT citations
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Omgilibot
Allow: /

# IndexNow key — at root for Bing/Yandex/Seznam/DuckDuckGo real-time indexing
# Key file lives at /ae4f9b2c7d1e3a6f8b0c5d7e9f2a4b6c.txt
User-agent: bingbot
Allow: /

Sitemap: https://applianceerrors.com/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
