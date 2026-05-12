import React from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';

const ProgressBar = ({ current = 0, total = 1, compact = false, className }) => {
  const percentage = Math.min(100, total > 0 ? Math.round((current / total) * 100) : 0);
  const remaining = Math.max(0, total - current);

  const getGradient = () => {
    if (percentage >= 90) return 'from-slate-500 to-slate-600';  // almost gone
    if (percentage >= 70) return 'from-red-600 to-rose-700';      // very hot
    if (percentage >= 50) return 'from-orange-500 to-red-500';     // hot
    if (percentage >= 20) return 'from-orange-400 to-orange-500';  // warming up
    return 'from-yellow-400 to-orange-400';                        // just started
  };

  const getStatusLabel = () => {
    if (percentage >= 90) return 'Sắp hết';
    if (percentage >= 70) return 'Nóng!';
    if (percentage >= 50) return 'Đang giảm';
    return 'Đã bán';
  };

  const getStatusColor = () => {
    if (percentage >= 90) return 'text-slate-500';
    if (percentage >= 70) return 'text-red-600';
    if (percentage >= 50) return 'text-orange-500';
    return 'text-orange-400';
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {/* Labels row */}
      <div className={cn(
        "flex justify-between items-center text-[10px] font-bold uppercase tracking-wider",
        compact ? "text-slate-400" : "text-slate-500"
      )}>
        <div className="flex items-center gap-1">
          <Zap size={9} className={cn(
            "fill-current",
            getStatusColor()
          )} />
          <span className={getStatusColor()}>
            {getStatusLabel()} {current.toLocaleString('vi-VN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("font-black", getStatusColor())}>
            {percentage}%
          </span>
          {remaining > 0 && !compact && (
            <span className="text-slate-400 font-semibold">
              Còn {remaining.toLocaleString('vi-VN')} suất
            </span>
          )}
          {remaining > 0 && compact && (
            <span className="text-slate-400 font-semibold">
              {remaining.toLocaleString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className={cn(
        "w-full rounded-full overflow-hidden relative",
        compact ? "h-1.5 bg-slate-100" : "h-2.5 bg-slate-100 shadow-inner"
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
            `bg-gradient-to-r ${getGradient()}`
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 -translate-x-full animate-shimmer"
              style={{
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                animation: 'shimmer 2.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Moving glow dot at leading edge */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 rounded-r-full"
            style={{
              background: 'linear-gradient(to left, rgba(255,255,255,0.6), transparent)',
            }}
          />
        </div>
      </div>

      {/* Compact remaining count below */}
      {compact && remaining > 0 && (
        <p className="text-[9px] text-slate-400 font-semibold text-right">
          Còn {remaining.toLocaleString('vi-VN')} suất
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
