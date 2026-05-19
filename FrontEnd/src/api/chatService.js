import api from './axiosInstance';

const SESSION_KEY = 'chatbot_session_id';

export const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
};

// Sử dụng AI Chat API mới
export const sendChatMessage = async (message) => {
  const sessionId = getOrCreateSessionId();
  try {
    const response = await api.post('/ai/chat', { sessionId, message });
    return response.data;
  } catch (error) {
    // Fallback về API cũ nếu API mới lỗi
    try {
      const response = await api.post('/chat', { sessionId, message });
      return response.data;
    } catch (fallbackError) {
      throw error;
    }
  }
};

export const getChatHistory = async (sessionId) => {
  try {
    const response = await api.get(`/chat/${sessionId}`);
    return response.data;
  } catch (error) {
    // Return empty history if API fails
    return { messages: [] };
  }
};

// AI Compare API
export const compareProducts = async (productNames) => {
  const response = await api.post('/ai/compare', { productNames });
  return response.data;
};

// AI Compare by IDs
export const compareProductsByIds = async (productIds) => {
  const response = await api.post('/ai/compare', { productIds });
  return response.data;
};

// AI Recommend API
export const getRecommendations = async (query, sessionId, limit = 5) => {
  const response = await api.post('/ai/recommend', {
    sessionId,
    query,
    limit
  });
  return response.data;
};

// AI Similar Products
export const getSimilarProducts = async (productId, limit = 5) => {
  const response = await api.get(`/ai/recommend/similar/${productId}?limit=${limit}`);
  return response.data;
};
