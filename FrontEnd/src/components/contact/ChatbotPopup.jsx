import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { sendChatMessage, getOrCreateSessionId, getChatHistory } from '../../api/chatService';

const SUGGESTED_QUESTIONS = [
  'Tôi muốn biết về chính sách bảo hành',
  'Sản phẩm có được đổi trả không?',
  'Cửa hàng có giao hàng không?',
  'Tôi muốn tìm điện thoại Samsung',
];

export const ChatbotPopup = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Tạo/gán sessionId khi mount
  useEffect(() => {
    getOrCreateSessionId();
  }, []);

  // Auto scroll khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Focus input khi mở
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Load chat history từ server khi mở lần đầu
  useEffect(() => {
    if (isOpen && !historyLoaded) {
      const sessionId = localStorage.getItem('chatbot_session_id');
      if (!sessionId) {
        setHistoryLoaded(true);
        return;
      }

      setHistoryLoaded(true);

      getChatHistory(sessionId)
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            const historyMessages = data.messages.map((msg) => ({
              id: `hist-${msg.id}`,
              sender: msg.senderType === 'USER' ? 'user' : 'bot',
              text: msg.content,
              time: msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '',
            }));
            setMessages(historyMessages);
          } else {
            setMessages([makeGreeting()]);
          }
        })
        .catch(() => {
          // Nếu load history lỗi, vẫn hiện greeting
          setMessages([makeGreeting()]);
        });
    }
  }, [isOpen, historyLoaded]);

  // Reset khi đóng
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const makeGreeting = () => ({
    id: `bot-greeting-${Date.now()}`,
    sender: 'bot',
    text: 'Xin chào! Mình là chatbot AI của cửa hàng. Bạn cần tư vấn điện thoại gì hôm nay? Mình có thể giúp bạn tìm sản phẩm phù hợp với nhu cầu và ngân sách! 😊',
    time: new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;

    // Nếu chưa load history, set greeting
    if (messages.length === 0) {
      setMessages([makeGreeting()]);
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(trimmed);

      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.botMessage || 'Mình chưa nhận được phản hồi. Thử lại nhé!',
        time: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      console.error('Chat API error:', err);
      let errorText = 'Đã xảy ra lỗi kết nối. Vui lòng thử lại.';
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        errorText = 'Không thể kết nối server. Hãy kiểm tra kết nối mạng.';
      } else if (err.response?.status === 400) {
        errorText = 'Tin nhắn không hợp lệ. Vui lòng thử lại.';
      } else if (err.response?.status >= 500) {
        errorText = 'Server đang bận. Vui lòng thử lại sau vài giây.';
      }
      setError(errorText);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          sender: 'bot',
          text: errorText,
          time: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, messages.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99998] bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-24 right-6 z-[99999] flex flex-col w-[95vw] max-w-[380px] h-[580px] max-h-[85vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <Bot size={22} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
                    <span className="sr-only">Online</span>
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Chatbot AI</h3>
                  <p className="text-xs text-blue-100 flex items-center gap-1">
                    <Sparkles size={10} />
                    Powered by Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Đóng chatbot"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Suggested Questions */}
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 shrink-0">
              <p className="text-xs font-semibold text-blue-600 mb-2">Câu hỏi phổ biến:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-xs px-2.5 py-1 rounded-full bg-white border border-blue-200 text-blue-700 font-medium transition-all hover:bg-blue-100 hover:border-blue-300 active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50 scrollbar-thin">
              {messages.length === 0 && !isTyping && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <Bot size={32} className="opacity-30" />
                  <p className="text-sm text-center">Đang tải lịch sử chat...</p>
                </div>
              )}

              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-2"
                >
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </motion.div>
              )}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-end gap-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-sm ring-1 ring-gray-100">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-gray-100 bg-white p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 max-h-28"
                  style={{ minHeight: '42px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  aria-label="Gửi tin nhắn"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all ${
                    inputValue.trim() && !isTyping
                      ? 'bg-blue-600 hover:bg-blue-700 active:scale-90 cursor-pointer shadow-lg shadow-blue-500/30'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} className={inputValue.trim() && !isTyping ? '' : 'opacity-50'} />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-gray-400">
                Nhấn Enter để gửi
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ChatBubble = ({ message }) => {
  const isUser = message.sender === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
          isUser ? 'bg-blue-600' : 'bg-emerald-500'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm ring-1 ring-gray-100 ${
          isUser
            ? 'rounded-br-md bg-blue-600 text-white'
            : 'rounded-bl-md bg-white text-gray-800'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        <p className={`mt-0.5 text-[10px] ${isUser ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
          {message.time}
        </p>
      </div>
    </motion.div>
  );
};
