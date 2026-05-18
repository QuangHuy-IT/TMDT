package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.CreateAnswerRequestDto;
import com.tmdt.phone_store_backend.dto.CreateQuestionRequestDto;
import com.tmdt.phone_store_backend.dto.PagedQuestionResponseDto;
import com.tmdt.phone_store_backend.dto.QuestionDto;
import com.tmdt.phone_store_backend.dto.AnswerDto;
import com.tmdt.phone_store_backend.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/{productId}/questions")
    public ResponseEntity<PagedQuestionResponseDto> getProductQuestions(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(questionService.getProductQuestions(productId, page, size));
    }

    @GetMapping("/{productId}/questions/count")
    public ResponseEntity<?> getQuestionCount(@PathVariable Long productId) {
        long count = questionService.countProductQuestions(productId);
        return ResponseEntity.ok(java.util.Map.of("count", count));
    }

    @PostMapping("/questions")
    public ResponseEntity<QuestionDto> createQuestion(
            @RequestParam Long userId,
            @Valid @RequestBody CreateQuestionRequestDto requestDto) {
        return ResponseEntity.ok(questionService.createQuestion(userId, requestDto));
    }

    @GetMapping("/questions/{questionId}")
    public ResponseEntity<QuestionDto> getQuestion(@PathVariable Long questionId) {
        return ResponseEntity.ok(questionService.getQuestionById(questionId));
    }

    @PostMapping("/questions/{questionId}/answers")
    public ResponseEntity<AnswerDto> createAnswer(
            @PathVariable Long questionId,
            @RequestParam Long userId,
            @Valid @RequestBody CreateAnswerRequestDto requestDto) {
        return ResponseEntity.ok(questionService.createAnswer(questionId, userId, requestDto));
    }

    @GetMapping("/questions/{questionId}/answers")
    public ResponseEntity<List<AnswerDto>> getAnswers(@PathVariable Long questionId) {
        return ResponseEntity.ok(questionService.getQuestionAnswers(questionId));
    }
}
