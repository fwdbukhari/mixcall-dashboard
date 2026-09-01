# MixCall Revenue Dashboard

A private monthly revenue tracking dashboard for the MixCall Android app — built with Next.js and deployed on Vercel. Supports multiple user roles: Admin (full access), Partner (read-only 25% share view), and optional extra Viewers.

🌐 **Live:** [mixcall-dashboard.vercel.app](https://mixcall-dashboard.vercel.app)

---

## 👥 User Roles

| Role | User | Access |
|---|---|---|
| **Admin** | Fawad | Enter & update monthly data, full breakdown, all history |
| **Partner** | Zahid | Read-only — monthly/yearly profit & 25% share |
| **Viewer** | Shahid Khan + others | Same as Partner — read-only view |

---

## ✨ Features

### 🔐 Login & Security
- Password-only login — separate passwords per user
- Username shown in header after login (pulled from session cookie)
- Cookie-based session (7-day), route protection via Next.js middleware
- Login page always stays dark regardless of theme

### 🎨 Themes
- **Dark** — default slate/violet dark mode
- **Light** — clean white/light grey mode
- **System** — auto-follows device OS preference
- Theme preference saved in browser, persists across sessions

### 📅 Admin Portal
- **Data Entry** — enter monthly revenue & expenses with exchange rate
- **Save vs Update** — button shows "Save" for new months, "Update" for existing
- **PKR / USD toggle** on all expense fields with auto-conversion using that month's rate
- **Revenue fields:** Gross Ads Revenue, Invalid Traffic Deduction, Subscription Revenue
- **Expense fields:** Marketing Spend, Server Cost, Paid Reviews, Tax + unlimited custom expenses
- **Live Summary** — auto-calculates Net Profit, 75% / 25% split in USD and PKR as you type
- **Month picker** — full range from February 2023 to present. Saved months highlighted in green
- **Monthly History** — 5 most recent months by default with "See All" toggle
- **Yearly View** — annual totals with collapsible month-by-month breakdown, net profit in card header

### 📊 Partner Portal
- **Monthly View** — hero card showing 25% share in USD + PKR
- **Historical picker** — navigate any saved month (only months with data are clickable)
- **Collapsible Calculation Breakdown** — full revenue → expenses → net profit → 25% breakdown
- **Stats row** — Total Revenue, Total Expenses, Net Profit, Your Share (25%)
- **Earnings History** — full monthly earnings table
- **Yearly View** — annual totals with collapsible year cards
- **Revenue Overview Chart** — Bar/Line toggle showing Revenue vs Expenses vs Partner 25%
- **Download Reports** — CSV or PDF, per month, per year, or all months

### 💱 Currency
- All data stored in **USD**
- PKR equivalent shown alongside USD using the monthly exchange rate
- Admin can input expenses in USD or PKR — auto-converts on save

### 📱 Mobile Responsive
- Compact headers on small screens
- Tables scroll horizontally, secondary columns hidden on mobile
- Theme toggle is click-based for touch screens

---

## 🔑 Login Credentials

Stored in Vercel Environment Variables — never in the codebase.

| Role | Env Var | Notes |
|---|---|---|
| Admin | `ADMIN_PASSWORD` | Full access |
| Partner (Zahid) | `ZAHID_PASSWORD` | Read-only |
| Extra Viewers | `VIEWER_USERS` | Format: `Name:Password,Name2:Password2` |
| GitHub Token | `GITHUB_TOKEN` | Used by storage layer to write data |

### Adding Extra Viewers
Set `VIEWER_USERS` in Vercel → Environment Variables:
```
Shahid:Shahid@2424,Ahmed:Ahmed@123
```
Then redeploy for changes to take effect.

---

## 💰 Revenue Split

| Stakeholder | Share |
|---|---|
| Admin (Fawad) | 75% of Net Profit |
| Partner (Zahid) | 25% of Net Profit |

### Formula
| Field | Calculation |
|---|---|
| Net Ads Revenue | Gross Ads Revenue − Invalid Traffic Deduction |
| Total Revenue | Net Ads Revenue + Subscription Revenue |
| Total Expenses | Sum of all expense fields |
| Net Profit | Total Revenue − Total Expenses |
| Admin Share | Net Profit × 75% |
| Partner Share | Net Profit × 25% |

---

## 🗄️ Data Storage

All revenue data is stored as a **JSON file in this GitHub repository** at `data/revenue.json`.

- **Reads:** GitHub Contents API (always fresh, server-side)
- **Writes:** GitHub Contents API — each save creates a commit to `data/revenue.json`
- **Permanent:** Data lives in the repo forever — no expiry, no database to maintain
- **Required env var:** `GITHUB_TOKEN` (with `repo` scope)

> This approach replaces the previous Upstash Redis setup and is ideal for low-frequency usage (monthly updates). Data is committed to the repo on every save.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.35 (Pages Router) |
| Styling | Tailwind CSS |
| Data Storage | GitHub JSON (`data/revenue.json` via GitHub API) |
| Hosting | Vercel (Free plan — repo must stay public) |
| Auth | Cookie-based sessions + Next.js middleware |
| Charts | Pure SVG (no external chart library) |

---

## 📁 Project Structure

```
mixcall-dashboard/
├── data/
│   └── revenue.json          # All revenue data (committed on every save)
├── pages/
│   ├── index.js              # Login page
│   ├── admin.js              # Admin portal
│   ├── partner.js            # Partner portal
│   └── api/
│       ├── auth/
│       │   ├── login.js      # Login — sets mc_role + mc_name cookies
│       │   └── logout.js     # Logout — clears both cookies
│       └── data/
│           ├── index.js      # List all saved months
│           └── [month].js    # GET / POST monthly data
├── lib/
│   ├── calculations.js       # Revenue math, formatting, month range
│   ├── storage.js            # GitHub JSON storage layer
│   └── useTheme.js           # Theme hook (dark/light/system)
├── components/
│   └── ThemeToggle.js        # Theme switcher component
├── public/
│   ├── mixcall-icon.png      # App icon (used in header + login)
│   └── favicon.png           # Browser tab icon
├── styles/
│   └── globals.css           # Tailwind + light theme overrides
└── middleware.js             # Route protection for /admin and /partner
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ Yes | Admin login password |
| `ZAHID_PASSWORD` | ✅ Yes | Partner login password |
| `VIEWER_USERS` | ➕ Optional | Extra viewers: `Name:Pass,Name2:Pass2` |
| `GITHUB_TOKEN` | ✅ Yes | GitHub Personal Access Token (repo scope) for writing data |

> ⚠️ `GITHUB_TOKEN` expires based on how it was created. If data saves stop working, regenerate the token at [github.com/settings/tokens](https://github.com/settings/tokens) and update the Vercel env var.

---

## 🔄 Deployment

Auto-deploys to Vercel on every push to `main` via GitHub integration.

> ⚠️ The GitHub repo must remain **public** for Vercel Free plan auto-deploy to work.

---

## 📅 Data History

Revenue data tracked from **February 2023** onwards.

---

*Confidential — MixCall Internal Use Only*
*MixCall Revenue Dashboard v2.0 — Updated September 2026*
