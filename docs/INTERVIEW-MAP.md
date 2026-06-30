# Interview map — how this project answers the JD

Use this to walk an interviewer through the demo. Each row: what they asked → what to point at.

| Job description line | What to say / show |
|---|---|
| "Airtable fundamentals — how to create a project with Airtable" | I built **Post Pipeline** from an empty base: tables, single-select fields, a working app on top. Walk through `docs/AIRTABLE-BASE.md`. |
| "The data layer and interface — the Base, how things are connected" | The base is the data layer; `Deliverables` is one table with typed fields. Show how a `Shows` link field connects records across tables (stretch). |
| "How Automation within AT works" | Describe the Blocked→notify Assignee automation and Stage=Delivery→stamp Delivered. Trigger → condition → action. |
| "Know the interfaces (pages)" | Airtable Interfaces = no-code app pages on top of the base. I built a Kanban "Producer View"; my Netlify app is the same idea via the API for full control. |
| "If they can sync data from another base and know the process" | Airtable **Sync**: one-way, pick source table + view, target base gets a synced (read-only) copy. Use it to share post data with a downstream marketing base without giving edit access. |
| "How data is being saved from one base to another" | Sync source → synced table; or automations writing across bases via API. |
| "Post-production workflows / 'Studio' production" | The whole model: Editorial → VFX → Color → Mix → QC → Delivery, with status, priority, assignee, due dates. |
| "Config apps, Retool, low-code" | This app is the low-code-adjacent custom layer (Netlify Functions + Airtable REST API) for when Interfaces aren't enough. |
| "Strong PO user stories, UAT, req gathering" | See `REQUIREMENTS.md` — written as user stories with acceptance criteria. |
| "Must-have AI tools, prompts in work environment" | Built with an AI dev agent (this!). Can speak to prompt-driven build + Airtable AI fields. |
| "Not an order taker, can propose solutions" | Pitch: "From what you're describing, a synced reporting base + a Blocked-item automation solves the visibility gap." |

## 60-second demo script
1. "This tracks TV+ deliverables through post-production stages, backed by Airtable."
2. Open the live board → "Each column is a Stage, each card a deliverable."
3. Change a card's Stage dropdown → "That just wrote to Airtable via a Netlify Function — the token stays server-side."
4. Open Airtable in another tab → show the row updated. "Same data layer, two interfaces."
5. "In Airtable I'd add an automation to ping the assignee when something's Blocked, and sync this into a reporting base for producers."
