import { useTheme } from '../lib/useTheme';

const OPTIONS = [
  { value: 'dark',   label: 'Dark',   icon: '🌙' },
  { value: 'light',  label: 'Light',  icon: '☀️' },
  { value: 'system', label: 'System', icon: '💻' },
];

export default function ThemeToggle() {
  const { theme, changeTheme } = useTheme();

  const current = OPTIONS.find(o => o.value === theme) || OPTIONS[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600/40 text-slate-300 text-xs font-medium transition-all"
        title="Change theme"
        aria-label="Change theme"
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="text-slate-500 text-xs">▾</span>
      </button>

      {/* Dropdown — shows on hover */}
      <div className="absolute right-0 top-9 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => changeTheme(opt.value)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
              ${theme === opt.value
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
    </div>
  );
}
