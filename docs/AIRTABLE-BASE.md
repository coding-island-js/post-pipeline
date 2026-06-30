# Airtable base setup — "Post Pipeline"

Build this in the Airtable UI (~10 min). Doing it by hand *is* the interview-relevant practice.

## 1. Create the base
- New base → name it **Post Pipeline**.
- Workspace: any. Copy the **Base ID** from the URL (`airtable.com/appXXXXXXXXXXXXXX/...`) → it starts with `app`.
- Paste it into `.env` as `AIRTABLE_BASE_ID=` and into Netlify env vars later.

## 2. Table: `Deliverables`
Rename the default `Table 1` to **Deliverables**. Create these fields (exact names — the app maps to them):

| Field | Type | Options |
|---|---|---|
| **Title** | Single line text | primary field |
| **Show** | Single line text | |
| **Stage** | Single select | Editorial, VFX, Color, Mix, QC, Delivery |
| **Status** | Single select | Not Started, In Progress, Blocked, Done |
| **Priority** | Single select | Low, Medium, High |
| **Due** | Date | ISO/US format, no time |
| **Assignee** | Single line text | |
| **Notes** | Long text | |

> The function uses `typecast: true`, so select options auto-create if a value is new — but set them up so colors/order look right.

## 3. Seed a few rows
Add 4–5 rows across different stages so the board looks alive (e.g. "Ep 104 — Final Mix" / Midnight Harbor / Mix / In Progress / High).

## 4. PAT scopes
The personal access token must have: `data.records:read`, `data.records:write`, and access to **this base**. Check at airtable.com/create/tokens if calls 403.

---

## Stretch (great interview talking points — optional to actually build)
These mirror what the JD asked about. You can build or just be ready to *describe*:

- **Linked records / second table:** add a `Shows` table; change `Show` to a *Link to another record* field. Talk to how data connects across tables.
- **Interface (page):** Interfaces tab → build a "Producer View" with a Kanban grouped by Stage and a filtered "Blocked items" gallery. This is the "interfaces (pages)" the JD names.
- **Automation:** when `Status` = Blocked → send Slack/email to Assignee. Or when `Stage` = Delivery → set a `Delivered` checkbox + timestamp. This is "how Automation within AT works."
- **Cross-base sync:** create a second base, **sync** the Deliverables table into it (Airtable Sync), and explain one-way sync, sync source, and when you'd use it ("syncing data from another base," "how data is saved from one base to another").
