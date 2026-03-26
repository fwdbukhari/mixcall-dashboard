import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ThemeToggle from '../components/ThemeToggle';
import {
  calculateSummary, calculateYearlySummary,
  formatUSD, formatPKR,
  getMonthLabel, getCurrentMonth, getAllMonthsRange, getMonthsByYear,
  stepMonth, EMPTY_MONTH
} from '../lib/calculations';

// Revenue fields — USD only
function InputField({ label, value, onChange, placeholder = '0.00', hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-500 mb-1">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          min="0"
          step="0.01"
          className="w-full pl-7 pr-3 py-2.5 bg-slate-700/60 border border-slate-600/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60 text-sm transition-all"
        />
      </div>
    </div>
  );
}

// Expense fields — USD or PKR with auto-conversion
function ExpenseField({ label, usdValue, onChange, rate }) {
  const [currency, setCurrency] = useState('USD');
  const [rawInput, setRawInput] = useState('');

  // Sync display when external value changes (e.g. loading saved data)
  // Only sync if field is in USD mode and value changed externally
  const [prevUsd, setPrevUsd] = useState(usdValue);
  if (usdValue !== prevUsd && currency === 'USD') {
    setPrevUsd(usdValue);
    setRawInput(usdValue || '');
  }

  function handleCurrencyToggle(newCurrency) {
    if (newCurrency === currency) return;
    // Convert displayed value to the other currency for convenience
    if (newCurrency === 'PKR' && rawInput) {
      const usd = parseFloat(rawInput) || 0;
      setRawInput(usd > 0 ? (usd * rate).toFixed(0) : '');
    } else if (newCurrency === 'USD' && rawInput) {
      const pkr = parseFloat(rawInput) || 0;
      setRawInput(pkr > 0 ? (pkr / rate).toFixed(2) : '');
    }
    setCurrency(newCurrency);
  }

  function handleChange(val) {
    setRawInput(val);
    // Always store as USD regardless of input currency
    if (currency === 'PKR') {
      const pkr = parseFloat(val) || 0;
      onChange(pkr > 0 ? (pkr / rate).toFixed(4) : '');
    } else {
      onChange(val);
    }
  }

  const pkrAmount  = currency === 'PKR' ? (parseFloat(rawInput) || 0) : ((parseFloat(rawInput) || 0) * rate);
  const usdAmount  = currency === 'USD' ? (parseFloat(rawInput) || 0) : ((parseFloat(rawInput) || 0) / rate);
  const showHint   = rawInput && parseFloat(rawInput) > 0;

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <div className="flex gap-1.5">
        {/* Currency toggle */}
        <div className="flex bg-slate-700/80 border border-slate-600/60 rounded-lg overflow-hidden flex-shrink-0">
          <button
            type="button"
            onClick={() => handleCurrencyToggle('USD')}
            className={`px-2 py-2 text-xs font-semibold transition-all ${currency === 'USD' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            $
          </button>
          <button
            type="button"
            onClick={() => handleCurrencyToggle('PKR')}
            className={`px-2 py-2 text-xs font-semibold transition-all ${currency === 'PKR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            ₨
          </button>
        </div>
        {/* Input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
            {currency === 'USD' ? '$' : '₨'}
          </span>
          <input
            type="number"
            value={rawInput}
            onChange={e => handleChange(e.target.value)}
            placeholder={currency === 'USD' ? '0.00' : '0'}
            min="0"
            step={currency === 'USD' ? '0.01' : '1'}
            className="w-full pl-7 pr-3 py-2.5 bg-slate-700/60 border border-slate-600/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60 text-sm transition-all"
          />
        </div>
      </div>
      {/* Conversion hint */}
      {showHint && (
        <p className="text-xs mt-1 ml-0.5">
          {currency === 'PKR' ? (
            <span className="text-violet-400">≈ <strong>${usdAmount.toFixed(2)} USD</strong> saved to report</span>
          ) : (
            <span className="text-emerald-400">≈ <strong>₨ {pkrAmount.toLocaleString('en-PK', {maximumFractionDigits:0})} PKR</strong></span>
          )}
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, usd, pkr, negative, indent }) {
  return (
    <div className={`flex justify-between items-start py-1.5 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm ${negative ? 'text-red-400' : 'text-slate-400'}`}>{label}</span>
      <div className="text-right">
        <div className={`text-sm font-mono ${negative ? 'text-red-400' : 'text-slate-200'}`}>{usd}</div>
        <div className="text-xs text-slate-500 font-mono">{pkr}</div>
      </div>
    </div>
  );
}

function MonthPicker({ month, setMonth, savedMonths }) {
  const [mode, setMode] = useState('quick'); // 'quick' | 'historical'
  const byYear = getMonthsByYear();
  const years = Object.keys(byYear).sort().reverse();
  const allRange = getAllMonthsRange();
  const currentMonth = getCurrentMonth();

  if (mode === 'historical') {
    return (
      <div className="bg-slate-800/90 border border-violet-500/30 rounded-xl p-4 mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-violet-300">📅 Historical Data Entry</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select any month from January 2022 onwards</p>
          </div>
          <button onClick={() => setMode('quick')} className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-700 rounded-lg">← Back</button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {years.map(year => (
            <div key={year}>
              <p className="text-xs text-slate-500 font-semibold mb-1.5 sticky top-0 bg-slate-800/90 py-0.5">{year}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {byYear[year].map(m => {
                  const isSaved = savedMonths.includes(m);
                  const isCurrent = m === currentMonth;
                  const isSelected = m === month;
                  return (
                    <button
                      key={m}
                      onClick={() => { setMonth(m); setMode('quick'); }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                        isSelected
                          ? 'bg-violet-600 text-white'
                          : isSaved
                          ? 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30'
                          : isCurrent
                          ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {new Date(+m.split('-')[0], +m.split('-')[1] - 1, 1).toLocaleDateString('en-US', { month: 'short' })}
                      {isSaved && !isSelected && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full"></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700/50">
          <span className="flex items-center gap-1 text-xs text-green-400"><span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span> Has data</span>
          <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 bg-slate-600 rounded-full inline-block"></span> No data yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-bold text-white">{getMonthLabel(month)}</h2>
        <p className="text-slate-500 text-sm">Monthly Revenue Report</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('historical')}
          className="px-3 py-2 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs rounded-lg hover:bg-violet-500/30 transition-all font-medium"
        >
          📅 All Months (2022–now)
        </button>
        <button onClick={() => setMonth(s => stepMonth(s, -1))}
          className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors text-lg">‹</button>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {getAllMonthsRange().map(m => (
            <option key={m} value={m}>{getMonthLabel(m)}</option>
          ))}
        </select>
        <button onClick={() => setMonth(s => stepMonth(s, 1))}
          disabled={month >= getCurrentMonth()}
          className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors text-lg disabled:opacity-30">›</button>
      </div>
    </div>
  );
}

// Other expense row — also supports PKR/USD
function OtherExpenseRow({ item, rate, onNameChange, onAmountChange, onRemove }) {
  const [currency, setCurrency] = useState('USD');
  const [rawInput, setRawInput] = useState(item.amount || '');

  function handleCurrencyToggle(newCurrency) {
    if (newCurrency === currency) return;
    if (newCurrency === 'PKR' && rawInput) {
      const usd = parseFloat(rawInput) || 0;
      setRawInput(usd > 0 ? (usd * rate).toFixed(0) : '');
    } else if (newCurrency === 'USD' && rawInput) {
      const pkr = parseFloat(rawInput) || 0;
      setRawInput(pkr > 0 ? (pkr / rate).toFixed(2) : '');
    }
    setCurrency(newCurrency);
  }

  function handleAmountChange(val) {
    setRawInput(val);
    if (currency === 'PKR') {
      const pkr = parseFloat(val) || 0;
      onAmountChange(pkr > 0 ? (pkr / rate).toFixed(4) : '');
    } else {
      onAmountChange(val);
    }
  }

  const usdAmount = currency === 'USD' ? (parseFloat(rawInput) || 0) : ((parseFloat(rawInput) || 0) / rate);
  const pkrAmount = currency === 'PKR' ? (parseFloat(rawInput) || 0) : ((parseFloat(rawInput) || 0) * rate);
  const showHint  = rawInput && parseFloat(rawInput) > 0;

  return (
    <div>
      <div className="flex gap-2 items-center">
        <input type="text" placeholder="Description" value={item.name}
          onChange={e => onNameChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-700/60 border border-slate-600/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 text-sm" />
        {/* Currency toggle */}
        <div className="flex bg-slate-700/80 border border-slate-600/60 rounded-lg overflow-hidden flex-shrink-0">
          <button type="button" onClick={() => handleCurrencyToggle('USD')}
            className={`px-2 py-2 text-xs font-semibold transition-all ${currency === 'USD' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>$</button>
          <button type="button" onClick={() => handleCurrencyToggle('PKR')}
            className={`px-2 py-2 text-xs font-semibold transition-all ${currency === 'PKR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>₨</button>
        </div>
        <div className="relative w-28">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{currency === 'USD' ? '$' : '₨'}</span>
          <input type="number" placeholder="0" value={rawInput}
            onChange={e => handleAmountChange(e.target.value)}
            min="0" step={currency === 'USD' ? '0.01' : '1'}
            className="w-full pl-6 pr-2 py-2 bg-slate-700/60 border border-slate-600/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 text-sm" />
        </div>
        <button onClick={onRemove} className="text-red-400 hover:text-red-300 text-lg w-7 flex-shrink-0">×</button>
      </div>
      {showHint && (
        <p className="text-xs mt-1 ml-0.5">
          {currency === 'PKR'
            ? <span className="text-violet-400">≈ <strong>${usdAmount.toFixed(2)} USD</strong> saved to report</span>
            : <span className="text-emerald-400">≈ <strong>₨ {pkrAmount.toLocaleString('en-PK', {maximumFractionDigits:0})} PKR</strong></span>
          }
        </p>
      )}
    </div>
  );
}

// ─── Admin Yearly Card — collapsible month table ────────────────────────────
function AdminYearCard({ year, ys, monthsInYear, allData, month, setMonth, setActiveTab }) {
  const [showMonths, setShowMonths] = useState(true);

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header — always visible, click arrow to toggle months */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">{year}</h3>
            <p className="text-xs text-slate-500">{ys.monthCount} of 12 months recorded</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-bold font-mono ${ys.netProfit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            Net: {formatUSD(ys.netProfit)}
          </div>
        </div>
      </div>

      {/* Summary cards — always visible */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-700/40 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-0.5">Total Revenue</p>
            <p className="text-sm font-bold text-green-400 font-mono">{formatUSD(ys.totalRevenue)}</p>
          </div>
          <div className="bg-slate-700/40 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-0.5">Total Expenses</p>
            <p className="text-sm font-bold text-red-400 font-mono">{formatUSD(ys.totalExpenses)}</p>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
            <p className="text-xs text-violet-400 mb-0.5">Your Share (75%)</p>
            <p className="text-sm font-bold text-violet-300 font-mono">{formatUSD(ys.adminShare)}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-400 mb-0.5">Partner Share (25%)</p>
            <p className="text-sm font-bold text-blue-300 font-mono">{formatUSD(ys.partnerShare)}</p>
          </div>
        </div>

        {/* Collapsible month rows toggle */}
        <button
          onClick={() => setShowMonths(v => !v)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-violet-300 transition-colors mb-2 font-medium"
        >
          <span className={`transition-transform duration-200 ${showMonths ? 'rotate-180' : 'rotate-0'}`}>▾</span>
          {showMonths ? 'Hide monthly breakdown' : `Show ${monthsInYear.length} months`}
        </button>

        {/* Monthly breakdown table */}
        {showMonths && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[380px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700/40">
                  <th className="pb-1.5 text-left font-medium pr-3">Month</th>
                  <th className="pb-1.5 text-right font-medium pr-3 hidden sm:table-cell">Revenue</th>
                  <th className="pb-1.5 text-right font-medium pr-3 hidden sm:table-cell">Expenses</th>
                  <th className="pb-1.5 text-right font-medium pr-3">Net Profit</th>
                  <th className="pb-1.5 text-right font-medium">Partner 25%</th>
                </tr>
              </thead>
              <tbody>
                {monthsInYear.map(m => {
                  const d = allData[m]; if (!d) return null;
                  const s = calculateSummary(d); if (!s) return null;
                  return (
                    <tr key={m} onClick={() => { setMonth(m); setActiveTab('entry'); }}
                      className={`border-b border-slate-800/60 hover:bg-slate-700/30 cursor-pointer transition-colors ${m === month ? 'bg-slate-700/30' : ''}`}>
                      <td className="py-2 pr-3 text-slate-300 whitespace-nowrap">{getMonthLabel(m)}</td>
                      <td className="py-2 pr-3 text-right text-slate-400 font-mono hidden sm:table-cell">{formatUSD(s.totalRevenue)}</td>
                      <td className="py-2 pr-3 text-right text-red-400 font-mono hidden sm:table-cell">{formatUSD(s.totalExpenses)}</td>
                      <td className={`py-2 pr-3 text-right font-mono font-semibold ${s.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(s.netProfit)}</td>
                      <td className="py-2 text-right text-blue-300 font-mono">{formatUSD(s.partnerShare)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [month, setMonth] = useState(getCurrentMonth());
  const [form, setForm] = useState(EMPTY_MONTH);
  const [savedMonths, setSavedMonths] = useState([]);
  const [allData, setAllData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [kvReady, setKvReady] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'yearly'
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setSavedMonths(d.months || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true); setSaved(false);
    fetch(`/api/data/${month}`).then(r => r.json()).then(d => {
      if (d.data) setForm({ ...EMPTY_MONTH, ...d.data, expenses: { ...EMPTY_MONTH.expenses, ...d.data.expenses } });
      else setForm({ ...EMPTY_MONTH });
      setKvReady(d.kvReady !== false);
    }).catch(() => setForm({ ...EMPTY_MONTH })).finally(() => setLoading(false));
  }, [month]);

  useEffect(() => {
    if (savedMonths.length === 0) return;
    Promise.all(savedMonths.map(m =>
      fetch(`/api/data/${m}`).then(r => r.json()).then(d => [m, d.data])
    )).then(entries => {
      setAllData(Object.fromEntries(entries.filter(([, d]) => d)));
    });
  }, [savedMonths]);

  const summary = useMemo(() => calculateSummary(form), [form]);

  // Yearly data grouped
  const years = useMemo(() => {
    const ys = [...new Set(savedMonths.map(m => m.split('-')[0]))].sort().reverse();
    return ys;
  }, [savedMonths]);

  function setRevenue(field, val) { setForm(f => ({ ...f, revenue: { ...f.revenue, [field]: val } })); setSaved(false); }
  function setExpense(field, val) { setForm(f => ({ ...f, expenses: { ...f.expenses, [field]: val } })); setSaved(false); }
  function addOtherExpense() {
    setForm(f => ({ ...f, expenses: { ...f.expenses, otherExpenses: [...(f.expenses.otherExpenses || []), { name: '', amount: '' }] } }));
  }
  function updateOtherExpense(i, field, val) {
    setForm(f => { const arr = [...(f.expenses.otherExpenses || [])]; arr[i] = { ...arr[i], [field]: val }; return { ...f, expenses: { ...f.expenses, otherExpenses: arr } }; });
    setSaved(false);
  }
  function removeOtherExpense(i) {
    setForm(f => { const arr = [...(f.expenses.otherExpenses || [])]; arr.splice(i, 1); return { ...f, expenses: { ...f.expenses, otherExpenses: arr } }; });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/data/${month}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      setKvReady(d.kvReady !== false);
      setSaved(true);
      setSavedMonths(prev => {
        if (prev.includes(month)) return prev;
        return [month, ...prev].sort().reverse();
      });
      setAllData(prev => ({ ...prev, [month]: d.data }));
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <>
      <Head><title>MixCall Admin Dashboard</title></Head>
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-base sm:text-lg shadow-lg shadow-violet-500/30">📞</div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white leading-none">MixCall</h1>
                <p className="text-xs text-slate-400 leading-none mt-0.5 hidden xs:block">Revenue Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Tab switcher — desktop */}
              <div className="hidden sm:flex bg-slate-700/60 rounded-lg p-1 gap-1">
                <button onClick={() => setActiveTab('entry')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'entry' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  📝 Data Entry
                </button>
                <button onClick={() => setActiveTab('yearly')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'yearly' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  📊 Yearly View
                </button>
              </div>
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-violet-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>Admin
              </span>
              <ThemeToggle />
              <button onClick={logout} className="px-2 sm:px-3 py-1.5 text-slate-400 hover:text-white text-xs sm:text-sm transition-colors">Out</button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {!kvReady && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4 flex gap-3 items-start">
              <span className="text-amber-400 mt-0.5">⚠️</span>
              <p className="text-amber-300 text-sm">Data storage not connected. Go to Vercel Dashboard → Storage → Connect Upstash KV to this project.</p>
            </div>
          )}

          {/* Mobile tab switcher */}
          <div className="flex sm:hidden bg-slate-700/60 rounded-lg p-1 gap-1 mb-4">
            <button onClick={() => setActiveTab('entry')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'entry' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>📝 Data Entry</button>
            <button onClick={() => setActiveTab('yearly')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'yearly' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>📊 Yearly View</button>
          </div>

          {/* ===== DATA ENTRY TAB ===== */}
          {activeTab === 'entry' && (
            <>
              <MonthPicker month={month} setMonth={setMonth} savedMonths={savedMonths} />

              {loading ? (
                <div className="text-center py-16 text-slate-500">Loading…</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* LEFT: Form */}
                  <div className="xl:col-span-2 space-y-5">
                    {/* Exchange Rate */}
                    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><span>💱</span> Exchange Rate</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">USD → PKR Rate</label>
                          <input type="number" value={form.exchangeRate}
                            onChange={e => { setForm(f => ({ ...f, exchangeRate: e.target.value })); setSaved(false); }}
                            placeholder="280"
                            className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <p className="text-slate-400 text-sm pb-2.5">1 USD = <span className="text-violet-300 font-semibold">{form.exchangeRate || '280'}</span> PKR</p>
                        </div>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-green-500/20 flex items-center justify-center text-xs">💰</span> Revenue (USD)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Gross Ads Revenue" value={form.revenue.adsRevenue} onChange={v => setRevenue('adsRevenue', v)} hint="Total AdMob / ad earnings before deductions" />
                        <InputField label="Invalid Traffic Deduction" value={form.revenue.invalidTrafficDeduction} onChange={v => setRevenue('invalidTrafficDeduction', v)} hint="Amount deducted by ad network" />
                        <InputField label="Subscription Revenue" value={form.revenue.subscriptionRevenue} onChange={v => setRevenue('subscriptionRevenue', v)} hint="Google Play subscription earnings" />
                      </div>
                    </div>

                    {/* Expenses */}
                    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><span className="w-5 h-5 rounded-md bg-red-500/20 flex items-center justify-center text-xs">📤</span> Expenses</h3>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-md">$ USD</span>
                          <span className="inline-flex items-center gap-1 bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-md">₨ PKR</span>
                          <span className="text-slate-600 ml-1">→ auto-converts to USD</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ExpenseField label="Marketing Spend" usdValue={form.expenses.marketingSpend} onChange={v => setExpense('marketingSpend', v)} rate={parseFloat(form.exchangeRate) || 280} />
                        <ExpenseField label="Server Cost"     usdValue={form.expenses.serverCost}     onChange={v => setExpense('serverCost', v)}     rate={parseFloat(form.exchangeRate) || 280} />
                        <ExpenseField label="Paid Reviews"    usdValue={form.expenses.paidReviews}    onChange={v => setExpense('paidReviews', v)}    rate={parseFloat(form.exchangeRate) || 280} />
                        <ExpenseField label="Tax"             usdValue={form.expenses.tax}             onChange={v => setExpense('tax', v)}             rate={parseFloat(form.exchangeRate) || 280} />
                      </div>
                      {(form.expenses.otherExpenses || []).length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs text-slate-500 font-medium">Other Expenses</p>
                          {(form.expenses.otherExpenses || []).map((item, i) => (
                            <OtherExpenseRow
                              key={i}
                              item={item}
                              rate={parseFloat(form.exchangeRate) || 280}
                              onNameChange={v => updateOtherExpense(i, 'name', v)}
                              onAmountChange={v => updateOtherExpense(i, 'amount', v)}
                              onRemove={() => removeOtherExpense(i)}
                            />
                          ))}
                        </div>
                      )}
                      <button onClick={addOtherExpense} className="mt-4 text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                        <span className="text-lg leading-none">+</span> Add Other Expense
                      </button>
                    </div>

                    {/* Notes */}
                    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-300 mb-3">Notes (optional)</h3>
                      <textarea value={form.notes} onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setSaved(false); }}
                        placeholder="Any notes for this month..." rows={3}
                        className="w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/60 text-sm resize-none" />
                    </div>

                    <button onClick={handleSave} disabled={saving}
                      className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20 text-base">
                      {saving ? 'Saving…' : saved ? '✓ Saved!' : savedMonths.includes(month) ? `Update ${getMonthLabel(month)} Data` : `Save ${getMonthLabel(month)} Data`}
                    </button>
                  </div>

                  {/* RIGHT: Summary */}
                  <div className="space-y-5">
                    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50 sticky top-20">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <span>📊</span> Live Summary
                        <span className="ml-auto text-xs text-slate-500 font-normal">Auto-calculated</span>
                      </h3>
                      {summary && (
                        <>
                          <div className="space-y-0.5 border-b border-slate-700/50 pb-3 mb-3">
                            <p className="text-xs text-slate-500 font-medium mb-1.5">REVENUE</p>
                            <SummaryRow label="Gross Ads Revenue" usd={formatUSD(summary.adsRevenue)} pkr={formatPKR(summary.adsRevenue * summary.rate)} />
                            <SummaryRow label="(-) Invalid Traffic" usd={formatUSD(summary.invalidDeduction)} pkr={formatPKR(summary.invalidDeduction * summary.rate)} negative indent />
                            <SummaryRow label="Net Ads Revenue" usd={formatUSD(summary.netAdsRevenue)} pkr={formatPKR(summary.netAdsRevenue * summary.rate)} />
                            <SummaryRow label="Subscription Revenue" usd={formatUSD(summary.subscriptionRev)} pkr={formatPKR(summary.subscriptionRev * summary.rate)} />
                            <div className="border-t border-slate-700/50 mt-1.5 pt-1.5">
                              <SummaryRow label="Total Revenue" usd={formatUSD(summary.totalRevenue)} pkr={formatPKR(summary.totalRevenuePKR)} />
                            </div>
                          </div>
                          <div className="space-y-0.5 border-b border-slate-700/50 pb-3 mb-3">
                            <p className="text-xs text-slate-500 font-medium mb-1.5">EXPENSES</p>
                            <SummaryRow label="Marketing" usd={formatUSD(summary.marketing)} pkr={formatPKR(summary.marketing * summary.rate)} negative />
                            <SummaryRow label="Server Cost" usd={formatUSD(summary.server)} pkr={formatPKR(summary.server * summary.rate)} negative />
                            <SummaryRow label="Paid Reviews" usd={formatUSD(summary.reviews)} pkr={formatPKR(summary.reviews * summary.rate)} negative />
                            <SummaryRow label="Tax" usd={formatUSD(summary.tax)} pkr={formatPKR(summary.tax * summary.rate)} negative />
                            {summary.other > 0 && <SummaryRow label="Other" usd={formatUSD(summary.other)} pkr={formatPKR(summary.other * summary.rate)} negative />}
                            <div className="border-t border-slate-700/50 mt-1.5 pt-1.5">
                              <SummaryRow label="Total Expenses" usd={formatUSD(summary.totalExpenses)} pkr={formatPKR(summary.totalExpensesPKR)} negative />
                            </div>
                          </div>
                          <div className={`rounded-lg p-3 mb-3 ${summary.netProfit >= 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            <p className="text-xs text-slate-400 mb-0.5">Net Profit</p>
                            <p className={`text-xl font-bold font-mono ${summary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(summary.netProfit)}</p>
                            <p className="text-xs text-slate-500 font-mono">{formatPKR(summary.netProfitPKR)}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                              <p className="text-xs text-violet-400 mb-0.5">Your Share (75%)</p>
                              <p className="text-base font-bold text-violet-300 font-mono">{formatUSD(summary.adminShare)}</p>
                              <p className="text-xs text-slate-500 font-mono">{formatPKR(summary.adminSharePKR)}</p>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                              <p className="text-xs text-blue-400 mb-0.5">Partner (25%)</p>
                              <p className="text-base font-bold text-blue-300 font-mono">{formatUSD(summary.partnerShare)}</p>
                              <p className="text-xs text-slate-500 font-mono">{formatPKR(summary.partnerSharePKR)}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly History Table */}
              {savedMonths.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">📅 Monthly History ({savedMonths.length} months saved)</h3>
                    {savedMonths.length > 5 && (
                      <button
                        onClick={() => setShowAllHistory(v => !v)}
                        className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg"
                      >
                        {showAllHistory ? '▲ Show Less' : `See All ${savedMonths.length} months`}
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                    <table className="w-full text-sm min-w-[420px]">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-700/50">
                          <th className="pb-2 font-medium pr-3">Month</th>
                          <th className="pb-2 font-medium pr-3 text-right hidden sm:table-cell">Revenue</th>
                          <th className="pb-2 font-medium pr-3 text-right hidden sm:table-cell">Expenses</th>
                          <th className="pb-2 font-medium pr-3 text-right">Net Profit</th>
                          <th className="pb-2 font-medium pr-3 text-right">Your 75%</th>
                          <th className="pb-2 font-medium text-right">Partner 25%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllHistory ? savedMonths : savedMonths.slice(0, 5)).map(m => {
                          const d = allData[m]; if (!d) return null;
                          const s = calculateSummary(d); if (!s) return null;
                          return (
                            <tr key={m} onClick={() => { setMonth(m); setActiveTab('entry'); }}
                              className={`border-b border-slate-800 hover:bg-slate-800/60 cursor-pointer transition-colors ${m === month && activeTab === 'entry' ? 'bg-slate-800/60' : ''}`}>
                              <td className="py-2.5 pr-3 font-medium text-slate-300 whitespace-nowrap">{getMonthLabel(m)}</td>
                              <td className="py-2.5 pr-3 text-right text-slate-300 font-mono hidden sm:table-cell">{formatUSD(s.totalRevenue)}</td>
                              <td className="py-2.5 pr-3 text-right text-red-400 font-mono hidden sm:table-cell">{formatUSD(s.totalExpenses)}</td>
                              <td className={`py-2.5 pr-3 text-right font-mono font-semibold ${s.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatUSD(s.netProfit)}</td>
                              <td className="py-2.5 pr-3 text-right text-violet-300 font-mono">{formatUSD(s.adminShare)}</td>
                              <td className="py-2.5 text-right text-blue-300 font-mono">{formatUSD(s.partnerShare)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {savedMonths.length > 5 && !showAllHistory && (
                    <button
                      onClick={() => setShowAllHistory(true)}
                      className="mt-3 w-full py-2 text-xs text-slate-400 hover:text-violet-300 border border-slate-700/50 rounded-lg hover:border-violet-500/30 transition-all"
                    >
                      + {savedMonths.length - 5} more months — click to see all
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ===== YEARLY VIEW TAB ===== */}
          {activeTab === 'yearly' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Yearly Overview</h2>
                <p className="text-slate-500 text-sm">Annual totals from all saved monthly data</p>
              </div>
              {years.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-slate-400">No data saved yet. Start by entering monthly data.</p>
                </div>
              ) : (
                years.map(year => {
                  const ys = calculateYearlySummary(year, allData);
                  if (!ys) return null;
                  const monthsInYear = savedMonths.filter(m => m.startsWith(year));
                  return (
                    <AdminYearCard
                      key={year}
                      year={year}
                      ys={ys}
                      monthsInYear={monthsInYear}
                      allData={allData}
                      month={month}
                      setMonth={setMonth}
                      setActiveTab={setActiveTab}
                    />
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
