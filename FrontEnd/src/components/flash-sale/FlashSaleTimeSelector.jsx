import React from 'react';
import { cn } from '../../utils/cn';
import { Flame, Clock } from 'lucide-react';
import { formatFlashSaleTime } from '../../utils/flashSaleTime';

const FlashSaleTimeSelector = ({ sessions, activeSessionId, onSessionClick, className }) => {
  if (!sessions || sessions.length === 0) return null;

  const formatTime = (dateStr) => {
    return formatFlashSaleTime(dateStr);
  };

  const getSessionStyle = (session) => {
    const isActive = session.id === activeSessionId;
    const isRunning = session.isRunning;
    const isEnded = session.isEnded;

    if (isActive && isRunning) {
      return 'bg-yellow-400 text-red-800 shadow-lg shadow-yellow-400/40 ring-2 ring-yellow-300/50';
    }
    if (isActive && !isRunning && !isEnded) {
      return 'bg-orange-400 text-white shadow-lg shadow-orange-400/40 ring-2 ring-orange-300/50';
    }
    if (isActive && isEnded) {
      return 'bg-slate-400 text-white shadow-lg ring-2 ring-slate-300/50';
    }
    if (isRunning) {
      return 'bg-white/15 text-white hover:bg-white/25 border border-white/20 hover:border-white/30';
    }
    if (isEnded) {
      return 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10';
    }
    return 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/15 hover:border-white/25';
  };

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide", className)}>
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const isRunning = session.isRunning;
        const isEnded = session.isEnded;

        return (
          <button
            key={session.id}
            onClick={() => onSessionClick(session.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 text-xs font-bold",
              getSessionStyle(session)
            )}
          >
            <Flame
              size={11}
              className={cn(
                isActive && isRunning ? 'fill-orange-600 text-orange-600' :
                isActive && !isRunning && !isEnded ? 'fill-orange-400 text-orange-200' :
                isRunning ? 'fill-orange-500 text-orange-400' : 'opacity-50'
              )}
            />
            <span>{formatTime(session.startAt)}</span>

            {/* Status indicator */}
            {isActive && isRunning && (
              <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 bg-red-700/80 text-white rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
            )}
            {isActive && !isRunning && !isEnded && (
              <span className="text-[9px] font-black px-1.5 py-0.5 bg-orange-600/80 text-white rounded-full uppercase tracking-wider">
                Sắp
              </span>
            )}
            {isActive && isEnded && (
              <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-600/80 text-white rounded-full uppercase tracking-wider">
                Hết
              </span>
            )}
            {!isActive && isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FlashSaleTimeSelector;
