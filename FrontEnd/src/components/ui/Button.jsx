import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
    outline: 'border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-orange-600 text-white hover:bg-orange-700',
  };

  return (
    <button
      className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;