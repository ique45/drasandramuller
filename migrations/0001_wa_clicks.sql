CREATE TABLE IF NOT EXISTS sessions (
  session_id   TEXT    PRIMARY KEY,
  created_at   INTEGER NOT NULL,
  utm_source   TEXT    DEFAULT '',
  utm_medium   TEXT    DEFAULT '',
  utm_campaign TEXT    DEFAULT '',
  utm_content  TEXT    DEFAULT '',
  utm_term     TEXT    DEFAULT '',
  referrer     TEXT    DEFAULT '',
  landing_page TEXT    DEFAULT ''
);

CREATE TABLE IF NOT EXISTS wa_clicks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT,
  timestamp    INTEGER NOT NULL,
  src          TEXT    DEFAULT '',
  utm_source   TEXT    DEFAULT '',
  utm_medium   TEXT    DEFAULT '',
  utm_campaign TEXT    DEFAULT '',
  utm_content  TEXT    DEFAULT '',
  utm_term     TEXT    DEFAULT '',
  referrer     TEXT    DEFAULT '',
  browser      TEXT    DEFAULT '',
  os           TEXT    DEFAULT '',
  is_mobile    INTEGER DEFAULT 0,
  is_bot       INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wa_clicks_timestamp ON wa_clicks(timestamp);
CREATE INDEX IF NOT EXISTS idx_wa_clicks_session   ON wa_clicks(session_id);
