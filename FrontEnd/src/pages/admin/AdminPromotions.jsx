import React, { useState } from 'react';

const AdminPromotions = () => {
  const [promotions] = useState([
    { id: 1, name: 'Summer Sale 2026', discount: '20%', status: 'active', startDate: '2026-06-01', endDate: '2026-08-31' },
    { id: 2, name: 'Flash Sale Tháng 6', discount: '15%', status: 'scheduled', startDate: '2026-06-15', endDate: '2026-06-30' },
    { id: 3, name: 'Back to School', discount: '10%', status: 'draft', startDate: '', endDate: '' },
  ]);

  const statusConfig = {
    active: { label: 'Đang chạy', color: 'bg-green-500/10 text-green-400' },
    scheduled: { label: 'Đã lên lịch', color: 'bg-blue-500/10 text-blue-400' },
    draft: { label: 'Nháp', color: 'bg-gray-500/10 text-gray-400' },
    ended: { label: 'Đã kết thúc', color: 'bg-red-500/10 text-red-400' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Khuyến mãi</h1>
          <p className="text-sm text-gray-500 mt-1">{promotions.length} khuyến mãi</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm khuyến mãi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Đang chạy', count: promotions.filter((p) => p.status === 'active').length, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Đã lên lịch', count: promotions.filter((p) => p.status === 'scheduled').length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Nháp', count: promotions.filter((p) => p.status === 'draft').length, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' },
          { label: 'Đã kết thúc', count: promotions.filter((p) => p.status === 'ended').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-[#13151e] border rounded-2xl p-5 ${stat.bg}`}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Promotions table */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Khuyến mãi</th>
              <th className="text-center px-6 py-3 font-medium">Giảm giá</th>
              <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
              <th className="text-center px-6 py-3 font-medium hidden md:table-cell">Thời gian</th>
              <th className="text-center px-6 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => {
              const cfg = statusConfig[promo.status] || statusConfig.draft;
              return (
                <tr key={promo.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-white">{promo.name}</p>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-sm font-black text-red-400">{promo.discount}</span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="px-6 py-3 text-center hidden md:table-cell">
                    <p className="text-xs text-gray-500">
                      {promo.startDate ? `${promo.startDate} → ${promo.endDate}` : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Coming soon notice */}
      <div className="bg-[#13151e] border border-dashed border-amber-500/30 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚀</span>
        </div>
        <h3 className="text-lg font-black text-white mb-2">Tính năng đang được phát triển</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Phần khuyến mãi đang trong quá trình xây dựng. Bạn có thể quản lý voucher trong hệ thống.
          Liên hệ đội ngũ phát triển để được hỗ trợ thêm.
        </p>
        <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
          {['Tạo voucher giảm giá', 'Lên lịch khuyến mãi', 'Flash sale', 'Mã khuyến mãi tự động'].map((f) => (
            <span key={f} className="text-[11px] bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full font-bold border border-amber-500/20">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPromotions;
