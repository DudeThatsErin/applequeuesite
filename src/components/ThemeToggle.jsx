import { useEffect, useState } from 'react';

const KEY = 'aq-theme';

function initialTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr) return attr;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* private mode: the toggle still works, it just doesn't persist */
    }
  }, [theme]);

  const light = theme === 'light';

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setTheme(light ? 'dark' : 'light')}
      aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {light ? '☾' : '☀'}
    </button>
  );
}
