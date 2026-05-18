package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.AnswerDto;
import com.tmdt.phone_store_backend.dto.PagedQuestionResponseDto;
import com.tmdt.phone_store_backend.dto.QuestionDto;
import com.tmdt.phone_store_backend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionService questionService;

    @GetMapping
    public ResponseEntity<PagedQuestionResponseDto> getAllQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(questionService.getAllQuestions(page, size));
    }

    @GetMapping("/pending")
    public ResponseEntity<PagedQuestionResponseDto> getPendingQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(questionService.getPendingQuestions(page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<PagedQuestionResponseDto> searchQuestions(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(questionService.searchQuestions(q, page, size));
    }

    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionDto> getQuestion(@PathVariable Long questionId) {
        return ResponseEntity.ok(questionService.getQuestionById(questionId));
    }

    @PostMapping("/{questionId}/answer")
    public ResponseEntity<AnswerDto> answerQuestion(
            @PathVariable Long questionId,
            @RequestParam Long adminUserId,
            @RequestBody String content) {
        return ResponseEntity.ok(questionService.answerQuestion(questionId, adminUserId, content.trim()));
    }

    @PostMapping("/{questionId}/hide")
    public ResponseEntity<?> hideQuestion(@PathVariable Long questionId) {
        questionService.hideQuestion(questionId);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }

    @PostMapping("/{questionId}/show")
    public ResponseEntity<?> showQuestion(@PathVariable Long questionId) {
        questionService.showQuestion(questionId);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long questionId) {
        questionService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}
