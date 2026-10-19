import React, { useState, useEffect } from 'react';

export const ThemeToggle = ({ className = '' }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Alterna entre light y dark
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleTheme}
      className={`btn btn-sm btn-ghost ${className}`}
      aria-label="Cambiar modo oscuro"
    >
      {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
    </button>
  );
};

export default ThemeToggle;