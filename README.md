# 📞 MixCall Revenue Dashboard

A private monthly revenue tracking dashboard for MixCall app — built with Next.js and deployed on Vercel.

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Admin (Fawad)** | Enter monthly data, view full breakdown, edit figures |
| **Partner** | Read-only view of monthly profit & 25% share |

---

## 💰 What It Tracks

### Revenue
- Gross Ads Revenue (AdMob)
- Invalid Traffic Deduction
- Subscription Revenue (Google Play)

### Expenses
- Marketing Spend
- Server Cost
- Paid Reviews
- Tax
- Other Custom Expenses

### Auto-Calculated
- Net Ads Revenue (after invalid traffic deduction)
- Total Revenue
- Total Expenses
- **Net Profit**
- **Admin Share — 75%**
- **Partner Share — 25%**
- All figures shown in both **USD** and **PKR**

---

## 🔐 Login

Two separate passwords — one for Admin, one for Partner.  
Set via Vercel Environment Variables:
- `ADMIN_PASSWORD`
- `PARTNER_PASSWORD`

---

## 🗄️ Data Storage

Uses **Vercel KV** (Redis) for persistent monthly data storage.  
Set up via: Vercel Dashboard → Storage → Create KV Database → Connect to project.

---

## 🚀 Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Storage:** Vercel KV
- **Hosting:** Vercel
- **Auth:** Cookie-based session with middleware route protection

---

## 📁 Project Structure

```
mixcall-dashboard/
├── pages/
│   ├── index.js          # Login page
│   ├── admin.js          # Admin dashboard (data entry + summary)
│   ├── partner.js        # Partner dashboard (read-only)
│   └── api/
│       ├── auth/
│       │   ├── login.js  # Login API
│       │   └── logout.js # Logout API
│       └── data/
│           ├── index.js  # List all months
│           └── [month].js # Get/save month data
├── lib/
│   ├── calculations.js   # Revenue math & formatting
│   └── storage.js        # Vercel KV storage layer
├── styles/
│   └── globals.css
└── middleware.js          # Route protection
```

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `ADMIN_PASSWORD` | Admin login password |
| `PARTNER_PASSWORD` | Partner login password |
| `KV_REST_API_URL` | Auto-set by Vercel KV |
| `KV_REST_API_TOKEN` | Auto-set by Vercel KV |

---

*Confidential — MixCall Internal Use Only*
