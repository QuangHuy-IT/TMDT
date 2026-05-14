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

export const sendChatMessage = async (message) => {
  const sessionId = getOrCreateSessionId();
  const response = await api.post('/chat', { sessionId, message });
  return response.data;
};

export const getChatHistory = async (sessionId) => {
  const response = await api.get(`/chat/${sessionId}`);
  return response.data;
};
