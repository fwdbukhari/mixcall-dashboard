import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ThemeToggle from '../components/ThemeToggle';
import {
  calculateSummary, calculateYearlySummary,
  formatUSD, formatPKR,
  getMonthLabel, getCurrentMonth, getAllMonthsRange, getMonthsByYear,
  stepMonth
} from '../lib/calculations';

// ─── Pure SVG Chart ────────────────────────────────────────────────────────────
function RevenueChart({ years, allData, type }) {
  const data = useMemo(() => years.map(year => {
    const ys = calculateYearlySummary(year, allData);
    return { year, revenue: ys?.totalRevenue||0, expenses: ys?.totalExpenses||0, netProfit: ys?.netProfit||0, partnerShare: ys?.partnerShare||0 };
  }).reverse(), [years, allData]);

  if (data.length === 0) return null;
  const W=600,H=260,PAD={top:20,right:20,bottom:40,left:70};
  const chartW=W-PAD.left-PAD.right, chartH=H-PAD.top-PAD.bottom;
  const allVals=data.flatMap(d=>[d.revenue,d.expenses,d.partnerShare]);
  const maxVal=Math.max(...allVals,1);
  const yScale=v=>chartH-(v/maxVal)*chartH;
  const xStep=chartW/data.length;
  const xPos=i=>PAD.left+i*xStep+xStep/2;
  const ticks=4;
  const yTicks=Array.from({length:ticks+1},(_,i)=>(maxVal/ticks)*i);
  const series=[{key:'revenue',color:'#34d399',label:'Revenue'},{key:'expenses',color:'#f87171',label:'Expenses'},{key:'partnerShare',color:'#60a5fa',label:'Your 25%'}];

  if (type==='bar') {
    const bw=Math.max(8,xStep/4-2);
    const offsets=[-bw-2,0,bw+2];
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{maxHeight:260}}>
        {yTicks.map((v,i)=>(
          <g key={i}>
            <line x1={PAD.left} y1={PAD.top+yScale(v)} x2={W-PAD.right} y2={PAD.top+yScale(v)} stroke="#334155" strokeWidth="1" strokeDasharray="4,3"/>
            <text x={PAD.left-6} y={PAD.top+yScale(v)+4} textAnchor="end" fontSize="9" fill="#64748b">${v>=1000?(v/1000).toFixed(0)+'k':v.toFixed(0)}</text>
          </g>
        ))}
        {data.map((d,i)=>(
          <g key={d.year}>
            {series.map((s,si)=>{
              const bh=Math.max(1,(d[s.key]/maxVal)*chartH);
              return <rect key={s.key} x={xPos(i)+offsets[si]-bw/2} y={PAD.top+yScale(d[s.key])} width={bw} height={bh} fill={s.color} opacity="0.85" rx="2"><title>{s.label}: {formatUSD(d[s.key])}</title></rect>;
            })}
            <text x={xPos(i)} y={H-8} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.year}</text>
          </g>
        ))}
        {series.map((s,i)=>(
          <g key={s.key} transform={`translate(${PAD.left+i*110},${H-2})`}>
            <rect x="0" y="-10" width="10" height="10" fill={s.color} rx="2" opacity="0.85"/>
            <text x="14" y="-1" fontSize="9" fill="#94a3b8">{s.label}</text>
          </g>
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{maxHeight:260}}>
      {yTicks.map((v,i)=>(
        <g key={i}>
          <line x1={PAD.left} y1={PAD.top+yScale(v)} x2={W-PAD.right} y2={PAD.top+yScale(v)} stroke="#334155" strokeWidth="1" strokeDasharray="4,3"/>
          <text x={PAD.left-6} y={PAD.top+yScale(v)+4} textAnchor="end" fontSize="9" fill="#64748b">${v>=1000?(v/1000).toFixed(0)+'k':v.toFixed(0)}</text>
        </g>
      ))}
      {series.map(s=>{
        const pts=data.map((d,i)=>`${xPos(i)},${PAD.top+yScale(d[s.key])}`).join(' ');
        return (
          <g key={s.key}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9"/>
            {data.map((d,i)=><circle key={i} cx={xPos(i)} cy={PAD.top+yScale(d[s.key])} r="4" fill={s.color} opacity="0.9"><title>{formatUSD(d[s.key])}</title></circle>)}
          </g>
        );
      })}
      {data.map((d,i)=><text key={d.year} x={xPos(i)} y={H-8} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.year}</text>)}
      {series.map((s,i)=>(
        <g key={s.key} transform={`translate(${PAD.left+i*110},${H-2})`}>
          <rect x="0" y="-10" width="10" height="10" fill={s.color} rx="2" opacity="0.85"/>
          <text x="14" y="-1" fontSize="9" fill="#94a3b8">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Collapsible wrapper ────────────────────────────────────────────────────────
function Collapsible({ title, defaultOpen=true, children, action }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors">
        <button onClick={()=>setOpen(v=>!v)} className="flex items-center gap-2 flex-1 text-left">
          <span className={`text-slate-400 text-base transition-transform duration-200 ${open?'rotate-180':'rotate-0'}`}>▾</span>
          <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        </button>
        {action && <div onClick={e=>e.stopPropagation()}>{action}</div>}
      </div>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, usd, pkr, color='blue' }) {
  const map={blue:'bg-blue-500/10 border-blue-500/20 text-blue-300',green:'bg-green-500/10 border-green-500/20 text-green-300',red:'bg-red-500/10 border-red-500/20 text-red-400',violet:'bg-violet-500/10 border-violet-500/20 text-violet-300'};
  const txt=map[color].split(' ').find(c=>c.startsWith('text-'));
  return (
    <div className={`rounded-xl p-4 border ${map[color]}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${txt}`}>{usd}</p>
      <p className="text-sm text-slate-500 font-mono mt-0.5">{pkr}</p>
    </div>
  );
}

// ─── Download helpers ───────────────────────────────────────────────────────────
function downloadCSV(rows, filename) {
  const header = ['Month','Gross Ads Revenue','Invalid Deduction','Net Ads Revenue','Subscription Revenue','Total Revenue','Marketing','Server Cost','Paid Reviews','Tax','Other Expenses','Total Expenses','Net Profit','Your Share 25% (USD)','Your Share 25% (PKR)','Exchange Rate'];
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function buildRows(months, allData) {
  return months.map(m => {
    const d = allData[m]; if (!d) return null;
    const s = calculateSummary(d); if (!s) return null;
    return [
      getMonthLabel(m),
      s.adsRevenue.toFixed(2), s.invalidDeduction.toFixed(2), s.netAdsRevenue.toFixed(2),
      s.subscriptionRev.toFixed(2), s.totalRevenue.toFixed(2),
      s.marketing.toFixed(2), s.server.toFixed(2), s.reviews.toFixed(2), s.tax.toFixed(2), s.other.toFixed(2),
      s.totalExpenses.toFixed(2), s.netProfit.toFixed(2),
      s.partnerShare.toFixed(2), Math.round(s.partnerSharePKR),
      s.rate,
    ];
  }).filter(Boolean);
}

function downloadPDF(months, allData, title) {
  const rows = buildRows(months, allData);
  const styles = `
    body{font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
    h1{color:#a78bfa;font-size:20px;margin-bottom:4px}
    p{color:#64748b;font-size:12px;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#1e293b;color:#94a3b8;padding:8px 10px;text-align:left;border-bottom:1px solid #334155;white-space:nowrap}
    td{padding:7px 10px;border-bottom:1px solid #1e293b;color:#e2e8f0}
    tr:nth-child(even) td{background:#0f172a}
    .pos{color:#34d399} .neg{color:#f87171} .blue{color:#60a5fa;font-weight:bold}
    .footer{margin-top:20px;font-size:10px;color:#475569;text-align:center}
  `;
  const cols = ['Month','Ads Rev','Invalid','Net Ads','Subs Rev','Total Rev','Marketing','Server','Reviews','Tax','Other','Total Exp','Net Profit','Your 25% (USD)','Your 25% (PKR)','Rate'];
  const tableRows = rows.map(r => {
    const profit = parseFloat(r[12]);
    const share  = parseFloat(r[13]);
    return `<tr>
      <td>${r[0]}</td><td>$${r[1]}</td><td>-$${r[2]}</td><td>$${r[3]}</td>
      <td>$${r[4]}</td><td>$${r[5]}</td><td>-$${r[6]}</td><td>-$${r[7]}</td>
      <td>-$${r[8]}</td><td>-$${r[9]}</td><td>-$${r[10]}</td><td>-$${r[11]}</td>
      <td class="${profit>=0?'pos':'neg'}">$${r[12]}</td>
      <td class="blue">$${r[13]}</td><td class="blue">₨${Number(r[14]).toLocaleString()}</td>
      <td>${r[15]}</td>
    </tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${styles}</style></head>
  <body>
    <h1>📞 MixCall — ${title}</h1>
    <p>Partner Revenue Report (25% Share) • Generated ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
    <table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer">Confidential • MixCall Revenue Dashboard • Partner Portal</div>
  </body></html>`;
  const w = window.open('','_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(()=>{ w.print(); }, 400);
}

// ─── Download Button ────────────────────────────────────────────────────────────
function DownloadButtons({ months, allData, label }) {
  const [open, setOpen] = useState(false);
  const rows = buildRows(months, allData);
  if (rows.length === 0) return null;
  return (
    <div className="relative">
      <button onClick={()=>setOpen(v=>!v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-all">
        ⬇ Download {open ? '▴' : '▾'}
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 w-40 overflow-hidden">
          <button onClick={()=>{ downloadCSV(rows,`MixCall_${label}.csv`); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors border-b border-slate-700">
            <span>📄</span> CSV File
          </button>
          <button onClick={()=>{ downloadPDF(months,allData,label); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            <span>🖨️</span> PDF / Print
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function PartnerDashboard() {
  const router = useRouter();
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState(null);
  const [savedMonths, setSavedMonths] = useState([]);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly');
  const [chartType, setChartType] = useState('bar');
  const [showHistorical, setShowHistorical] = useState(false);

  useEffect(()=>{
    fetch('/api/data').then(r=>r.json()).then(d=>{
      const months=d.months||[];
      setSavedMonths(months);
      if(months.length>0&&!months.includes(month)) setMonth(months[0]);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    setLoading(true);
    fetch(`/api/data/${month}`).then(r=>r.json()).then(d=>setData(d.data||null)).catch(()=>setData(null)).finally(()=>setLoading(false));
  },[month]);

  useEffect(()=>{
    if(savedMonths.length===0) return;
    Promise.all(savedMonths.map(m=>fetch(`/api/data/${m}`).then(r=>r.json()).then(d=>[m,d.data])))
      .then(entries=>setAllData(Object.fromEntries(entries.filter(([,d])=>d))));
  },[savedMonths]);

  const summary = useMemo(()=>calculateSummary(data),[data]);
  const years = useMemo(()=>[...new Set(savedMonths.map(m=>m.split('-')[0]))].sort().reverse(),[savedMonths]);
  const byYear = getMonthsByYear();

  async function logout(){
    await fetch('/api/auth/logout',{method:'POST'});
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
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex bg-slate-700/60 rounded-lg p-1 gap-1">
                <button onClick={()=>setActiveTab('monthly')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab==='monthly'?'bg-blue-600 text-white shadow':'text-slate-400 hover:text-white'}`}>📅 Monthly</button>
                <button onClick={()=>setActiveTab('yearly')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab==='yearly'?'bg-blue-600 text-white shadow':'text-slate-400 hover:text-white'}`}>📊 Yearly</button>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>Partner · 25%
              </span>
              <ThemeToggle />
              <button onClick={logout} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors">Sign Out</button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Mobile tabs */}
          <div className="flex sm:hidden bg-slate-700/60 rounded-lg p-1 gap-1 mb-5">
            <button onClick={()=>setActiveTab('monthly')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab==='monthly'?'bg-blue-600 text-white':'text-slate-400'}`}>📅 Monthly</button>
            <button onClick={()=>setActiveTab('yearly')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab==='yearly'?'bg-blue-600 text-white':'text-slate-400'}`}>📊 Yearly</button>
          </div>

          {/* ═══════════════════════════════════
              MONTHLY TAB
          ═══════════════════════════════════ */}
          {activeTab==='monthly' && (
            <>
              {/* Month navigator */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{getMonthLabel(month)}</h2>
                  <p className="text-slate-500 text-sm">Your revenue share for this period</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setShowHistorical(v=>!v)}
                    className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-lg hover:bg-blue-500/30 transition-all font-medium">
                    📅 {showHistorical?'Hide':'All Months'}
                  </button>
                  <button onClick={()=>setMonth(s=>stepMonth(s,-1))} className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors">‹</button>
                  <select value={month} onChange={e=>setMonth(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {getAllMonthsRange().map(m=><option key={m} value={m}>{getMonthLabel(m)}</option>)}
                  </select>
                  <button onClick={()=>setMonth(s=>stepMonth(s,1))} disabled={month>=getCurrentMonth()}
                    className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors disabled:opacity-30">›</button>
                </div>
              </div>

              {/* Historical picker */}
              {showHistorical && (
                <div className="bg-slate-800/90 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <p className="text-xs text-blue-300 font-semibold mb-3">📅 Select Any Month</p>
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {Object.keys(byYear).sort().reverse().map(year=>(
                      <div key={year}>
                        <p className="text-xs text-slate-500 font-semibold mb-1.5 sticky top-0 bg-slate-800/90 py-0.5">{year}</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {byYear[year].map(m=>{
                            const isSaved=savedMonths.includes(m);
                            return (
                              <button key={m} onClick={()=>{setMonth(m);setShowHistorical(false);}}
                                disabled={!isSaved&&m!==month}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${m===month?'bg-blue-600 text-white':isSaved?'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30':'bg-slate-700/50 text-slate-600 cursor-default'}`}>
                                {new Date(+m.split('-')[0],+m.split('-')[1]-1,1).toLocaleDateString('en-US',{month:'short'})}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700/50">
                    <span className="flex items-center gap-1 text-xs text-green-400"><span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>Has data</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 bg-slate-600 rounded-full inline-block"></span>No data</span>
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
                  {/* Hero */}
                  <div className={`rounded-2xl p-6 border mb-5 ${summary.partnerShare>=0?'bg-blue-500/10 border-blue-500/20':'bg-red-500/10 border-red-500/20'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-blue-400 text-sm font-medium mb-1">Your Share — 25% of Net Profit</p>
                        <p className={`text-4xl font-bold font-mono mb-1 ${summary.partnerShare>=0?'text-blue-300':'text-red-400'}`}>{formatUSD(summary.partnerShare)}</p>
                        <p className="text-xl text-slate-400 font-mono">{formatPKR(summary.partnerSharePKR)}</p>
                        <p className="text-slate-500 text-xs mt-2">Rate: 1 USD = {summary.rate} PKR</p>
                      </div>
                      <DownloadButtons months={[month]} allData={allData} label={getMonthLabel(month).replace(' ','_')} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <StatCard label="Total Revenue"    usd={formatUSD(summary.totalRevenue)}   pkr={formatPKR(summary.totalRevenuePKR)}   color="green"/>
                    <StatCard label="Total Expenses"   usd={formatUSD(summary.totalExpenses)}  pkr={formatPKR(summary.totalExpensesPKR)}  color="red"/>
                    <StatCard label="Net Profit"       usd={formatUSD(summary.netProfit)}      pkr={formatPKR(summary.netProfitPKR)}      color={summary.netProfit>=0?'green':'red'}/>
                    <StatCard label="Your Share (25%)" usd={formatUSD(summary.partnerShare)}   pkr={formatPKR(summary.partnerSharePKR)}   color="blue"/>
                  </div>

                  {/* Collapsible breakdown */}
                  <Collapsible title="📋 Calculation Breakdown" defaultOpen={true}>
                    <div className="space-y-2 text-sm">
                      {[
                        {label:'Gross Ads Revenue',          val:formatUSD(summary.adsRevenue),          color:'text-slate-200',indent:false},
                        {label:'− Invalid Traffic Deduction',val:`−${formatUSD(summary.invalidDeduction)}`,color:'text-red-400',indent:true},
                        {label:'Subscription Revenue',       val:`+${formatUSD(summary.subscriptionRev)}`,color:'text-slate-200',indent:false},
                      ].map(r=>(
                        <div key={r.label} className={`flex justify-between ${r.indent?'pl-4':''}`}>
                          <span className="text-slate-400">{r.label}</span>
                          <span className={`font-mono ${r.color}`}>{r.val}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-medium border-t border-slate-700/50 pt-2 mt-1">
                        <span className="text-slate-300">Total Revenue</span>
                        <span className="font-mono text-green-400">{formatUSD(summary.totalRevenue)}</span>
                      </div>
                      {[
                        {label:'− Marketing',    val:summary.marketing},
                        {label:'− Server Cost',  val:summary.server},
                        {label:'− Paid Reviews', val:summary.reviews},
                        {label:'− Tax',          val:summary.tax},
                        ...(summary.other>0?[{label:'− Other',val:summary.other}]:[]),
                      ].map(r=>(
                        <div key={r.label} className="flex justify-between pl-4">
                          <span className="text-slate-500">{r.label}</span>
                          <span className="font-mono text-red-400">−{formatUSD(r.val)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold border-t border-slate-700/50 pt-2 mt-1">
                        <span className="text-white">Net Profit</span>
                        <span className={`font-mono ${summary.netProfit>=0?'text-green-400':'text-red-400'}`}>{formatUSD(summary.netProfit)}</span>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
                        <div className="flex justify-between">
                          <span className="text-blue-300 font-semibold">Your Share (25%)</span>
                          <span className="font-mono text-blue-300 font-bold">{formatUSD(summary.partnerShare)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-xs mt-0.5">
                          <span>In PKR</span><span className="font-mono">{formatPKR(summary.partnerSharePKR)}</span>
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

              {/* Earnings History */}
              {savedMonths.length>0 && (
                <Collapsible title="📅 Your Earnings History" defaultOpen={true}
                  action={<DownloadButtons months={savedMonths} allData={allData} label="All_Months"/>}>
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
                        {savedMonths.map(m=>{
                          const d=allData[m]; if(!d) return null;
                          const s=calculateSummary(d); if(!s) return null;
                          return (
                            <tr key={m} onClick={()=>setMonth(m)}
                              className={`border-b border-slate-800 hover:bg-slate-700/30 cursor-pointer transition-colors ${m===month?'bg-slate-700/40':''}`}>
                              <td className="py-2.5 px-2 font-medium text-slate-300">{getMonthLabel(m)}</td>
                              <td className={`py-2.5 px-2 text-right font-mono ${s.netProfit>=0?'text-green-400':'text-red-400'}`}>{formatUSD(s.netProfit)}</td>
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

          {/* ═══════════════════════════════════
              YEARLY TAB
          ═══════════════════════════════════ */}
          {activeTab==='yearly' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Your Yearly Earnings</h2>
                  <p className="text-slate-500 text-sm">Annual totals of your 25% profit share</p>
                </div>
                {savedMonths.length>0 && <DownloadButtons months={savedMonths} allData={allData} label="Yearly_Report"/>}
              </div>

              {years.length===0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-slate-400">No data available yet.</p>
                </div>
              ) : (
                <>
                  {/* ── Collapsible Revenue Overview Chart ── */}
                  <Collapsible title="📈 Revenue Overview" defaultOpen={true}
                    action={
                      <div className="flex bg-slate-700/60 rounded-lg p-1 gap-1">
                        <button onClick={()=>setChartType('bar')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${chartType==='bar'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}`}>▊▊ Bar</button>
                        <button onClick={()=>setChartType('line')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${chartType==='line'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}`}>╱ Line</button>
                      </div>
                    }>
                    <p className="text-xs text-slate-500 mb-4">Revenue vs Expenses vs Your 25% — all years</p>
                    <RevenueChart years={years} allData={allData} type={chartType}/>
                  </Collapsible>

                  {/* ── Per-year cards ── */}
                  {years.map(year=>{
                    const ys=calculateYearlySummary(year,allData); if(!ys) return null;
                    const monthsInYear=savedMonths.filter(m=>m.startsWith(year));
                    return (
                      <div key={year} className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                        {/* Year header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
                          <div>
                            <h3 className="text-lg font-bold text-white">{year}</h3>
                            <p className="text-xs text-slate-500">{ys.monthCount} months recorded</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <DownloadButtons months={monthsInYear} allData={allData} label={`${year}_Report`}/>
                            <div className="bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-xl text-right">
                              <p className="text-blue-300 font-bold font-mono text-base">{formatUSD(ys.partnerShare)}</p>
                              <p className="text-blue-400 text-xs">your 25% share</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          {/* Summary cards */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-700/40 rounded-lg p-3">
                              <p className="text-xs text-slate-500 mb-0.5">Net Profit</p>
                              <p className={`text-sm font-bold font-mono ${ys.netProfit>=0?'text-green-400':'text-red-400'}`}>{formatUSD(ys.netProfit)}</p>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                              <p className="text-xs text-blue-400 mb-0.5">Your 25% (USD)</p>
                              <p className="text-sm font-bold text-blue-300 font-mono">{formatUSD(ys.partnerShare)}</p>
                            </div>
                            <div className="bg-slate-700/40 rounded-lg p-3">
                              <p className="text-xs text-slate-500 mb-0.5">Approx. PKR</p>
                              <p className="text-sm font-bold text-slate-300 font-mono">{formatPKR(ys.partnerShare*280)}</p>
                            </div>
                          </div>

                          {/* ── Collapsible Calculation Breakdown (yearly totals) ── */}
                          <Collapsible title="📋 Calculation Breakdown" defaultOpen={false}>
                            <div className="space-y-2 text-sm">
                              {(()=>{
                                const totals=monthsInYear.reduce((acc,m)=>{
                                  const d=allData[m]; if(!d) return acc;
                                  const s=calculateSummary(d); if(!s) return acc;
                                  return {
                                    adsRevenue: acc.adsRevenue+s.adsRevenue,
                                    invalidDeduction: acc.invalidDeduction+s.invalidDeduction,
                                    subscriptionRev: acc.subscriptionRev+s.subscriptionRev,
                                    totalRevenue: acc.totalRevenue+s.totalRevenue,
                                    marketing: acc.marketing+s.marketing,
                                    server: acc.server+s.server,
                                    reviews: acc.reviews+s.reviews,
                                    tax: acc.tax+s.tax,
                                    other: acc.other+s.other,
                                    totalExpenses: acc.totalExpenses+s.totalExpenses,
                                    netProfit: acc.netProfit+s.netProfit,
                                    partnerShare: acc.partnerShare+s.partnerShare,
                                  };
                                },{adsRevenue:0,invalidDeduction:0,subscriptionRev:0,totalRevenue:0,marketing:0,server:0,reviews:0,tax:0,other:0,totalExpenses:0,netProfit:0,partnerShare:0});
                                return (
                                  <>
                                    <p className="text-xs text-slate-500 mb-2">Combined totals for all {ys.monthCount} months in {year}</p>
                                    {[
                                      {label:'Gross Ads Revenue',          val:formatUSD(totals.adsRevenue),              color:'text-slate-200',indent:false},
                                      {label:'− Invalid Traffic Deduction',val:`−${formatUSD(totals.invalidDeduction)}`,   color:'text-red-400',indent:true},
                                      {label:'Subscription Revenue',       val:`+${formatUSD(totals.subscriptionRev)}`,    color:'text-slate-200',indent:false},
                                    ].map(r=>(
                                      <div key={r.label} className={`flex justify-between ${r.indent?'pl-4':''}`}>
                                        <span className="text-slate-400">{r.label}</span>
                                        <span className={`font-mono ${r.color}`}>{r.val}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between font-medium border-t border-slate-700/50 pt-2 mt-1">
                                      <span className="text-slate-300">Total Revenue</span>
                                      <span className="font-mono text-green-400">{formatUSD(totals.totalRevenue)}</span>
                                    </div>
                                    {[
                                      {label:'− Marketing',    val:totals.marketing},
                                      {label:'− Server Cost',  val:totals.server},
                                      {label:'− Paid Reviews', val:totals.reviews},
                                      {label:'− Tax',          val:totals.tax},
                                      ...(totals.other>0?[{label:'− Other',val:totals.other}]:[]),
                                    ].map(r=>(
                                      <div key={r.label} className="flex justify-between pl-4">
                                        <span className="text-slate-500">{r.label}</span>
                                        <span className="font-mono text-red-400">−{formatUSD(r.val)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between font-bold border-t border-slate-700/50 pt-2 mt-1">
                                      <span className="text-white">Net Profit</span>
                                      <span className={`font-mono ${totals.netProfit>=0?'text-green-400':'text-red-400'}`}>{formatUSD(totals.netProfit)}</span>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
                                      <div className="flex justify-between">
                                        <span className="text-blue-300 font-semibold">Your Share (25%)</span>
                                        <span className="font-mono text-blue-300 font-bold">{formatUSD(totals.partnerShare)}</span>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </Collapsible>

                          {/* Monthly breakdown table */}
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
                                {monthsInYear.map(m=>{
                                  const d=allData[m]; if(!d) return null;
                                  const s=calculateSummary(d); if(!s) return null;
                                  return (
                                    <tr key={m} onClick={()=>{setMonth(m);setActiveTab('monthly');}}
                                      className="border-b border-slate-800/60 hover:bg-slate-700/30 cursor-pointer transition-colors">
                                      <td className="py-2 px-2 text-slate-300">{getMonthLabel(m)}</td>
                                      <td className="py-2 px-2 text-right text-slate-400 font-mono">{formatUSD(s.totalRevenue)}</td>
                                      <td className="py-2 px-2 text-right text-red-400 font-mono">{formatUSD(s.totalExpenses)}</td>
                                      <td className={`py-2 px-2 text-right font-mono font-semibold ${s.netProfit>=0?'text-green-400':'text-red-400'}`}>{formatUSD(s.netProfit)}</td>
                                      <td className="py-2 px-2 text-right text-blue-300 font-mono font-semibold">{formatUSD(s.partnerShare)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
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
