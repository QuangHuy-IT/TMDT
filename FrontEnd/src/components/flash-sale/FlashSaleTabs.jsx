import React from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const FlashSaleTabs = ({ campaigns, activeIndex, onTabClick }) => {
  if (!campaigns || campaigns.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-nowrap">
      {campaigns.map((campaign, idx) => {
        const isActive = idx === activeIndex;
        const isRunning = campaign.sessions?.some(s => s.isRunning);

        return (
          <motion.button
            key={campaign.id}
            onClick={() => onTabClick(idx)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden",
              isActive
                ? 'bg-white text-red-600 shadow-[0_4px_16px_rgba(0,0,0,0.15)] scale-105 ring-2 ring-yellow-400/60'
                : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm'
            )}
          >
            {/* Active indicator dot */}
            {isActive && (
              <motion.span
                layoutId="activeFlashDot"
                className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Flash icon with animation */}
            <Zap
              size={12}
              className={cn(
                'transition-all duration-300',
                isActive
                  ? 'fill-yellow-400 text-yellow-500 animate-flash-icon'
                  : 'fill-white/40'
              )}
            />

            {/* Title */}
            <span className={cn(isActive ? 'font-black' : 'font-bold')}>
              {campaign.title}
            </span>

            {/* Running badge */}
            {isRunning && !isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default FlashSaleTabs;
