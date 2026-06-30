export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Skip static assets
  if (/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname)) {
    return next();
  }

  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const sid = cookies['_sid'] || crypto.randomUUID();

  const utms = {
    utm_source:   url.searchParams.get('utm_source')   || '',
    utm_medium:   url.searchParams.get('utm_medium')   || '',
    utm_campaign: url.searchParams.get('utm_campaign') || '',
    utm_content:  url.searchParams.get('utm_content')  || '',
    utm_term:     url.searchParams.get('utm_term')     || '',
  };
  const referrer     = request.headers.get('Referer') || '';
  const landing_page = url.pathname;

  const response = await next();
  const res = new Response(response.body, response);

  const exp = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toUTCString();
  res.headers.append('Set-Cookie', `_sid=${sid}; Path=/; Expires=${exp}; SameSite=Lax`);

  if (env.DB) {
    context.waitUntil(
      env.DB.prepare(`
        INSERT OR IGNORE INTO sessions
          (session_id, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_page)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sid, Math.floor(Date.now() / 1000),
        utms.utm_source, utms.utm_medium, utms.utm_campaign,
        utms.utm_content, utms.utm_term, referrer, landing_page
      ).run().catch(e => console.error('session insert:', e.message))
    );
  }

  return res;
}

function parseCookies(h) {
  const c = {};
  h.split(';').forEach(s => {
    const [k, ...v] = s.trim().split('=');
    if (k) c[k.trim()] = v.join('=');
  });
  return c;
}
