// Airtable webhook receiver -> Telegram alert when a Deliverable hits Blocked / QC Fail.
//
// Flow: Airtable POSTs a tiny "ping" (no data) whenever the Status field changes.
// We pull the change payloads, re-read the affected record, and if it's now flagged
// we send a Telegram message. The payload cursor is persisted in Netlify Blobs so the
// same change is never alerted twice. This is the code/API counterpart to the native
// Airtable automation — same outcome, zero manual setup.
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_NAME || 'Deliverables';
const TABLE_ID = process.env.AIRTABLE_TABLE_ID;
const STATUS_FID = process.env.AIRTABLE_STATUS_FIELD_ID;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
const FLAGGED = ['Blocked', 'QC Fail'];

async function telegram(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
}

async function fetchRecord(id) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}/${id}`, {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!r.ok) return null;
  return (await r.json()).fields || null;
}

exports.handler = async (event) => {
  let webhookId;
  try { webhookId = JSON.parse(event.body || '{}').webhook?.id; } catch { /* ignore */ }
  if (!webhookId) return { statusCode: 200, body: 'ignored' };

  // Resume from the last processed cursor (Blobs); default 1 if unavailable.
  let store;
  let cursor = 1;
  try {
    const { getStore } = await import('@netlify/blobs');
    store = getStore('airtable-webhook');
    cursor = Number(await store.get(`cur-${webhookId}`)) || 1;
  } catch { /* no blobs in this context — start from 1 */ }

  const alerts = [];
  for (let page = 0; page < 20; page++) {
    const res = await fetch(
      `https://api.airtable.com/v0/bases/${BASE}/webhooks/${webhookId}/payloads?cursor=${cursor}`,
      { headers: { Authorization: `Bearer ${PAT}` } },
    );
    if (!res.ok) break;
    const data = await res.json();
    cursor = data.cursor;
    for (const p of (data.payloads || [])) {
      const changed = p.changedTablesById?.[TABLE_ID]?.changedRecordsById || {};
      for (const [recId, ch] of Object.entries(changed)) {
        const touchedStatus = ch.current?.cellValuesByFieldId && STATUS_FID in ch.current.cellValuesByFieldId;
        if (!touchedStatus) continue;
        const f = await fetchRecord(recId);
        if (f && FLAGGED.includes(f.Status)) {
          alerts.push(
            `⚠️ <b>${f.Status}</b> — ${f.Title || recId}\n` +
            `${[f.Show, f.Episode].filter(Boolean).join(' · ')}\n` +
            `Stage: ${f.Stage || '—'} · Owner: ${f.Assignee || '—'}` +
            (f.Facility ? ` · ${f.Facility}` : '') + '\n' +
            (f.Notes ? `📝 ${f.Notes}\n` : '') +
            `https://airtable.com/${BASE}/${TABLE_ID}/${recId}`,
          );
        }
      }
    }
    if (!data.mightHaveMore) break;
  }

  for (const a of alerts) await telegram(a);
  if (store) { try { await store.set(`cur-${webhookId}`, String(cursor)); } catch { /* ignore */ } }

  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, alerts: alerts.length }) };
};
