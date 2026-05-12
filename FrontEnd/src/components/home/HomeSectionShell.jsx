import React from 'react';

const HomeSectionShell = ({ children, className = '', innerClassName = '' }) => (
  <section className={`${className}`}>
    <div
      className={`rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] md:p-6 ${innerClassName}`}
    >
      {children}
    </div>
  </section>
);

export default HomeSectionShell;
