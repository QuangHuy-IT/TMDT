package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.AnswerDto;
import com.tmdt.phone_store_backend.dto.CreateAnswerRequestDto;
import com.tmdt.phone_store_backend.dto.CreateQuestionRequestDto;
import com.tmdt.phone_store_backend.dto.PagedQuestionResponseDto;
import com.tmdt.phone_store_backend.dto.QuestionDto;
import java.util.List;

public interface QuestionService {

    PagedQuestionResponseDto getProductQuestions(Long productId, int page, int size);

    long countProductQuestions(Long productId);

    QuestionDto createQuestion(Long userId, CreateQuestionRequestDto requestDto);

    AnswerDto createAnswer(Long questionId, Long userId, CreateAnswerRequestDto requestDto);

    List<AnswerDto> getQuestionAnswers(Long questionId);

    void deleteQuestionByUser(Long questionId, Long userId);

    QuestionDto updateQuestion(Long questionId, Long userId, String newContent);

    // Admin methods
    PagedQuestionResponseDto getAllQuestions(int page, int size);

    PagedQuestionResponseDto getPendingQuestions(int page, int size);

    long countAllQuestions();

    long countPendingQuestions();

    PagedQuestionResponseDto searchQuestions(String query, int page, int size);

    QuestionDto getQuestionById(Long questionId);

    void deleteQuestion(Long questionId);

    void hideQuestion(Long questionId);

    void showQuestion(Long questionId);

    AnswerDto answerQuestion(Long questionId, Long userId, String content);
}
