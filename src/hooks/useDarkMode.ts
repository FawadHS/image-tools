import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const THEME_KEY = 'theme';
  const LEGACY_KEY = 'darkMode';

  const [isDark, setIsDark] = useState(() => {
    // Shared theme key used across Preflight apps
    const sharedTheme = localStorage.getItem(THEME_KEY);
    if (sharedTheme === 'dark') return true;
    if (sharedTheme === 'light') return false;

    // Backward compatibility for legacy key
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      return JSON.parse(legacy);
    }

    // Otherwise check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    localStorage.setItem(LEGACY_KEY, JSON.stringify(isDark));
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY) return;
      if (event.newValue === 'dark') setIsDark(true);
      if (event.newValue === 'light') setIsDark(false);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = () => setIsDark((prev: boolean) => !prev);

  return { isDark, toggle };
};
