import React, { useEffect, useState, useRef } from 'react';
import AdminNewsService from '../../services/newsService';
import ProductService from '../../services/productService';
import { TiptapEditor } from '../../components/ui/RichTextEditor';

  const DEFAULT_CATEGORIES = [
    { value: 'CONG_NGHE', label: 'Tin tức công nghệ', isDefault: true },
    { value: 'KHUYEN_MAI', label: 'Khuyến mãi', isDefault: true },
    { value: 'DANH_GIA', label: 'Đánh giá sản phẩm', isDefault: true },
    { value: 'HUONG_DAN', label: 'Hướng dẫn', isDefault: true },
    { value: 'SU_KIEN', label: 'Sự kiện', isDefault: true },
    { value: 'TIN_KHAC', label: 'Tin tức chung', isDefault: true },
  ];

  const DEFAULT_BADGES = [
    { value: 'Hot', label: 'Hot', color: 'bg-red-600', isDefault: true },
    { value: 'Khuyến mãi', label: 'Khuyến mãi', color: 'bg-orange-500', isDefault: true },
    { value: 'So sánh', label: 'So sánh', color: 'bg-blue-500', isDefault: true },
    { value: 'Hướng dẫn', label: 'Hướng dẫn', color: 'bg-green-500', isDefault: true },
    { value: 'Mới', label: 'Mới', color: 'bg-purple-500', isDefault: true },
  ];

const AdminNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Dynamic categories and badges
  const [categories, setCategories] = useState([...DEFAULT_CATEGORIES]);
  const [badges, setBadges] = useState([...DEFAULT_BADGES]);
  const [customCategory, setCustomCategory] = useState('');
  const [customBadge, setCustomBadge] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomBadge, setShowCustomBadge] = useState(false);

  const imageInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    category: 'CONG_NGHE',
    badge: '',
    isFeatured: false,
    isPublished: true,
    authorName: '',
    publishedAt: '',
  });

  useEffect(() => {
    fetchNews(0);
  }, []);

  const fetchNews = async (page = 0) => {
    setLoading(true);
    try {
      const res = await AdminNewsService.getAllNews(page, 10);
      const data = res.data;
      setNews(data.content || []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchNews(page);
  };

  const openAdd = () => {
    setEditingNews(null);
    setForm({
      title: '',
      excerpt: '',
      content: '',
      imageUrl: '',
      category: 'CONG_NGHE',
      badge: '',
      isFeatured: false,
      isPublished: true,
      authorName: '',
      publishedAt: '',
    });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingNews(item);
    setForm({
      title: item.title || '',
      excerpt: item.excerpt || '',
      content: item.content || '',
      imageUrl: item.imageUrl || '',
      category: item.category || 'CONG_NGHE',
      badge: item.badge || '',
      isFeatured: item.isFeatured || false,
      isPublished: item.isPublished !== false,
      authorName: item.authorName || '',
      publishedAt: item.publishedAt ? item.publishedAt.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await ProductService.uploadImage(file);
      setForm((p) => ({ ...p, imageUrl: res.data.imageUrl }));
    } catch {
      alert('Upload ảnh thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleContentChange = (value) => {
    setForm((p) => ({ ...p, content: value }));
  };

  const getLocalISOString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19);
    return localISOTime;
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Vui lòng nhập tiêu đề.'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt?.trim() || null,
        content: form.content || null,
        imageUrl: form.imageUrl || null,
        category: form.category,
        badge: form.badge || null,
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
        authorName: form.authorName?.trim() || null,
        publishedAt: editingNews 
          ? (form.publishedAt ? form.publishedAt + ':00' : null)
          : (form.isPublished ? getLocalISOString() : null),
      };

      if (editingNews) {
        const res = await AdminNewsService.updateNews(editingNews.id, payload);
        setNews((p) => p.map((n) => n.id === editingNews.id ? res.data : n));
      } else {
        const res = await AdminNewsService.createNews(payload);
        setNews((p) => [res.data, ...p]);
        setTotalElements((t) => t + 1);
      }
      setShowForm(false);
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Lưu thất bại';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await AdminNewsService.deleteNews(id);
      setNews((p) => p.filter((n) => n.id !== id));
      setTotalElements((t) => t - 1);
      setDeleteConfirm(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleTogglePublished = async (item) => {
    try {
      const res = await AdminNewsService.togglePublished(item.id);
      setNews((p) => p.map((n) => n.id === item.id ? res.data : n));
    } catch (e) {
      alert('Cập nhật thất bại');
    }
  };

  const filteredNews = news.filter((item) => {
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    if (filterStatus === 'PUBLISHED' && !item.isPublished) return false;
    if (filterStatus === 'DRAFT' && item.isPublished) return false;
    if (filterStatus === 'FEATURED' && !item.isFeatured) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      if (!item.title?.toLowerCase().includes(kw) && !item.excerpt?.toLowerCase().includes(kw)) return false;
    }
    return true;
  });

  const catLabel = (cat) => categories.find((c) => c.value === cat)?.label || cat || '—';
  const badgeInfo = (badge) => badges.find((b) => b.value === badge);

  const formatDate = (str) => {
    if (!str) return '—';
    try {
      return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return str; }
  };

  // Handle custom category
  const handleAddCustomCategory = () => {
    if (!customCategory.trim()) return;
    const newCategory = {
      value: customCategory.trim().toUpperCase().replace(/\s+/g, '_'),
      label: customCategory.trim(),
    };
    if (!categories.find((c) => c.value === newCategory.value)) {
      setCategories((prev) => [...prev, newCategory]);
      setForm((p) => ({ ...p, category: newCategory.value }));
    } else {
      setForm((p) => ({ ...p, category: newCategory.value }));
    }
    setCustomCategory('');
    setShowCustomCategory(false);
  };

  // Delete custom category
  const handleDeleteCategory = (value) => {
    const cat = categories.find((c) => c.value === value);
    if (cat?.isDefault) {
      alert('Không thể xóa danh mục mặc định.');
      return;
    }
    setCategories((prev) => prev.filter((c) => c.value !== value));
    if (form.category === value) {
      setForm((p) => ({ ...p, category: 'CONG_NGHE' }));
    }
  };

  // Handle custom badge
  const handleAddCustomBadge = () => {
    if (!customBadge.trim()) return;
    const newBadge = {
      value: customBadge.trim(),
      label: customBadge.trim(),
      color: 'bg-gray-600',
    };
    if (!badges.find((b) => b.value === newBadge.value)) {
      setBadges((prev) => [...prev, newBadge]);
      setForm((p) => ({ ...p, badge: newBadge.value }));
    } else {
      setForm((p) => ({ ...p, badge: newBadge.value }));
    }
    setCustomBadge('');
    setShowCustomBadge(false);
  };

  // Delete custom badge
  const handleDeleteBadge = (value) => {
    const badge = badges.find((b) => b.value === value);
    if (badge?.isDefault) {
      alert('Không thể xóa nhãn mặc định.');
      return;
    }
    setBadges((prev) => prev.filter((b) => b.value !== value));
    if (form.badge === value) {
      setForm((p) => ({ ...p, badge: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Tin tức</h1>
          <p className="text-sm text-gray-500 mt-1">{totalElements} bài viết</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Viết bài mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm tiêu đề..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#13151e] border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
          />
        </div>
          <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#13151e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
        >
          <option value="ALL">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#13151e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PUBLISHED">Đã đăng</option>
          <option value="DRAFT">Nháp</option>
          <option value="FEATURED">Nổi bật</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="text-left px-6 py-3 font-medium">Bài viết</th>
                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Danh mục</th>
                <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
                <th className="text-center px-6 py-3 font-medium">Nổi bật</th>
                <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Ngày đăng</th>
                <th className="text-center px-6 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Đang tải...</td>
                </tr>
              )}
              {!loading && filteredNews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="text-gray-600 font-bold">Chưa có bài viết nào</div>
                    <button onClick={openAdd} className="mt-3 text-sm text-red-400 hover:text-red-300 font-medium">
                      + Viết bài đầu tiên
                    </button>
                  </td>
                </tr>
              )}
              {!loading && filteredNews.map((item) => {
                const badge = badgeInfo(item.badge);
                return (
                  <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-16 h-10 rounded-lg object-cover bg-white/5 border border-white/10 flex-shrink-0"
                            onError={(e) => { e.target.src = 'https://picsum.photos/seed/news/160/100'; e.target.onerror = null; }}
                          />
                        ) : (
                          <div className="w-16 h-10 rounded-lg bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-xs">{item.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-xs">{item.excerpt || 'Không có mô tả'}</p>
                          {item.badge && (
                            <span className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full text-white ${badge?.color || 'bg-gray-600'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-400">{catLabel(item.category)}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => handleTogglePublished(item)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                          item.isPublished ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                        title={item.isPublished ? 'Tắt hiển thị' : 'Bật hiển thị'}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          item.isPublished ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${
                        item.isFeatured ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-gray-500'
                      }`}>
                        {item.isFeatured ? '★ Nổi bật' : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{formatDate(item.publishedAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title="Sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <span className="text-xs text-gray-500">
              Trang {currentPage + 1} / {totalPages} — {totalElements} bài viết
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ←
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = totalPages <= 5 ? i : currentPage <= 2 ? i : currentPage >= totalPages - 3 ? totalPages - 5 + i : currentPage - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === currentPage
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">Xóa bài viết?</h3>
            <p className="text-sm text-gray-400 mb-6">Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all active:scale-95"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-3xl my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-black text-white">
                {editingNews ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-160px)] overflow-y-auto">

              {/* Image Upload */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Ảnh bài viết</label>
                <div className="flex items-start gap-4">
                  {form.imageUrl ? (
                    <div className="relative group w-48 h-28 flex-shrink-0">
                      <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover rounded-xl border border-white/10" onError={(e) => { e.target.src = 'https://picsum.photos/seed/news/480/280'; e.target.onerror = null; }} />
                      <button
                        onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 rounded-full text-white text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading}
                      className="w-48 h-28 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-red-500/40 hover:text-red-400 transition-all"
                    >
                      {uploading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-red-400 rounded-full" />
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] mt-1">Upload ảnh</span>
                        </>
                      )}
                    </button>
                  )}
                  <div>
                    <p className="text-[10px] text-gray-600">Kích thước khuyến nghị: 800×500px</p>
                    <p className="text-[10px] text-gray-600 mt-1">Chấp nhận: JPG, PNG, WebP</p>
                  </div>
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  Tiêu đề <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Nhập tiêu đề bài viết..."
                  maxLength={200}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                />
                <p className="text-[10px] text-gray-600 mt-1 text-right">{form.title.length}/200</p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Mô tả ngắn</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Mô tả ngắn hiển thị trên card tin tức..."
                  rows={3}
                  maxLength={500}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-1 text-right">{(form.excerpt || '').length}/500</p>
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nội dung bài viết</label>
                <TiptapEditor
                  value={form.content}
                  onChange={handleContentChange}
                  placeholder="Viết nội dung bài viết tại đây..."
                />
              </div>

              {/* Category & Badge Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Danh mục</label>
                  {!showCustomCategory ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={form.category}
                          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-red-500"
                        >
                          {categories.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCustomCategory(true)}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-all"
                          title="Thêm danh mục mới"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      {/* Custom categories list with delete */}
                      <div className="flex flex-wrap gap-1.5">
                        {categories.filter((c) => !c.isDefault).map((c) => (
                          <span
                            key={c.value}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300"
                          >
                            {c.label}
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(c.value)}
                              className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                              title="Xóa"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Nhập tên danh mục..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white transition-all"
                        title="Thêm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCustomCategory(false); setCustomCategory(''); }}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                        title="Hủy"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Badge */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nhãn</label>
                  {!showCustomBadge ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={form.badge}
                          onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-red-500"
                        >
                          <option value="">Không có nhãn</option>
                          {badges.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCustomBadge(true)}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-all"
                          title="Thêm nhãn mới"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      {/* Custom badges list with delete */}
                      <div className="flex flex-wrap gap-1.5">
                        {badges.filter((b) => !b.isDefault).map((b) => (
                          <span
                            key={b.value}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300"
                          >
                            {b.label}
                            <button
                              type="button"
                              onClick={() => handleDeleteBadge(b.value)}
                              className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                              title="Xóa"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customBadge}
                        onChange={(e) => setCustomBadge(e.target.value)}
                        placeholder="Nhập tên nhãn..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomBadge()}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomBadge}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white transition-all"
                        title="Thêm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCustomBadge(false); setCustomBadge(''); }}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                        title="Hủy"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Author & Date Row */}
              <div className={editingNews ? "grid grid-cols-2 gap-4" : "grid grid-cols-1"}>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tác giả</label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
                    placeholder="VD: HHShop"
                    maxLength={100}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                  />
                </div>
                {editingNews && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Ngày đăng</label>
                    <input
                      type="datetime-local"
                      value={form.publishedAt}
                      onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setForm((p) => ({ ...p, isPublished: !p.isPublished }))}
                    className={`relative w-10 h-5.5 rounded-full transition-all cursor-pointer ${
                      form.isPublished ? 'bg-red-600' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all ${
                        form.isPublished ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-300">Đăng bài</span>
                    <p className="text-[10px] text-gray-500">{form.isPublished ? 'Bài viết hiển thị công khai' : 'Bài viết ở chế độ nháp'}</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setForm((p) => ({ ...p, isFeatured: !p.isFeatured }))}
                    className={`relative w-10 h-5.5 rounded-full transition-all cursor-pointer ${
                      form.isFeatured ? 'bg-purple-600' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all ${
                        form.isFeatured ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-300">Nổi bật</span>
                    <p className="text-[10px] text-gray-500">{form.isFeatured ? 'Hiển thị làm tin nổi bật' : 'Bài viết thông thường'}</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : editingNews ? 'Lưu thay đổi' : 'Đăng bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;
