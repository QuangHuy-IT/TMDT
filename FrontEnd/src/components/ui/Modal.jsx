import React from 'react';

export const Modal = ({ isOpen, onClose, title, icon, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} p-8 relative`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 p-2 rounded-xl">{icon}</div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
};
