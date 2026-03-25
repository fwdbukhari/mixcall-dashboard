import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  calculateSummary, calculateYearlySummary,
  formatUSD, formatPKR,
  getMonthLabel, getCurrentMonth, getAllMonthsRange, getMonthsByYear,
  stepMonth
} from '../lib/calculations';

// ─── Chart Component (pure SVG, no external lib needed) ───────────────────────
function RevenueChart({ years, allData, type }) {
  // type: 'bar' | 'line'
  const data = useMemo(() => {
    return years.map(year => {
      const ys = calculateYearlySummary(year, allData);
      return {
        year,
        revenue: ys?.totalRevenue || 0,
        expenses: ys?.totalExpenses || 0,
        netProfit: ys?.netProfit || 0,
        partnerShare: ys?.partnerShare || 0,
      };
    }).reverse(); // oldest first for chart
  }, [years, allData]);

  if (data.length === 0) return null;

  const W = 600, H = 260, PAD = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allVals = data.flatMap(d => [d.revenue, d.expenses, d.partnerShare]);
  const maxVal = Math.max(...allVals, 1);
  const yScale = v => chartH - (v / maxVal) * chartH;
  const xStep = chartW / (data.length);
  const xPos = i => PAD.left + i * xStep + xStep / 2;

  // Y axis ticks
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (maxVal / ticks) * i);

  const series = [
    { key: 'revenue', color: '#34d399', label: 'Revenue' },
    { key: 'expenses', color: '#f87171', label: 'Expenses' },
    { key: 'partnerShare', color: '#60a5fa', label: 'Your 25%' },
  ];

  if (type === 'bar') {
    const bw = Math.max(8, xStep / 4 - 2);
    const offsets = [-bw - 2, 0, bw + 2];
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 260 }}>
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={PAD.top + yScale(v)} x2={W - PAD.right} y2={PAD.top + yScale(v)} stroke="#334155" strokeWidth="1" strokeDasharray="4,3" />
            <text x={PAD.left - 6} y={PAD.top + yScale(v) + 4} textAnchor="end" fontSize="9" fill="#64748b">
              ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}
            </text>
          </g>
        ))}
        {/* Bars */}
        {data.map((d, i) => (
          <g key={d.year}>
            {series.map((s, si) => {
              const bh = Math.max(1, (d[s.key] / maxVal) * chartH);
              const bx = xPos(i) + offsets[si] - bw / 2;
              const by = PAD.top + yScale(d[s.key]);
              return (
                <g key={s.key}>
                  <rect x={bx} y={by} width={bw} height={bh} fill={s.color} opacity="0.85" rx="2" />
                  <title>{s.label}: {formatUSD(d[s.key])}</title>
                </g>
              );
            })}
            <text x={xPos(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.year}</text>
          </g>
        ))}
        {/* Legend */}
        {series.map((s, i) => (
          <g key={s.key} transform={`translate(${PAD.left + i * 110}, ${H - 2})`}>
            <rect x="0" y="-10" width="10" height="10" fill={s.color} rx="2" opacity="0.85" />
            <text x="14" y="-1" fontSize="9" fill="#94a3b8">{s.label}</text>
          </g>
        ))}
      </svg>
    );
  }

  // Line chart
  const lineFor = (key, color) => {
    const pts = data.map((d, i) => `${xPos(i)},${PAD.top + yScale(d[key])}`).join(' ');
    return (
      <g key={key}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xPos(i)} cy={PAD.top + yScale(d[key])} r="4" fill={color} opacity="0.9" />
            <title>{formatUSD(d[key])}</title>
          </g>
        ))}
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 260 }}>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={PAD.top + yScale(v)} x2={W - PAD.right} y2={PAD.top + yScale(v)} stroke="#334155" strokeWidth="1" strokeDasharray="4,3" />
          <text x={PAD.left - 6} y={PAD.top + yScale(v) + 4} textAnchor="end" fontSize="9" fill="#64748b">
            ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}
          </text>
        </g>
      ))}
      {series.map(s => lineFor(s.key, s.color))}
      {data.map((d, i) => (
        <text key={d.year} x={xPos(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.year}</text>
      ))}
      {series.map((s, i) => (
        <g key={s.key} transform={`translate(${PAD.left + i * 110}, ${H - 2})`}>
          <rect x="0" y="-10" width="10" height="10" fill={s.color} rx="2" opacity="0.85" />
          <text x="14" y="-1" fontSize="9" fill="#94a3b8">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, usd, pkr, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-500/10 border-blue-500/20 text-blue-300',
    green:  'bg-green-500/10 border-green-500/20 text-green-300',
    red:    'bg-red-500/10 border-red-500/20 text-red-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
  };
  const textColor = colors[color].split(' ').find(c => c.startsWith('text-'));
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${textColor}`}>{usd}</p>
      <p className="text-sm text-slate-500 font-mono mt-0.5">{pkr}</p>
    </div>
  );
}

// ─── Collapsible Section ────────────────────────────────────────────────────────
function Collapsible({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/30 transition-colors"
      >
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <span className={`text-slate-400 text-lg transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}>
          ▾
        </span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function PartnerDashboard() {
  const router = useRouter();
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState(null);
  const [savedMonths, setSavedMonths] = useState([]);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' | 'yearly'
  const [chartType, setChartType] = useState('bar');     // 'bar' | 'line'
  const [showHistorical, setShowHistorical] = useState(false);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      const months = d.months || [];
      setSavedMonths(months);
      if (months.length > 0 && !months.includes(month)) setMonth(months[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/${month}`).then(r => r.json()).then(d => {
      setData(d.data || null);
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, [month]);

  useEffect(() => {
    if (savedMonths.length === 0) return;
    Promise.all(savedMonths.map(m =>
      fetch(`/api/data/${m}`).then(r => r.json()).then(d => [m, d.data])
    )).then(entries => setAllData(Object.fromEntries(entries.filter(([, d]) => d))));
  }, [savedMonths]);

  const summary = useMemo(() => calculateSummary(data), [data]);
  const years = useMemo(() => [...new Set(savedMonths.map(m => m.split('-')[0]))].sort().reverse(), [savedMonths]);
  const byYear = getMonthsByYear();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <>
      <Head><title>MixCall Partner Dashboard</title></Head>
      <div className="min-h-screen bg-slate-900 text-white">

        {/* ── Header ── */}
        <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/50 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-lg shadow-blue-500/30">📞</div>
              <div>
                <h1 className="text-base font-bold text-white leading-none">MixCall</h1>
                <p className="text-xs text-slate-400 leading-none mt-0.5">Partner Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex bg-slate-700/60 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'monthly' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  📅 Monthly
                </button>
                <button
                  onClick={() => setActiveTab('yearly')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'yearly' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  📊 Yearly
                </button>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Partner · 25%
              </span>
              <button onClick={logout} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors">Sign Out</button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Mobile tabs */}
          <div className="flex sm:hidden bg-slate-700/60 rounded-lg p-1 gap-1 mb-5">
            <button onClick={() => setActiveTab('monthly')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>📅 Monthly</button>
            <button onClick={() => setActiveTab('yearly')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'yearly' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>📊 Yearly</button>
          </div>

          {/* ══════════════════════════════════════════
              MONTHLY TAB
          ══════════════════════════════════════════ */}
          {activeTab === 'monthly' && (
            <>
              {/* Month navigator */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{getMonthLabel(month)}</h2>
                  <p className="text-slate-500 text-sm">Your revenue share for this period</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistorical(v => !v)}
                    className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-lg hover:bg-blue-500/30 transition-all font-medium"
                  >
                    📅 {showHistorical ? 'Hide' : 'All Months'}
                  </button>
                  <button onClick={() => setMonth(s => stepMonth(s, -1))}
                    className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors">‹</button>
                  <select value={month} onChange={e => setMonth(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {getAllMonthsRange().map(m => (
                      <option key={m} value={m}>{getMonthLabel(m)}</option>
                    ))}
                  </select>
                  <button onClick={() => setMonth(s => stepMonth(s, 1))}
                    disabled={month >= getCurrentMonth()}
                    className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors disabled:opacity-30">›</button>
                </div>
              </div>

              {/* Historical picker */}
              {showHistorical && (
                <div className="bg-slate-800/90 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <p className="text-xs text-blue-300 font-semibold mb-3">📅 Select Any Month</p>
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {Object.keys(byYear).sort().reverse().map(year => (
                      <div key={year}>
                        <p className="text-xs text-slate-500 font-semibold mb-1.5 sticky top-0 bg-slate-800/90 py-0.5">{year}</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {byYear[year].map(m => {
                            const isSaved = savedMonths.includes(m);
                            return (
                              <button key={m} onClick={() => { setMonth(m); setShowHistorical(false); }}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  m === month ? 'bg-blue-600 text-white' :
                                  isSaved ? 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30' :
                                  'bg-slate-700/50 text-slate-500 cursor-default'
                                }`}
                                disabled={!isSaved && m !== month}
                              >
                                {new Date(+m.split('-')[0], +m.split('-')[1] - 1, 1).toLocaleDateString('en-US', { month: 'short' })}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700/50">
                    <span className="flex items-center gap-1 text-xs text-green-400"><span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span> Has data</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 bg-slate-600 rounded-full inline-block"></span> No data</span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-16 text-slate-500">Loading…</div>
              ) : !data ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-slate-400">No data for {getMonthLabel(month)} yet.</p>
                  <p className="text-slate-600 text-sm mt-1">Check back once the admin uploads this month's report.</p>
                </div>
              ) : summary ? (
                <>
                  {/* Hero share card */}
                  <div className={`rounded-2xl p-6 border mb-5 ${summary.partnerShare >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className="text-blue-400 text-sm font-medium mb-1">Your Share — 25% of Net Profit</p>
                    <p className={`text-4xl font-bold font-mono mb-1 ${summary.partnerShare >= 0 ? 'text-blue-300' : 'text-red-400'}`}>
                      {formatUSD(summary.partnerShare)}
                    </p>
                    <p className="text-xl text-slate-400 font-mono">{formatPKR(summary.partnerSharePKR)}</p>
                    <p className="text-slate-500 text-xs mt-2">Rate: 1 USD = {summary.rate} PKR</p>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <StatCard label="Total Revenue"   usd={formatUSD(summary.totalRevenue)}   pkr={formatPKR(summary.totalRevenuePKR)}   color="green" />
                    <StatCard label="Total Expenses"  usd={formatUSD(summary.totalExpenses)}  pkr={formatPKR(summary.totalExpensesPKR)}  color="red"   />
                    <StatCard label="Net Profit"      usd={formatUSD(summary.netProfit)}      pkr={formatPKR(summary.netProfitPKR)}      color={summary.netProfit >= 0 ? 'green' : 'red'} />
                    <StatCard label="Your Share (25%)" usd={formatUSD(summary.partnerShare)}  pkr={formatPKR(summary.partnerSharePKR)}   color="blue"  />
                  </div>

                  {/* ── Collapsible Calculation Breakdown ── */}
                  <Collapsible title="📋 Calculation Breakdown" defaultOpen={true}>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Gross Ads Revenue',          value: formatUSD(summary.adsRevenue),      color: 'text-slate-200', indent: false },
                        { label: '− Invalid Traffic Deduction', value: `−${formatUSD(summary.invalidDeduction)}`, color: 'text-red-400', indent: true },
                        { label: 'Subscription Revenue',       value: `+${formatUSD(summary.subscriptionRev)}`, color: 'text-slate-200', indent: false },
                      ].map(r => (
                        <div key={r.label} className={`flex justify-between ${r.indent ? 'pl-4' : ''}`}>
                          <span className="text-slate-400">{r.label}</span>
                          <span className={`font-mono ${r.color}`}>{r.value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-medium border-t border-slate-700/50 pt-2 mt-1">
                        <span className="text-slate-300">Total Revenue</span>
                        <span className="font-mono text-green-400">{formatUSD(summary.totalRevenue)}</span>
                      </div>
                      {[
                        { label: '− Marketing',    value: summary.marketing },
                        { label: '− Server Cost',  value: summary.server },
                        { label: '− Paid Reviews', value: summary.reviews },
                        { label: '− Tax',          value: summary.tax },
                        ...(summary.other > 0 ? [{ label: '− Other', value: summary.other }] : []),
                      ].map(r => (
                        <div key={r.label} className="flex justify-between pl-4">
                          <span className="text-slate-500">{r.label}</span>
                          <span className="font-mono text-red-400">−{formatUSD(r.value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold border-t border-slate-700/50 pt-2 mt-1">
                        <span className="text-white">Net Profit</span>
                        <span className={`font-mono ${summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(summary.netProfit)}</span>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
                        <div className="flex justify-between">
                          <span className="text-blue-300 font-semibold">Your Share (25%)</span>
                          <span className="font-mono text-blue-300 font-bold">{formatUSD(summary.partnerShare)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-xs mt-0.5">
                          <span>In PKR</span>
                          <span className="font-mono">{formatPKR(summary.partnerSharePKR)}</span>
                        </div>
                      </div>
                    </div>
                  </Collapsible>

                  {data.notes && (
                    <div className="bg-slate-800/40 rounded-xl px-5 py-4 border border-slate-700/30 mb-4">
                      <p className="text-xs text-slate-500 mb-1">Admin Notes</p>
                      <p className="text-slate-300 text-sm">{data.notes}</p>
                    </div>
                  )}
                </>
              ) : null}

              {/* ── Earnings History Table ── */}
              {savedMonths.length > 0 && (
                <Collapsible title="📅 Your Earnings History" defaultOpen={true}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-700/50">
                          <th className="pb-2 font-medium px-2">Month</th>
                          <th className="pb-2 font-medium px-2 text-right">Net Profit</th>
                          <th className="pb-2 font-medium px-2 text-right">Your 25%</th>
                          <th className="pb-2 font-medium px-2 text-right">In PKR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedMonths.map(m => {
                          const d = allData[m]; if (!d) return null;
                          const s = calculateSummary(d); if (!s) return null;
                          return (
                            <tr key={m} onClick={() => setMonth(m)}
                              className={`border-b border-slate-800 hover:bg-slate-700/30 cursor-pointer transition-colors ${m === month ? 'bg-slate-700/40' : ''}`}
                            >
                              <td className="py-2.5 px-2 font-medium text-slate-300">{getMonthLabel(m)}</td>
                              <td className={`py-2.5 px-2 text-right font-mono ${s.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(s.netProfit)}</td>
                              <td className="py-2.5 px-2 text-right text-blue-300 font-mono font-semibold">{formatUSD(s.partnerShare)}</td>
                              <td className="py-2.5 px-2 text-right text-slate-500 font-mono">{formatPKR(s.partnerSharePKR)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Collapsible>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════
              YEARLY TAB
          ══════════════════════════════════════════ */}
          {activeTab === 'yearly' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Your Yearly Earnings</h2>
                <p className="text-slate-500 text-sm">Annual totals of your 25% profit share</p>
              </div>

              {years.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-slate-400">No data available yet.</p>
                </div>
              ) : (
                <>
                  {/* ── Chart Section ── */}
                  <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-300">📈 Revenue Overview</h3>
                        <p className="text-xs text-slate-500 mt-0.5">All years — Revenue vs Expenses vs Your Share</p>
                      </div>
                      {/* Chart type toggle */}
                      <div className="flex bg-slate-700/60 rounded-lg p-1 gap-1">
                        <button
                          onClick={() => setChartType('bar')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <span>▊▊</span> Bar
                        </button>
                        <button
                          onClick={() => setChartType('line')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <span>╱</span> Line
                        </button>
                      </div>
                    </div>
                    <RevenueChart years={years} allData={allData} type={chartType} />
                  </div>

                  {/* ── Yearly cards ── */}
                  {years.map(year => {
                    const ys = calculateYearlySummary(year, allData);
                    if (!ys) return null;
                    const monthsInYear = savedMonths.filter(m => m.startsWith(year));
                    return (
                      <div key={year} className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white">{year}</h3>
                            <p className="text-xs text-slate-500">{ys.monthCount} months recorded</p>
                          </div>
                          <div className="bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-xl text-right">
                            <p className="text-blue-300 font-bold font-mono text-base">{formatUSD(ys.partnerShare)}</p>
                            <p className="text-blue-400 text-xs">your 25% share</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-slate-700/40 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-0.5">Net Profit</p>
                            <p className={`text-sm font-bold font-mono ${ys.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(ys.netProfit)}</p>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <p className="text-xs text-blue-400 mb-0.5">Your 25% (USD)</p>
                            <p className="text-sm font-bold text-blue-300 font-mono">{formatUSD(ys.partnerShare)}</p>
                          </div>
                          <div className="bg-slate-700/40 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-0.5">Approx. PKR</p>
                            <p className="text-sm font-bold text-slate-300 font-mono">{formatPKR(ys.partnerShare * 280)}</p>
                          </div>
                        </div>
                        {/* Monthly breakdown for this year */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-700/40">
                                <th className="pb-1.5 text-left font-medium px-2">Month</th>
                                <th className="pb-1.5 text-right font-medium px-2">Revenue</th>
                                <th className="pb-1.5 text-right font-medium px-2">Expenses</th>
                                <th className="pb-1.5 text-right font-medium px-2">Net Profit</th>
                                <th className="pb-1.5 text-right font-medium px-2">Your 25%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthsInYear.map(m => {
                                const d = allData[m]; if (!d) return null;
                                const s = calculateSummary(d); if (!s) return null;
                                return (
                                  <tr key={m} onClick={() => { setMonth(m); setActiveTab('monthly'); }}
                                    className="border-b border-slate-800/60 hover:bg-slate-700/30 cursor-pointer transition-colors">
                                    <td className="py-2 px-2 text-slate-300">{getMonthLabel(m)}</td>
                                    <td className="py-2 px-2 text-right text-slate-400 font-mono">{formatUSD(s.totalRevenue)}</td>
                                    <td className="py-2 px-2 text-right text-red-400 font-mono">{formatUSD(s.totalExpenses)}</td>
                                    <td className={`py-2 px-2 text-right font-mono font-semibold ${s.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(s.netProfit)}</td>
                                    <td className="py-2 px-2 text-right text-blue-300 font-mono font-semibold">{formatUSD(s.partnerShare)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
