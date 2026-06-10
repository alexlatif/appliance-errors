export async function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: https://applianceerrors.com/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
