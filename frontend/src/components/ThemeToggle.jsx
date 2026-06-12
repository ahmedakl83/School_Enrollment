import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [isLightMode, setIsLightMode] = useState(
    localStorage.getItem('theme') === 'light'
  );

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  return (
    <button 
      className="btn no-print" 
      onClick={() => setIsLightMode(!isLightMode)}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        backgroundColor: 'var(--glass-bg)',
        color: 'var(--text-main)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
      }}
      title={isLightMode ? "تفعيل الوضع الليلي" : "تفعيل الوضع النهاري"}
    >
      {isLightMode ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;
