import React from 'react';

const Badge = ({ children, color = 'red' }) => {
  const colors = {
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

export default Badge;