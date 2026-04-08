# Troop 1910 — Campout Permission Form System

React web form + Cloudflare Worker + Google Sheets.

---

## Architecture1

```
GitHub Repo
  ├── CampoutPermissionForm.jsx   ← React form (authenticated frontend)
  ├── worker.js                   ← Cloudflare Worker (API endpoint)
  ├── wrangler.toml               ← Worker config (safe to commit)
  └── README.md

Cloudflare Dashboard
  └── Secrets (never in repo):
        GOOGLE_SERVICE_ACCOUNT_EMAIL
        GOOGLE_PRIVATE_KEY
        SPREADSHEET_ID

Google Cloud
  └── Service Account with Sheets API access
```

**Request flow:**
```
Browser (authenticated parent)
  → POST /  (Cloudflare Worker URL)
    → Google Sheets API  (service account JWT auth)
      → Append row to SHEET_TAB_NAME tab
```

---

## One-Time Setup

### 1 — Google Cloud Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use an existing one)
3. Enable the **Google Sheets API**:
   APIs & Services → Library → search "Google Sheets API" → Enable
4. Create a service account:
   APIs & Services → Credentials → Create Credentials → Service Account
   - Name: `troop1910-forms` (or similar)
   - No project-level role needed
5. On the service account page → Keys tab → Add Key → JSON
   Download the JSON — extract two values:
   - `client_email`  →  `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key`   →  `GOOGLE_PRIVATE_KEY`

### 2 — Google Sheet

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Share the sheet with your service account email → **Editor** role
   *(The new monthly tab is created automatically on first submission)*

### 3 — Cloudflare Worker

**Install Wrangler:**
```bash
npm install -g wrangler
wrangler login
```

**Set secrets** (paste values from service account JSON when prompted):
```bash
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
npx wrangler secret put GOOGLE_PRIVATE_KEY
npx wrangler secret put SPREADSHEET_ID
```

**Edit `wrangler.toml`** — set your site's domain:
```toml
[vars]
SHEET_TAB_NAME = "April 2026"
ALLOWED_ORIGIN = "https://your-troop-site.org"
```

**Deploy:**
```bash
npx wrangler deploy
# → prints: https://troop1910-permission-form.YOUR-SUBDOMAIN.workers.dev
```

### 4 — React Form

In `CampoutPermissionForm.jsx`, update:
```js
const WORKER_URL = "https://troop1910-permission-form.YOUR-SUBDOMAIN.workers.dev";
const authenticatedUser = useAuth().user.email; // your auth provider
```

---

## ✅ Monthly Update Checklist

**Two files, two edits, one deploy.**

### `wrangler.toml`
```toml
SHEET_TAB_NAME = "May 2026"   # ← change this
```

### `CampoutPermissionForm.jsx`
```js
const CAMPOUT_META = {
  title:    "May 2026 Campout",
  theme:    "First Aid & Wilderness Skills",
  location: "...",
  dates:    "May 8–10, 2026",
  depart:   "Hallelujah Center · Friday May 8 · 5:45 PM",
  returnEst:"Sunday May 10, 2026 · Est. 2:00 PM",
  formDue:  "Monday, May 4, 2026",
  foodCost: "$15 Scout Cash · $25 Adult Cash",
};
```

Then:
```bash
git commit -am "May 2026 campout"
git push
npx wrangler deploy
```

The new tab is auto-created with a formatted frozen header row on first submission.

---

## Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `SHEET_TAB_NAME` | `wrangler.toml` | Current month tab — update monthly |
| `ALLOWED_ORIGIN` | `wrangler.toml` | Frontend origin for CORS |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Cloudflare secret | Service account `client_email` |
| `GOOGLE_PRIVATE_KEY` | Cloudflare secret | Service account `private_key` (PEM) |
| `SPREADSHEET_ID` | Cloudflare secret | Sheet ID from URL |

Secrets are set once via `wrangler secret put`. Never committed to source control.

---

## Local Development

Create a `.dev.vars` file (add to `.gitignore`):
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
SHEET_TAB_NAME=April 2026
ALLOWED_ORIGIN=http://localhost:3000
```

Then:
```bash
npx wrangler dev
# Worker runs at http://localhost:8787
```

---

## Security Notes

- Required fields are validated server-side in the Worker before any Sheets write
- CORS is locked to `ALLOWED_ORIGIN` — other origins get rejected
- The Google private key is a Cloudflare encrypted secret — never appears in logs or `wrangler` output
- The service account has Editor access only to the one shared spreadsheet

---

*Troop 1910 · Cloudflare Workers + Google Sheets*
