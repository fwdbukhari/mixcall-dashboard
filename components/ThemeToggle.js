import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../lib/useTheme';

const OPTIONS = [
  { value: 'dark',   label: 'Dark',   icon: '🌙' },
  { value: 'light',  label: 'Light',  icon: '☀️'  },
  { value: 'system', label: 'System', icon: '💻' },
];

export default function ThemeToggle() {
  const { theme, changeTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = OPTIONS.find(o => o.value === theme) || OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600/40 text-slate-300 text-xs font-medium transition-all"
        aria-label="Change theme"
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="text-slate-500 text-xs">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { changeTheme(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                theme === opt.value
                  ? 'bg-violet-600/30 text-violet-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              {theme === opt.value && <span className="ml-auto text-violet-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
