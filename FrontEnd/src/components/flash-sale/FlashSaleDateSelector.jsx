import React from 'react';
import { cn } from '../../utils/cn';
import { Clock } from 'lucide-react';

const FlashSaleDateSelector = ({ sessions, activeSessionId, onSessionClick, className }) => {
  if (!sessions || sessions.length === 0) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('vi-VN', { day: 'numeric' });
    const month = date.toLocaleDateString('vi-VN', { month: 'short' });
    const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' });
    return { day, month, weekday };
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getCardStyle = (session) => {
    const isActive = session.id === activeSessionId;
    const isRunning = session.isRunning;
    const isEnded = session.isEnded;

    if (isActive && isRunning) {
      return 'bg-white border-yellow-400 text-red-600 shadow-lg shadow-yellow-400/30 ring-2 ring-yellow-400/50';
    }
    if (isActive && !isRunning && !isEnded) {
      return 'bg-white border-orange-400 text-red-600 shadow-lg shadow-orange-400/30 ring-2 ring-orange-400/50';
    }
    if (isActive && isEnded) {
      return 'bg-white border-slate-300 text-slate-500 shadow-sm ring-2 ring-slate-300/50';
    }
    if (isRunning) {
      return 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 backdrop-blur-sm';
    }
    if (isEnded) {
      return 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/15 backdrop-blur-sm';
    }
    return 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/35 backdrop-blur-sm';
  };

  const getStatusBadge = (session) => {
    const isActive = session.id === activeSessionId;
    const isRunning = session.isRunning;
    const isEnded = session.isEnded;

    if (isActive && isRunning) {
      return {
        label: 'Đang diễn ra',
        class: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow shadow-red-500/30'
      };
    }
    if (isActive && !isRunning && !isEnded) {
      return {
        label: 'Sắp diễn ra',
        class: 'bg-gradient-to-r from-orange-500 to-yellow-400 text-red-900 shadow shadow-orange-500/30'
      };
    }
    if (isActive && isEnded) {
      return {
        label: 'Đã kết thúc',
        class: 'bg-slate-400 text-white'
      };
    }
    if (isRunning) {
      return {
        label: 'Đang chạy',
        class: 'bg-green-500 text-white'
      };
    }
    if (isEnded) {
      return {
        label: 'Đã kết thúc',
        class: 'bg-slate-500/60 text-white'
      };
    }
    return {
      label: 'Sắp bắt đầu',
      class: 'bg-yellow-400/80 text-red-900'
    };
  };

  return (
    <div className={cn("flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {sessions.map((session) => {
        const { day, month, weekday } = formatDate(session.startAt);
        const status = getStatusBadge(session);

        return (
          <button
            key={session.id}
            onClick={() => onSessionClick(session.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-3 rounded-2xl text-center transition-all duration-300 shrink-0 min-w-[88px]",
              "border",
              getCardStyle(session)
            )}
          >
            {/* Weekday */}
            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
              {weekday}
            </span>

            {/* Date */}
            <div className="flex items-center gap-1">
              <Clock size={10} className="opacity-50" />
              <span className="text-sm font-black leading-none">
                {formatTime(session.startAt)}
              </span>
            </div>

            {/* Day/Month */}
            <span className="text-[9px] font-bold opacity-60">
              {day} {month}
            </span>

            {/* Status badge */}
            <span className={cn(
              "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider w-full text-center",
              status.class
            )}>
              {session.isRunning && !session.id !== activeSessionId && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1" />
              )}
              {status.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FlashSaleDateSelector;
