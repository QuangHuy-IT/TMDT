import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { ContactMenu } from './ContactMenu';

export const FloatingContactButton = ({ phoneNumber = '0866093546' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOpenZalo = () => {
    window.open(`https://zalo.me/${phoneNumber}`, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Menu con hiện phía trên nút chính */}
      <ContactMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onOpenZalo={handleOpenZalo}
      />

      {/* Nút chính */}
      <button
        onClick={handleToggle}
        aria-label={isOpen ? 'Đóng menu liên hệ' : 'Mở menu liên hệ'}
        className={`
          relative z-10 flex h-14 w-14 items-center justify-center rounded-full
          bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl
          transition-all duration-300 ease-in-out
          hover:scale-110 hover:shadow-blue-500/40 active:scale-95
          ${isOpen ? 'rotate-[315deg] bg-gradient-to-br from-gray-600 to-gray-700' : ''}
        `}
      >
        <Phone
          size={22}
          className={`transition-transform duration-300 ${isOpen ? 'rotate-[-135deg]' : ''}`}
          strokeWidth={2.5}
        />

        {/* Sóng lan tỏa khi đóng */}
        {!isOpen && (
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-20" />
        )}
      </button>
    </div>
  );
};
