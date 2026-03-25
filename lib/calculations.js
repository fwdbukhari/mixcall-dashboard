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
    // PKR
    totalRevenuePKR:  totalRevenue  * rate,
    totalExpensesPKR: totalExpenses * rate,
    netProfitPKR:     netProfit     * rate,
    adminSharePKR:    adminShare    * rate,
    partnerSharePKR:  partnerShare  * rate,
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
