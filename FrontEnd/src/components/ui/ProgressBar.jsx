import React from 'react';
import { cn } from '../../utils/cn';

const ProgressBar = ({ current = 0, total = 1, className }) => {
  const percentage = Math.min(100, total > 0 ? Math.round((current / total) * 100) : 0);
  
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <span>Đã bán {current}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
