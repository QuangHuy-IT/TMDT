import React, { useState, useEffect, useCallback } from 'react';
import QuestionService from '../../services/questionService';
import Pagination from '../ui/Pagination';

const ITEMS_PER_PAGE = 5;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const QuestionItem = ({ question, onReply, currentUserId, onEdit, onDelete }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(question.content);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const isOwner = currentUserId && question.userId === currentUserId;

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onReply(question.id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi câu trả lời thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editContent.trim() || editContent.trim() === question.content) {
      setEditing(false);
      return;
    }
    setEditSubmitting(true);
    try {
      await onEdit(question.id, editContent.trim());
      setEditing(false);
    } catch {
      setError('Sửa câu hỏi thất bại.');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      {/* Question */}
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-red-600">
            {(question.userFullName || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-900">{question.userFullName || 'Người dùng'}</span>
            <span className="text-[11px] text-gray-400">{formatDate(question.createdAt)}</span>
          </div>

          {/* Question content / edit form */}
          {editing ? (
            <form onSubmit={handleEditSubmit} className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                autoFocus
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 resize-none"
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditContent(question.content); }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting || !editContent.trim()}
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {editSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">{question.content}</p>
          )}

          {/* Actions for owner */}
          {isOwner && !editing && (
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] text-gray-400 hover:text-gray-600 font-semibold"
              >
                Sửa
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Xóa câu hỏi này?')) onDelete(question.id);
                }}
                className="text-[11px] text-gray-400 hover:text-red-500 font-semibold"
              >
                Xóa
              </button>
            </div>
          )}

          {/* Answers */}
          {question.answers && question.answers.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-red-100">
              {question.answers.map((answer) => (
                <div key={answer.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    answer.isAdminAnswer
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="text-[10px] font-black">
                      {answer.isAdminAnswer ? 'A' : (answer.userFullName || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">
                        {answer.isAdminAnswer
                          ? `${answer.userFullName || 'Quản trị viên'} - HH Store`
                          : answer.userFullName || 'Người dùng'}
                      </span>
                      {answer.isAdminAnswer && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-bold">Admin</span>
                      )}
                      <span className="text-[11px] text-gray-400">{formatDate(answer.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{answer.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply toggle */}
          {onReply && !showReplyForm && (
            <button
              onClick={() => setShowReplyForm(true)}
              className="mt-2 text-xs text-red-600 font-semibold hover:underline"
            >
              Trả lời
            </button>
          )}

          {/* Reply form */}
          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 resize-none"
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setShowReplyForm(false); setReplyContent(''); }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionSection = ({ productId, currentUserId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // New question form
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchQuestions = useCallback(async (page = 0) => {
    setLoading(true);
    setError('');
    try {
      const response = await QuestionService.getProductQuestions(productId, {
        page,
        size: ITEMS_PER_PAGE,
      });
      const data = response.data;
      setQuestions(data.questions || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError('Không tải được câu hỏi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchQuestions(0);
  }, [fetchQuestions]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchQuestions(page - 1);
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    if (!currentUserId) {
      setFormError('Vui lòng đăng nhập để đặt câu hỏi.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await QuestionService.createQuestion(currentUserId, {
        productId,
        content: newQuestion.trim(),
      });
      setNewQuestion('');
      setShowForm(false);
      fetchQuestions(0);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gửi câu hỏi thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (questionId, content) => {
    if (!currentUserId) return;
    await QuestionService.createAnswer(questionId, currentUserId, { content });
    fetchQuestions(currentPage - 1);
  };

  const handleEdit = async (questionId, newContent) => {
    await QuestionService.updateQuestion(questionId, currentUserId, newContent);
    fetchQuestions(currentPage - 1);
  };

  const handleDelete = async (questionId) => {
    await QuestionService.deleteQuestion(questionId, currentUserId);
    fetchQuestions(currentPage - 1);
  };

  return (
    <section className="mt-10" id="questions">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-gray-900">Hỏi và đáp</h2>
            {totalElements > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                {totalElements}
              </span>
            )}
          </div>
          {currentUserId && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
            >
              {showForm ? 'Đóng lại' : 'Đặt câu hỏi'}
            </button>
          )}
        </div>

        {/* Notice */}
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-700">
            <span className="font-bold">Hãy đặt câu hỏi cho chúng tôi:</span> HHStore sẽ phản hồi trong vòng 1 giờ. Nếu Quý khách gửi câu hỏi sau 22h, chúng tôi sẽ trả lời vào sáng hôm sau. Thông tin có thể thay đổi theo thời gian, vui lòng đặt câu hỏi để nhận được cập nhật mới nhất!
          </p>
        </div>

        {/* Question Form */}
        {showForm && (
          <form onSubmit={handleCreateQuestion} className="mb-6">
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <h3 className="mb-3 font-bold text-gray-800">Đặt câu hỏi về sản phẩm này</h3>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ví dụ: Sản phẩm có bảo hành không? Thời gian giao hàng bao lâu?..."
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 resize-none"
              />
              {formError && (
                <p className="text-xs text-red-500 mt-2">{formError}</p>
              )}
              <div className="flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNewQuestion(''); setFormError(''); }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newQuestion.trim()}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi câu hỏi'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
            <p className="mt-3 text-sm text-gray-400">Đang tải câu hỏi...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={() => fetchQuestions(0)} className="mt-2 text-xs text-red-600 underline">
              Thử lại
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-500">Chưa có câu hỏi nào</p>
            <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên đặt câu hỏi!</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              {questions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  currentUserId={currentUserId}
                  onReply={currentUserId ? handleReply : null}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default QuestionSection;
