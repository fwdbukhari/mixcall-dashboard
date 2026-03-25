import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  calculateSummary, formatUSD, formatPKR,
  getMonthLabel, getCurrentMonth, stepMonth
} from '../lib/calculations';

function StatCard({ label, usd, pkr, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    green: 'bg-green-500/10 border-green-500/20 text-green-300',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
  };
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${colors[color].split(' ').pop()}`}>{usd}</p>
      <p className="text-sm text-slate-500 font-mono mt-0.5">{pkr}</p>
    </div>
  );
}

export default function PartnerDashboard() {
  const router = useRouter();
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState(null);
  const [allMonths, setAllMonths] = useState([]);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      const months = d.months || [];
      setAllMonths(months);
      if (months.length > 0 && !months.includes(month)) {
        setMonth(months[0]); // default to most recent
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/${month}`).then(r => r.json()).then(d => {
      setData(d.data || null);
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, [month]);

  useEffect(() => {
    if (allMonths.length === 0) return;
    Promise.all(allMonths.map(m =>
      fetch(`/api/data/${m}`).then(r => r.json()).then(d => [m, d.data])
    )).then(entries => {
      setAllData(Object.fromEntries(entries.filter(([, d]) => d)));
    });
  }, [allMonths]);

  const summary = useMemo(() => calculateSummary(data), [data]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <>
      <Head><title>MixCall Partner Dashboard</title></Head>
      <div className="min-h-screen bg-slate-900 text-white">

        {/* Header */}
        <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/50 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-lg shadow-blue-500/30">📞</div>
              <div>
                <h1 className="text-base font-bold text-white leading-none">MixCall</h1>
                <p className="text-xs text-slate-400 leading-none mt-0.5">Partner Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Partner · 25%
              </span>
              <button onClick={logout} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Month Selector */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{getMonthLabel(month)}</h2>
              <p className="text-slate-500 text-sm">Your revenue share for this period</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMonth(s => stepMonth(s, -1))}
                className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors">‹</button>
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...new Set([month, ...allMonths])].sort().reverse().slice(0, 24).map(m => (
                  <option key={m} value={m}>{getMonthLabel(m)}</option>
                ))}
              </select>
              <button onClick={() => setMonth(s => stepMonth(s, 1))}
                className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors">›</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-500">Loading…</div>
          ) : !data ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-400">No data available for {getMonthLabel(month)} yet.</p>
              <p className="text-slate-600 text-sm mt-1">Check back once the admin uploads this month's report.</p>
            </div>
          ) : summary ? (
            <>
              {/* Hero: Partner Share */}
              <div className={`rounded-2xl p-6 border mb-6 ${summary.partnerShare >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <p className="text-blue-400 text-sm font-medium mb-1">Your Share — 25% of Net Profit</p>
                <p className={`text-4xl font-bold font-mono mb-1 ${summary.partnerShare >= 0 ? 'text-blue-300' : 'text-red-400'}`}>
                  {formatUSD(summary.partnerShare)}
                </p>
                <p className="text-xl text-slate-400 font-mono">{formatPKR(summary.partnerSharePKR)}</p>
                <p className="text-slate-500 text-xs mt-2">Rate: 1 USD = {summary.rate} PKR</p>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <StatCard label="Total Revenue" usd={formatUSD(summary.totalRevenue)} pkr={formatPKR(summary.totalRevenuePKR)} color="green" />
                <StatCard label="Total Expenses" usd={formatUSD(summary.totalExpenses)} pkr={formatPKR(summary.totalExpensesPKR)} color="red" />
                <StatCard label="Net Profit" usd={formatUSD(summary.netProfit)} pkr={formatPKR(summary.netProfitPKR)} color={summary.netProfit >= 0 ? 'green' : 'red'} />
                <StatCard label="Your Share (25%)" usd={formatUSD(summary.partnerShare)} pkr={formatPKR(summary.partnerSharePKR)} color="blue" />
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50 mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Calculation Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Ads Revenue</span>
                    <span className="font-mono text-slate-200">{formatUSD(summary.adsRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4">
                    <span>− Invalid Traffic Deduction</span>
                    <span className="font-mono text-red-400">−{formatUSD(summary.invalidDeduction)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subscription Revenue</span>
                    <span className="font-mono text-slate-200">+{formatUSD(summary.subscriptionRev)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-slate-700/50 pt-2 mt-1">
                    <span className="text-slate-300">Total Revenue</span>
                    <span className="font-mono text-green-400">{formatUSD(summary.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4">
                    <span>− Marketing</span>
                    <span className="font-mono text-red-400">−{formatUSD(summary.marketing)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4">
                    <span>− Server Cost</span>
                    <span className="font-mono text-red-400">−{formatUSD(summary.server)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4">
                    <span>− Paid Reviews</span>
                    <span className="font-mono text-red-400">−{formatUSD(summary.reviews)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4">
                    <span>− Tax</span>
                    <span className="font-mono text-red-400">−{formatUSD(summary.tax)}</span>
                  </div>
                  {summary.other > 0 && (
                    <div className="flex justify-between text-slate-500 pl-4">
                      <span>− Other Expenses</span>
                      <span className="font-mono text-red-400">−{formatUSD(summary.other)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between font-bold border-t border-slate-700/50 pt-2 mt-1`}>
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
              </div>

              {data.notes && (
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mb-6">
                  <p className="text-xs text-slate-500 mb-1">Admin Notes</p>
                  <p className="text-slate-300 text-sm">{data.notes}</p>
                </div>
              )}
            </>
          ) : null}

          {/* History Table */}
          {allMonths.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-white mb-4">📅 Your Earnings History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-700/50">
                      <th className="pb-2 font-medium pr-4">Month</th>
                      <th className="pb-2 font-medium pr-4 text-right">Net Profit</th>
                      <th className="pb-2 font-medium pr-4 text-right">Your 25%</th>
                      <th className="pb-2 font-medium text-right">In PKR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMonths.map(m => {
                      const d = allData[m];
                      if (!d) return null;
                      const s = calculateSummary(d);
                      if (!s) return null;
                      return (
                        <tr key={m}
                          onClick={() => setMonth(m)}
                          className={`border-b border-slate-800 hover:bg-slate-800/60 cursor-pointer transition-colors ${m === month ? 'bg-slate-800/60' : ''}`}
                        >
                          <td className="py-2.5 pr-4 font-medium text-slate-300">{getMonthLabel(m)}</td>
                          <td className={`py-2.5 pr-4 text-right font-mono ${s.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(s.netProfit)}</td>
                          <td className="py-2.5 pr-4 text-right text-blue-300 font-mono font-semibold">{formatUSD(s.partnerShare)}</td>
                          <td className="py-2.5 text-right text-slate-500 font-mono">{formatPKR(s.partnerSharePKR)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
