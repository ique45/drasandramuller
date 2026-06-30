export async function onRequestGet(context) {
  const { request, env } = context;
  const url  = new URL(request.url);
  const key  = url.searchParams.get('key') || '';
  const days = Math.min(parseInt(url.searchParams.get('days') || '30', 10), 365);

  if (!env.DASH_KEY || key !== env.DASH_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const todaySince = Math.floor(Date.now() / 1000) - 86400;

  try {
    const [total, period, today, byDay, bySource, byCampaign, byButton, recent] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as n FROM wa_clicks WHERE is_bot = 0').first(),
      env.DB.prepare('SELECT COUNT(*) as n FROM wa_clicks WHERE is_bot = 0 AND timestamp >= ?').bind(since).first(),
      env.DB.prepare('SELECT COUNT(*) as n FROM wa_clicks WHERE is_bot = 0 AND timestamp >= ?').bind(todaySince).first(),
      env.DB.prepare(`
        SELECT strftime('%Y-%m-%d', timestamp, 'unixepoch') as day, COUNT(*) as clicks
        FROM wa_clicks WHERE is_bot = 0 AND timestamp >= ?
        GROUP BY day ORDER BY day
      `).bind(since).all(),
      env.DB.prepare(`
        SELECT COALESCE(NULLIF(utm_source, ''), '(direto)') as source, COUNT(*) as clicks
        FROM wa_clicks WHERE is_bot = 0 AND timestamp >= ?
        GROUP BY source ORDER BY clicks DESC LIMIT 10
      `).bind(since).all(),
      env.DB.prepare(`
        SELECT COALESCE(NULLIF(utm_campaign, ''), '(sem campanha)') as campaign, COUNT(*) as clicks
        FROM wa_clicks WHERE is_bot = 0 AND timestamp >= ?
        GROUP BY campaign ORDER BY clicks DESC LIMIT 10
      `).bind(since).all(),
      env.DB.prepare(`
        SELECT src as button, COUNT(*) as clicks
        FROM wa_clicks WHERE is_bot = 0 AND timestamp >= ?
        GROUP BY button ORDER BY clicks DESC
      `).bind(since).all(),
      env.DB.prepare(`
        SELECT id, timestamp, src, utm_source, utm_medium, utm_campaign, browser, os, is_mobile
        FROM wa_clicks WHERE is_bot = 0
        ORDER BY timestamp DESC LIMIT 100
      `).all(),
    ]);

    return json({
      total:      total?.n      ?? 0,
      period:     period?.n     ?? 0,
      today:      today?.n      ?? 0,
      byDay:      byDay.results,
      bySource:   bySource.results,
      byCampaign: byCampaign.results,
      byButton:   byButton.results,
      recent:     recent.results,
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
