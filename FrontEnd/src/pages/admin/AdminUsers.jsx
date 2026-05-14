import React, { useEffect, useState, useMemo } from 'react';
import AdminService from '../../services/adminService';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await AdminService.getUsers();
      const data = res.data?.data ?? res.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AdminUsers] Fetch error:', e);
      setFetchError(e.response?.data?.message || e.message || 'Không thể tải danh sách người dùng. Đảm bảo backend đang chạy.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Chuyển đổi role/status enum từ backend → string hiển thị
  const normalize = (u) => ({
    ...u,
    name: u.fullName || u.name || '',
    role: u.role === 'ADMIN' || u.role === 'admin' ? 'admin' : 'user',
    status: u.status === 'ACTIVE' || u.status === 'active' ? 'active' : 'blocked',
    joined: u.createdAt || '',
    orders: u.orderCount ?? 0,
    spent: u.totalSpent ?? 0,
  });

  const normalized = useMemo(() => users.map(normalize), [users]);

  const filtered = useMemo(() => {
    return normalized.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole   = filterRole === 'all' || u.role === filterRole;
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [normalized, search, filterRole, filterStatus]);

  const stats = useMemo(() => ({
    total:   normalized.length,
    active:  normalized.filter(u => u.status === 'active').length,
    blocked: normalized.filter(u => u.status === 'blocked').length,
    admins:  normalized.filter(u => u.role === 'admin').length,
  }), [normalized]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'BLOCKED' : 'ACTIVE';
    try {
      const res = await AdminService.updateUser(user.id, { status: newStatus });
      const updated = normalize(res.data);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u));
      if (selectedUser?.id === user.id) setSelectedUser(prev => ({ ...prev, ...updated }));
    } catch (e) {
      alert('Cập nhật trạng thái thất bại: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'USER' : 'ADMIN';
    try {
      const res = await AdminService.updateUser(user.id, { role: newRole });
      const updated = normalize(res.data);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u));
      if (selectedUser?.id === user.id) setSelectedUser(prev => ({ ...prev, ...updated }));
    } catch (e) {
      alert('Cập nhật quyền thất bại: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Người dùng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản và phân quyền</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng users',    value: stats.total,   color: 'text-white' },
          { label: 'Hoạt động',     value: stats.active,  color: 'text-green-400' },
          { label: 'Bị khóa',       value: stats.blocked, color: 'text-red-400' },
          { label: 'Admin',         value: stats.admins,  color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#13151e] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, email..."
            className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
        </div>

        <div className="flex gap-2">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="bg-[#13151e] border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer">
            <option value="all">Tất cả quyền</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#13151e] border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-red-500/50 transition-all cursor-pointer">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="blocked">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && (
          <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải...</div>
        )}
        {fetchError && (
          <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400 font-medium">Lỗi: {fetchError}</p>
            <button onClick={fetchUsers} className="mt-2 text-xs text-red-400 underline hover:text-red-300">Thử lại</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="text-left px-6 py-3 font-medium">Người dùng</th>
                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Ngày tham gia</th>
                <th className="text-center px-6 py-3 font-medium hidden lg:table-cell">Đơn hàng</th>
                <th className="text-right px-6 py-3 font-medium hidden lg:table-cell">Chi tiêu</th>
                <th className="text-center px-6 py-3 font-medium">Quyền</th>
                <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
                <th className="text-center px-6 py-3 font-medium">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase flex-shrink-0 ${
                        user.role === 'admin' ? 'bg-purple-600' : 'bg-red-600/70'
                      }`}>
                        {(user.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.phone && <p className="text-[10px] text-gray-600">{user.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-500">{user.joined || '—'}</span>
                  </td>
                  <td className="px-6 py-3 text-center hidden lg:table-cell">
                    <span className="text-sm text-gray-300">{user.orders}</span>
                  </td>
                  <td className="px-6 py-3 text-right hidden lg:table-cell">
                    <span className="text-sm font-bold text-gray-300">
                      {user.spent > 0 ? `${(user.spent / 1e6).toFixed(1)}M₫` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleToggleRole(user)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        user.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        user.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                      }`}
                    >
                      {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center text-gray-600 font-bold">Không tìm thấy người dùng nào</div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white">Hồ sơ người dùng</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl uppercase mb-3 ${
                selectedUser.role === 'admin' ? 'bg-purple-600' : 'bg-red-600'
              }`}>
                {(selectedUser.name || 'U').charAt(0)}
              </div>
              <p className="font-bold text-white">{selectedUser.name || '—'}</p>
              <p className="text-xs text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Ngày tham gia', value: selectedUser.joined || '—' },
                { label: 'Đơn hàng',      value: `${selectedUser.orders} đơn` },
                { label: 'Tổng chi tiêu', value: selectedUser.spent > 0 ? `${Number(selectedUser.spent).toLocaleString()}₫` : '—' },
                { label: 'Điện thoại',    value: selectedUser.phone || '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium text-gray-300">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleToggleStatus(selectedUser)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                  selectedUser.status === 'active'
                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                    : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                }`}
              >
                {selectedUser.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
              <button onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-300 font-medium transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
