import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import Pagination from '../../components/ui/Pagination';

const ITEMS_PER_PAGE = 10;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Reply modal
  const [replyModal, setReplyModal] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchQuestions = async (page = 0, tab = activeTab) => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (tab === 'pending') {
        response = await api.get('/admin/questions/pending', { params: { page, size: ITEMS_PER_PAGE } });
      } else {
        response = await api.get('/admin/questions', { params: { page, size: ITEMS_PER_PAGE } });
      }
      const data = response.data;
      setQuestions(data.questions || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(page + 1);
    } catch (err) {
      setError('Không tải được danh sách câu hỏi.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/admin/questions/pending', { params: { page: 0, size: 1 } });
      setPendingCount(response.data.totalElements || 0);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    fetchQuestions(0, activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const handlePageChange = (page) => {
    fetchQuestions(page - 1, activeTab);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setSearch('');
      return;
    }
    setSearch(searchInput.trim());
    setActiveTab('search');
    setLoading(true);
    api.get('/admin/questions/search', { params: { q: searchInput.trim(), page: 0, size: ITEMS_PER_PAGE } })
      .then((res) => {
        setQuestions(res.data.questions || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
        setCurrentPage(1);
      })
      .catch(() => setError('Tìm kiếm thất bại.'))
      .finally(() => setLoading(false));
  };

  const openReplyModal = (question) => {
    setReplyModal(question);
    setReplyContent('');
    setReplyError('');
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setReplyLoading(true);
    setReplyError('');
    try {
      const meRes = await api.get('/auth/me');
      const adminId = meRes.data?.id || 1;

      await api.post(`/admin/questions/${replyModal.id}/answer`, replyContent.trim(), {
        params: { adminUserId: adminId },
        headers: { 'Content-Type': 'text/plain' },
      });
      setReplyModal(null);
      setReplyContent('');
      fetchQuestions(0, activeTab);
      fetchPendingCount();
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Gửi câu trả lời thất bại.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleHide = async (questionId) => {
    if (!window.confirm('Ẩn câu hỏi này?')) return;
    setActionLoading(questionId);
    try {
      await api.post(`/admin/questions/${questionId}/hide`);
      fetchQuestions(currentPage - 1, activeTab);
    } catch {
      alert('Thao tác thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShow = async (questionId) => {
    setActionLoading(questionId);
    try {
      await api.post(`/admin/questions/${questionId}/show`);
      fetchQuestions(currentPage - 1, activeTab);
    } catch {
      alert('Thao tác thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Xóa câu hỏi này? Hành động không thể hoàn tác.')) return;
    setActionLoading(questionId);
    try {
      await api.delete(`/admin/questions/${questionId}`);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setTotalElements((prev) => Math.max(0, prev - 1));
      fetchPendingCount();
    } catch {
      alert('Xóa thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: 'all', label: 'Tất cả', badge: null },
    { key: 'pending', label: 'Chưa trả lời', badge: pendingCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Hỏi và đáp</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý câu hỏi của người dùng về sản phẩm</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(''); setSearchInput(''); }}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.badge !== null && tab.badge > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm câu hỏi..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">
          Tìm
        </button>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-white">{totalElements}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng câu hỏi</p>
        </div>
        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-1">Chưa trả lời</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải dữ liệu...</div>}
        {error && (
          <div className="px-6 py-4 text-sm text-red-400 border-b border-white/5">
            {error}
            <button onClick={() => fetchQuestions(0, activeTab)} className="ml-2 underline">Thử lại</button>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="py-16 text-center text-gray-600 font-bold">Không có câu hỏi nào</div>
        )}

        {!loading && !error && questions.length > 0 && (
          <div className="divide-y divide-white/[0.03]">
            {questions.map((question) => (
              <div key={question.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Product */}
                    <p className="text-xs text-gray-500 mb-1">
                      Sản phẩm:{' '}
                      <span className="text-gray-300 font-medium">{question.productName}</span>
                    </p>

                    {/* User */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-red-600/20 flex items-center justify-center text-[10px] font-black text-red-400">
                        {(question.userFullName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-white">{question.userFullName || 'Người dùng'}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        question.isAnswered
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {question.isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}
                      </span>
                      {!question.isVisible && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-500/10 text-gray-400">
                          Đã ẩn
                        </span>
                      )}
                    </div>

                    {/* Question content */}
                    <p className="text-sm text-gray-300 leading-relaxed mb-2">{question.content}</p>

                    {/* Answers */}
                    {question.answers && question.answers.length > 0 && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-500/20">
                        {question.answers.map((answer) => (
                          <div key={answer.id} className="flex gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                              answer.isAdminAnswer
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'bg-gray-600/20 text-gray-400'
                            }`}>
                              {answer.isAdminAnswer ? 'A' : (answer.userFullName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-white">
                                  {answer.isAdminAnswer ? 'Quản trị viên' : answer.userFullName || 'Người dùng'}
                                </span>
                                {answer.isAdminAnswer && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-400 font-bold">Admin</span>
                                )}
                                <span className="text-[11px] text-gray-600">{formatDate(answer.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-400">{answer.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    <p className="text-[11px] text-gray-600 mt-2">{formatDate(question.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <button
                      onClick={() => openReplyModal(question)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Trả lời
                    </button>
                    {!question.isVisible ? (
                      <button
                        onClick={() => handleShow(question.id)}
                        disabled={actionLoading === question.id}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Hiện
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHide(question.id)}
                        disabled={actionLoading === question.id}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-gray-500/10 text-gray-400 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Ẩn
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(question.id)}
                      disabled={actionLoading === question.id}
                      className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">Trả lời câu hỏi</h3>
              <button onClick={() => setReplyModal(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            {/* Question preview */}
            <div className="mb-4 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <p className="text-xs text-gray-500 mb-1">Câu hỏi từ {replyModal.userFullName || 'Người dùng'}:</p>
              <p className="text-sm text-gray-300">{replyModal.content}</p>
            </div>

            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Nhập câu trả lời của bạn..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
            />
            {replyError && <p className="text-xs text-red-400 mt-2">{replyError}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReplyModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleReply}
                disabled={replyLoading || !replyContent.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white disabled:opacity-50"
              >
                {replyLoading ? 'Đang gửi...' : 'Gửi câu trả lời'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
