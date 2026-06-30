const WA_URL = 'https://wa.me/5547991624544?text=Quero%20saber%20mais%20sobre%20o%20procedimento%20de%20rejuvenescimento%20da%20Doutora';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url  = new URL(request.url);
  const src  = url.searchParams.get('src') || 'unknown';
  const ua   = request.headers.get('User-Agent') || '';

  // Bots e crawlers: redireciona sem logar
  if (isBot(ua)) return Response.redirect(WA_URL, 302);

  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const sid     = cookies['_sid'] || '';
  const ts      = Math.floor(Date.now() / 1000);

  if (env.DB) {
    // Busca UTMs da sessão
    let session = {};
    if (sid) {
      try {
        session = await env.DB.prepare(
          'SELECT * FROM sessions WHERE session_id = ?'
        ).bind(sid).first() ?? {};
      } catch {}
    }

    const { browser, os, mobile } = parseBrowser(ua);

    context.waitUntil(
      env.DB.prepare(`
        INSERT INTO wa_clicks
          (session_id, timestamp, src, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, browser, os, is_mobile)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        sid, ts, src,
        session.utm_source   || '',
        session.utm_medium   || '',
        session.utm_campaign || '',
        session.utm_content  || '',
        session.utm_term     || '',
        session.referrer     || '',
        browser, os, mobile ? 1 : 0
      ).run().catch(e => console.error('wa_click insert:', e.message))
    );
  }

  return Response.redirect(WA_URL, 302);
}

function isBot(ua) {
  if (!ua || ua.length < 10) return true;
  return /bot|crawler|spider|scraper|headless|whatsapp|facebookexternalhit|python|curl|wget|axios/i.test(ua);
}

function parseCookies(h) {
  const c = {};
  h.split(';').forEach(s => {
    const [k, ...v] = s.trim().split('=');
    if (k) c[k.trim()] = v.join('=');
  });
  return c;
}

function parseBrowser(ua) {
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let browser = 'Outro', os = 'Outro';
  if (/Edg\//i.test(ua))                              browser = 'Edge';
  else if (/Chrome\//i.test(ua))                      browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua))                     browser = 'Firefox';
  if      (/Windows/i.test(ua))  os = 'Windows';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua))  os = 'Android';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  return { browser, os, mobile };
}
