// Post Pipeline — frontend. Talks to /api/records (Netlify Function -> Airtable).
// Single-select option sets must match the Airtable field options (see docs/AIRTABLE-BASE.md).
const STAGES = ['Editorial', 'VFX', 'Color', 'Mix', 'QC', 'Delivery'];
const STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const STAGE_COLORS = {
  Editorial: '#8a5cf6', VFX: '#1a5e63', Color: '#c98a1b',
  Mix: '#2b6fb3', QC: '#b3452b', Delivery: '#1c6b3f',
};

const $ = (sel) => document.querySelector(sel);
const board = $('#board');
const banner = $('#banner');
const dialog = $('#dialog');

let records = [];

// --- API helpers -----------------------------------------------------------
async function api(method, body, id) {
  const url = id ? `/api/records?id=${encodeURIComponent(id)}` : '/api/records';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${method} failed (${res.status})`);
  return data;
}

function showError(msg) {
  banner.textContent = msg;
  banner.hidden = false;
}
function clearError() { banner.hidden = true; }

// --- Rendering -------------------------------------------------------------
function fmtDue(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function optionList(values, selected) {
  return values.map((v) => `<option value="${v}"${v === selected ? ' selected' : ''}>${v}</option>`).join('');
}

function cardEl(r) {
  const el = document.createElement('div');
  el.className = 'card';
  const statusClass = `status-${(r.Status || '').replace(/\s+/g, '-')}`;
  const badges = [
    r.Status ? `<span class="badge ${statusClass}">${r.Status}</span>` : '',
    r.Priority ? `<span class="badge prio-${r.Priority}">${r.Priority}</span>` : '',
  ].join('');
  const meta = [r.Due ? `📅 ${fmtDue(r.Due)}` : '', r.Assignee ? `👤 ${r.Assignee}` : '']
    .filter(Boolean).join(' ');
  el.innerHTML = `
    <h3></h3>
    ${r.Show ? '<p class="show"></p>' : ''}
    <div class="badges">${badges}</div>
    ${meta ? `<div class="meta">${meta}</div>` : ''}
    <div class="card-controls">
      <select class="sel-stage" title="Stage">${optionList(STAGES, r.Stage)}</select>
      <select class="sel-status" title="Status">${optionList(STATUSES, r.Status)}</select>
      <button class="icon-btn del" title="Delete">✕</button>
    </div>`;
  // textContent (not innerHTML) for user data — avoids HTML injection.
  el.querySelector('h3').textContent = r.Title || '(untitled)';
  if (r.Show) el.querySelector('.show').textContent = r.Show;

  el.querySelector('.sel-stage').onchange = (e) => update(r.id, { Stage: e.target.value });
  el.querySelector('.sel-status').onchange = (e) => update(r.id, { Status: e.target.value });
  el.querySelector('.del').onclick = () => remove(r.id, r.Title);
  el.querySelector('h3').onclick = () => openForm(r);
  el.querySelector('h3').style.cursor = 'pointer';
  return el;
}

function render() {
  board.innerHTML = '';
  for (const stage of STAGES) {
    const items = records.filter((r) => (r.Stage || 'Editorial') === stage);
    const col = document.createElement('div');
    col.className = 'column';
    col.style.setProperty('--col', STAGE_COLORS[stage]);
    col.innerHTML = `<div class="col-head"><span>${stage}</span><span class="count">${items.length}</span></div>`;
    if (!items.length) {
      const e = document.createElement('div');
      e.className = 'empty';
      e.textContent = 'Nothing here yet';
      col.appendChild(e);
    }
    items.forEach((r) => col.appendChild(cardEl(r)));
    board.appendChild(col);
  }
}

// --- Mutations -------------------------------------------------------------
async function load() {
  try {
    clearError();
    const { records: recs } = await api('GET');
    records = recs;
    render();
  } catch (err) {
    showError(`Could not load records: ${err.message}`);
  }
}

async function update(id, fields) {
  try {
    const updated = await api('PATCH', { fields }, id);
    records = records.map((r) => (r.id === id ? updated : r));
    render();
  } catch (err) {
    showError(err.message);
  }
}

async function remove(id, title) {
  if (!confirm(`Delete "${title || 'this deliverable'}"?`)) return;
  try {
    await api('DELETE', null, id);
    records = records.filter((r) => r.id !== id);
    render();
  } catch (err) {
    showError(err.message);
  }
}

// --- Form ------------------------------------------------------------------
function fillSelect(id, values) {
  $(id).innerHTML = optionList(values);
}
fillSelect('#f-Stage', STAGES);
fillSelect('#f-Status', STATUSES);
fillSelect('#f-Priority', PRIORITIES);

function openForm(r) {
  $('#formTitle').textContent = r ? 'Edit Deliverable' : 'New Deliverable';
  $('#recId').value = r?.id || '';
  $('#f-Title').value = r?.Title || '';
  $('#f-Show').value = r?.Show || '';
  $('#f-Stage').value = r?.Stage || 'Editorial';
  $('#f-Status').value = r?.Status || 'Not Started';
  $('#f-Priority').value = r?.Priority || 'Medium';
  $('#f-Due').value = r?.Due || '';
  $('#f-Assignee').value = r?.Assignee || '';
  $('#f-Notes').value = r?.Notes || '';
  dialog.showModal();
}

$('#newBtn').onclick = () => openForm(null);
$('#cancelBtn').onclick = () => dialog.close();

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#recId').value;
  const fields = {
    Title: $('#f-Title').value.trim(),
    Show: $('#f-Show').value.trim(),
    Stage: $('#f-Stage').value,
    Status: $('#f-Status').value,
    Priority: $('#f-Priority').value,
    Due: $('#f-Due').value || null,
    Assignee: $('#f-Assignee').value.trim(),
    Notes: $('#f-Notes').value.trim(),
  };
  try {
    if (id) {
      const updated = await api('PATCH', { fields }, id);
      records = records.map((r) => (r.id === id ? updated : r));
    } else {
      const created = await api('POST', { fields });
      records.push(created);
    }
    dialog.close();
    render();
  } catch (err) {
    showError(err.message);
  }
});

load();
