export default {
  async fetch(request, env, ctx): Promise<Response> {
    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.method !== "GET") {
      return new Response(null, { status: 405 });
    }

    const url = new URL(request.url);

    const key = decodeURIComponent(url.pathname)
      .replace(/^\/+/, "")
      .toLowerCase();

    if (!key) {
      return new Response(null, { status: 404 });
    }

    const destination = await env.REDIRECTS.get(key);
    if (!destination) {
      return new Response(null, { status: 404 });
    }

    const response = new Response(null, {
      status: 302,
      headers: {
        Location: destination,
        "Cache-Control": "public, max-age=86400", // 24h
      },
    });

    ctx.waitUntil(cache.put(url, response.clone()));
    return response;
  },
} satisfies ExportedHandler<Env>;
