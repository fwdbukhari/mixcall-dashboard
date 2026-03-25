import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light' | 'system'

  // On mount, read saved preference
  useEffect(() => {
    const saved = localStorage.getItem('mc_theme') || 'dark';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function applyTheme(t) {
    const isDark =
      t === 'dark' ||
      (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  function changeTheme(t) {
    setTheme(t);
    localStorage.setItem('mc_theme', t);
    applyTheme(t);
  }

  // Watch system preference changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, changeTheme };
}
