import api from '../api/axiosInstance';

const QuestionService = {
  getProductQuestions: (productId, params = {}) =>
    api.get(`/products/${productId}/questions`, { params }),

  getQuestionCount: (productId) =>
    api.get(`/products/${productId}/questions/count`),

  createQuestion: (userId, questionData) =>
    api.post('/products/questions', questionData, { params: { userId } }),

  getAnswers: (questionId) =>
    api.get(`/products/questions/${questionId}/answers`),

  createAnswer: (questionId, userId, answerData) =>
    api.post(`/products/questions/${questionId}/answers`, answerData, { params: { userId } }),

  getQuestion: (questionId) =>
    api.get(`/products/questions/${questionId}`),
};

export default QuestionService;
