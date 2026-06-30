# Post Pipeline

A Post-Production Workflow Tracker for TV+ deliverables — a clean Kanban backed by **Airtable**, served on **Netlify** with a serverless function for live read/write. Built as a hands-on Airtable + Product-Owner portfolio piece.

**Stack:** Vanilla JS / HTML / CSS · Netlify Functions · Airtable REST API. No build step, no framework.

![stages](https://img.shields.io/badge/stages-Editorial→VFX→Color→Mix→QC→Delivery-1a5e63)

## How it works
```
Browser (public/)  ──fetch /api/records──►  Netlify Function (records.js)  ──Bearer PAT──►  Airtable base
```
The Airtable personal access token lives only in the function's environment — the browser never sees it.

## Run locally
1. Create the Airtable base — follow **[docs/AIRTABLE-BASE.md](docs/AIRTABLE-BASE.md)**.
2. `cp .env.example .env` and fill in `AIRTABLE_PAT` and `AIRTABLE_BASE_ID`.
3. `npm install -g netlify-cli` (once), then `netlify dev`.
4. Open the printed local URL. The board loads from your base.

## Deploy
```
netlify sites:create --name post-pipeline   # or via dashboard
netlify deploy --prod --dir=public
```
Then set `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` in **Site settings → Environment variables**.

## Docs
- [docs/AIRTABLE-BASE.md](docs/AIRTABLE-BASE.md) — base schema + how to talk to the Airtable API.
- [docs/AIRTABLE-EXTENSIONS.md](docs/AIRTABLE-EXTENSIONS.md) — click-by-click runbooks for an **Automation**, a cross-base **Sync**, and an **Interface** page (the JD's checklist).
- [docs/POST-PRODUCTION-101.md](docs/POST-PRODUCTION-101.md) — domain crib sheet so you can talk post fluently.
- [docs/INTERVIEW-MAP.md](docs/INTERVIEW-MAP.md) — how each feature maps to the job description + a 60-sec demo script.
- [REQUIREMENTS.md](REQUIREMENTS.md) — PO-style user stories, acceptance criteria, UAT checklist.
