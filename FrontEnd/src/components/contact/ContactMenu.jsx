import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MessageSquare } from 'lucide-react';

const menuItems = [
  {
    id: 'zalo',
    icon: MessageCircle,
    label: 'Liên hệ Zalo',
    iconBg: 'bg-[#0068FF]',
    iconBgHover: 'hover:bg-[#0052d4]',
    textColor: 'text-[#0068FF]',
    textColorHover: 'group-hover:text-[#0052d4]',
  },
  {
    id: 'chatbot',
    icon: MessageSquare,
    label: 'Chatbot AI',
    iconBg: 'bg-emerald-500',
    iconBgHover: 'hover:bg-emerald-600',
    textColor: 'text-emerald-600',
    textColorHover: 'group-hover:text-emerald-700',
  },
];

export const ContactMenu = ({ isOpen, onClose, onOpenZalo }) => {
  const handleItemClick = (id) => {
    if (id === 'zalo') {
      onOpenZalo();
    } else if (id === 'chatbot') {
      window.dispatchEvent(new CustomEvent('openChatbot'));
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col gap-2"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 30, scale: 0.5 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.5 }}
                transition={{
                  duration: 0.2,
                  delay: isOpen ? index * 0.06 : 0,
                  ease: [0.4, 0, 0.2, 1],
                }}
                onClick={() => handleItemClick(item.id)}
                aria-label={item.label}
                className={`
                  group flex w-auto items-center gap-3 rounded-full
                  bg-white px-4 py-2.5 shadow-xl ring-1 ring-black/5
                  transition-all duration-200 hover:scale-105 hover:shadow-2xl
                  active:scale-95 cursor-pointer
                `}
              >
                {/* Icon */}
                <span
                  className={`
                    flex h-8 w-8 shrink-0 items-center justify-center
                    rounded-full ${item.iconBg} ${item.iconBgHover} text-white
                    shadow-md transition-all duration-200 group-hover:scale-110
                  `}
                >
                  <Icon size={16} strokeWidth={2.5} />
                </span>

                {/* Label */}
                <span
                  className={`
                    text-sm font-semibold whitespace-nowrap pr-1
                    ${item.textColor} ${item.textColorHover}
                    transition-colors duration-200
                  `}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
