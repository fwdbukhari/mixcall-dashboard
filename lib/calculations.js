export function fmt(n) {
  return (parseFloat(n) || 0).toFixed(2);
}

export function formatUSD(n) {
  const v = parseFloat(n) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
}

export function formatPKR(n) {
  const v = parseFloat(n) || 0;
  return '₨ ' + new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(v);
}

export function getMonthLabel(s) {
  if (!s) return '';
  const [y, m] = s.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function stepMonth(s, delta) {
  const [y, m] = s.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Generate all months from Jan 2022 to current month
export function getAllMonthsRange() {
  const months = [];
  const start = { year: 2022, month: 1 };
  const now = new Date();
  const end = { year: now.getFullYear(), month: now.getMonth() + 1 };

  let y = end.year, m = end.month;
  while (y > start.year || (y === start.year && m >= start.month)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m--;
    if (m === 0) { m = 12; y--; }
  }
  return months; // newest first
}

// Group months by year for dropdown display
export function getMonthsByYear() {
  const all = getAllMonthsRange();
  const grouped = {};
  all.forEach(m => {
    const year = m.split('-')[0];
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(m);
  });
  return grouped; // { '2025': [...], '2024': [...], ... }
}

export function calculateSummary(data) {
  if (!data) return null;
  const rate = parseFloat(data.exchangeRate) || 280;

  const adsRevenue        = parseFloat(data.revenue?.adsRevenue) || 0;
  const invalidDeduction  = parseFloat(data.revenue?.invalidTrafficDeduction) || 0;
  const subscriptionRev   = parseFloat(data.revenue?.subscriptionRevenue) || 0;

  const netAdsRevenue  = adsRevenue - invalidDeduction;
  const totalRevenue   = netAdsRevenue + subscriptionRev;

  const marketing  = parseFloat(data.expenses?.marketingSpend) || 0;
  const server     = parseFloat(data.expenses?.serverCost) || 0;
  const reviews    = parseFloat(data.expenses?.paidReviews) || 0;
  const tax        = parseFloat(data.expenses?.tax) || 0;
  const otherList  = data.expenses?.otherExpenses || [];
  const other      = otherList.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const totalExpenses = marketing + server + reviews + tax + other;
  const netProfit     = totalRevenue - totalExpenses;
  const adminShare    = netProfit * 0.75;
  const partnerShare  = netProfit * 0.25;

  return {
    rate,
    adsRevenue, invalidDeduction, netAdsRevenue,
    subscriptionRev, totalRevenue,
    marketing, server, reviews, tax, other, otherList,
    totalExpenses, netProfit, adminShare, partnerShare,
    totalRevenuePKR:  totalRevenue  * rate,
    totalExpensesPKR: totalExpenses * rate,
    netProfitPKR:     netProfit     * rate,
    adminSharePKR:    adminShare    * rate,
    partnerSharePKR:  partnerShare  * rate,
  };
}

// Yearly aggregate from a map of { month: summaryData }
export function calculateYearlySummary(year, allData) {
  const months = Object.keys(allData).filter(m => m.startsWith(year));
  if (months.length === 0) return null;
  const sums = months.map(m => calculateSummary(allData[m])).filter(Boolean);
  return {
    totalRevenue:   sums.reduce((a, s) => a + s.totalRevenue, 0),
    totalExpenses:  sums.reduce((a, s) => a + s.totalExpenses, 0),
    netProfit:      sums.reduce((a, s) => a + s.netProfit, 0),
    adminShare:     sums.reduce((a, s) => a + s.adminShare, 0),
    partnerShare:   sums.reduce((a, s) => a + s.partnerShare, 0),
    monthCount:     sums.length,
  };
}

export const EMPTY_MONTH = {
  exchangeRate: '280',
  revenue: { adsRevenue: '', invalidTrafficDeduction: '', subscriptionRevenue: '' },
  expenses: {
    marketingSpend: '', serverCost: '', paidReviews: '', tax: '',
    otherExpenses: []
  },
  notes: '',
};
