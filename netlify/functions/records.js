// Netlify Function — CRUD proxy to the Airtable "Deliverables" table.
// The PAT lives server-side only; the browser never sees it.
//
// Routes (via netlify.toml: /api/records -> here), method-routed:
//   GET    /api/records            list all records
//   POST   /api/records            create   body: { fields }
//   PATCH  /api/records?id=recXXX  update   body: { fields }
//   DELETE /api/records?id=recXXX  delete
const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_NAME || 'Deliverables';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Thin wrapper over the Airtable REST API. Throws on non-2xx with the AT message.
async function airtable(path = '', options = {}) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAT}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || res.statusText;
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return data;
}

// Flatten { id, fields:{...} } -> { id, ...fields } for the frontend.
const flat = (r) => ({ id: r.id, ...r.fields });

exports.handler = async (event) => {
  if (!PAT || !BASE) {
    return json(500, { error: 'Missing AIRTABLE_PAT or AIRTABLE_BASE_ID. Set them in .env / Netlify env.' });
  }
  const id = event.queryStringParameters?.id;
  try {
    switch (event.httpMethod) {
      case 'GET': {
        // pageSize 100 is plenty for a demo board; pagination omitted on purpose.
        const data = await airtable('?pageSize=100');
        return json(200, { records: (data.records || []).map(flat) });
      }
      case 'POST': {
        const { fields } = JSON.parse(event.body || '{}');
        if (!fields || !fields.Title) return json(400, { error: 'Title is required.' });
        // typecast lets new single-select option strings be created on the fly.
        const data = await airtable('', { method: 'POST', body: JSON.stringify({ fields, typecast: true }) });
        return json(201, flat(data));
      }
      case 'PATCH': {
        if (!id) return json(400, { error: 'Missing record id.' });
        const { fields } = JSON.parse(event.body || '{}');
        const data = await airtable(`/${id}`, { method: 'PATCH', body: JSON.stringify({ fields, typecast: true }) });
        return json(200, flat(data));
      }
      case 'DELETE': {
        if (!id) return json(400, { error: 'Missing record id.' });
        await airtable(`/${id}`, { method: 'DELETE' });
        return json(200, { id, deleted: true });
      }
      default:
        return json(405, { error: `Method ${event.httpMethod} not allowed.` });
    }
  } catch (err) {
    return json(err.status || 500, { error: err.message });
  }
};
