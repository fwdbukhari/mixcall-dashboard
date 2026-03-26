# 📞 MixCall Revenue Dashboard

A private monthly revenue tracking dashboard for the MixCall Android app — built with Next.js and deployed on Vercel. Supports two roles: Admin (full access) and Partner (read-only 25% share view).

🌐 **Live:** [mixcall-dashboard.vercel.app](https://mixcall-dashboard.vercel.app)

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Admin (Fawad)** | Enter & update monthly data, view full breakdown, historical data entry from Feb 2023 |
| **Partner (Zahid)** | Read-only view of monthly/yearly profit & 25% share |

---

## ✨ Features

### 🔐 Login & Security
- Password-only login — two separate passwords (Admin & Partner)
- Cookie-based session (7-day), route protection via Next.js middleware
- Login page always stays dark regardless of theme choice

### 🎨 Themes
- **Dark** — default slate/violet dark mode
- **Light** — clean white/light grey mode
- **System** — auto-follows device OS preference
- Theme preference saved in browser, persists across sessions

### 📅 Admin Portal
- **Data Entry** — enter monthly revenue & expenses with exchange rate
- **Save vs Update** — button dynamically shows "Save" for new months, "Update" for existing
- **PKR / USD toggle** on all expense fields — type in PKR and it auto-converts to USD using the current exchange rate with a live preview hint
- **Revenue fields:** Gross Ads Revenue, Invalid Traffic Deduction, Subscription Revenue
- **Expense fields:** Marketing Spend, Server Cost, Paid Reviews, Tax, + unlimited custom "Other Expenses"
- **Live Summary** — auto-calculates Net Profit, Your 75%, Partner 25% in both USD and PKR as you type
- **Historical Data Entry** — access any month from February 2023 to present via "📅 All Months" picker. Months with saved data shown in green
- **Month Selector** — full dropdown covering all months from Feb 2023 to now
- **Monthly History** — shows 5 most recent months by default with "See All" toggle
- **Yearly View** — annual totals with collapsible month-by-month breakdown per year. Net profit shown in card header
- **Notes** — optional admin notes per month (visible to partner)

### 📊 Partner Portal
- **Monthly View** — hero card showing 25% share in USD + PKR for selected month
- **Historical picker** — navigate any saved month from Feb 2023 onwards (only months with data are clickable)
- **Collapsible Calculation Breakdown** — full revenue → expenses → net profit → 25% breakdown, toggle open/close
- **Stats row** — Total Revenue, Total Expenses, Net Profit, Your Share (25%)
- **Earnings History** — full monthly earnings table
- **Yearly View** — annual totals with collapsible year cards (▾ toggle), each showing net profit in header
- **Revenue Overview Chart** — bar or line chart showing Revenue vs Expenses vs Your 25% across all years, with year labels properly aligned below baseline
- **Download Reports** — CSV (opens in Excel/Sheets) or PDF/Print format, available per month, per year, or all months

### 💱 Currency
- All data stored and reported in **USD**
- PKR equivalent shown alongside USD everywhere using the monthly exchange rate
- Admin can input expenses in either USD or PKR — auto-converts using that month's rate

### 📱 Mobile Responsive
- Compact headers on small screens
- Tables scroll horizontally, secondary columns hidden on mobile
- Theme toggle is click-based (not hover) for touch screens
- Viewport meta tag prevents iOS/Android zoom on input fields

---

## 🔑 Login Credentials

| Role | Vercel Env Var | Description |
|---|---|---|
| Admin | `ADMIN_PASSWORD` | Full access — enter and edit data |
| Partner | `ZAHID_PASSWORD` | Read-only — view 25% share |
| Extra viewers | `VIEWER_USERS` | Add multiple read-only users |

### Adding Extra Viewers
Set `VIEWER_USERS` in Vercel Environment Variables:
```
Name1:Password1,Name2:Password2,Name3:Password3
```
Example: `Ahmed:Ahmed@123,Sara:Sara@456`

---

## 💰 Revenue Parameters

### Revenue (in USD)
- Gross Ads Revenue (AdMob / ad network)
- Invalid Traffic Deduction
- Subscription Revenue (Google Play)

### Expenses (USD or PKR input)
- Marketing Spend
- Server Cost
- Paid Reviews
- Tax
- Other Custom Expenses (unlimited, named)

### Auto-Calculated
| Field | Formula |
|---|---|
| Net Ads Revenue | Gross Ads Revenue − Invalid Traffic Deduction |
| Total Revenue | Net Ads Revenue + Subscription Revenue |
| Total Expenses | Sum of all expense fields |
| Net Profit | Total Revenue − Total Expenses |
| Admin Share | Net Profit × 75% |
| Partner Share | Net Profit × 25% |

---

## 🗄️ Data Storage

Uses **Upstash Redis** (via Vercel Marketplace) for persistent monthly data storage.

Setup: Vercel Dashboard → Storage → Create Database → Upstash Redis → Connect to project

Environment variables auto-populated by Vercel on connection:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Without Upstash connected, data is stored in-memory and resets on server restart.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| Styling | Tailwind CSS |
| Database | Upstash Redis (via @upstash/redis) |
| Hosting | Vercel |
| Auth | Cookie-based sessions + Next.js middleware |
| Charts | Pure SVG (no external chart library) |

---

## 📁 Project Structure

```
mixcall-dashboard/
├── pages/
│   ├── index.js            # Login page with theme switcher
│   ├── admin.js            # Admin dashboard (data entry + yearly view)
│   ├── partner.js          # Partner dashboard (read-only)
│   └── api/
│       ├── auth/
│       │   ├── login.js    # Login API — supports multiple viewer accounts
│       │   └── logout.js   # Logout + clear cookie
│       └── data/
│           ├── index.js    # List all saved months
│           └── [month].js  # GET / POST monthly data
├── components/
│   └── ThemeToggle.js      # Dark / Light / System theme switcher
├── lib/
│   ├── calculations.js     # Revenue math, formatting, month range (Feb 2023–now)
│   ├── storage.js          # Upstash Redis storage layer with in-memory fallback
│   └── useTheme.js         # Theme hook with localStorage persistence
├── styles/
│   └── globals.css         # Tailwind + light theme CSS overrides
└── middleware.js            # Route protection for /admin and /partner
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ Yes | Admin login password |
| `ZAHID_PASSWORD` | ✅ Yes | Partner (Zahid) login password |
| `VIEWER_USERS` | ➕ Optional | Extra read-only viewers: `Name:Pass,Name2:Pass2` |
| `KV_REST_API_URL` | 🔄 Auto | Set automatically by Vercel when Upstash is connected |
| `KV_REST_API_TOKEN` | 🔄 Auto | Set automatically by Vercel when Upstash is connected |

---

## 🔄 Deployment

Auto-deploys to Vercel on every push to the `main` branch via GitHub integration.

Manual deploy: push any commit to `main` → Vercel picks it up automatically.

---

*Confidential — MixCall Internal Use Only*  
*MixCall Revenue Dashboard v1.0 — Built March 2026*
