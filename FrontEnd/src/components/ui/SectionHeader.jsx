import React from 'react';
import { cn } from '../../utils/cn';

const SectionHeader = ({ title, subtitle, icon: Icon, className, children }) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 bg-slate-100 rounded-xl">
            <Icon size={24} className="text-slate-900" />
          </div>
        )}
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {children}
      </div>
    </div>
  );
};

export default SectionHeader;
