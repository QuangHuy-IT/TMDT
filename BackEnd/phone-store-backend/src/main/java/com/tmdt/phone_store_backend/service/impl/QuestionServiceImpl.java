package com.tmdt.phone_store_backend.service.impl;

import com.tmdt.phone_store_backend.domain.entity.Answer;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.Question;
import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.dto.AnswerDto;
import com.tmdt.phone_store_backend.dto.CreateAnswerRequestDto;
import com.tmdt.phone_store_backend.dto.CreateQuestionRequestDto;
import com.tmdt.phone_store_backend.dto.PagedQuestionResponseDto;
import com.tmdt.phone_store_backend.dto.QuestionDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.AnswerRepository;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.QuestionRepository;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.service.QuestionService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public PagedQuestionResponseDto getProductQuestions(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Question> questionPage = questionRepository.findByProductIdWithDetails(productId, pageable);
        return buildPagedResponse(questionPage);
    }

    @Override
    public long countProductQuestions(Long productId) {
        return questionRepository.countByProductIdAndIsVisibleTrue(productId);
    }

    @Override
    @Transactional
    public QuestionDto createQuestion(Long userId, CreateQuestionRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
        Product product = productRepository.findByIdAndDeletedAtIsNull(requestDto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm."));

        Question question = Question.builder()
                .product(product)
                .user(user)
                .content(requestDto.getContent())
                .isAnswered(false)
                .isVisible(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Question saved = questionRepository.save(question);
        return toDto(saved, false);
    }

    @Override
    @Transactional
    public AnswerDto createAnswer(Long questionId, Long userId, CreateAnswerRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));

        Answer answer = Answer.builder()
                .question(question)
                .user(user)
                .content(requestDto.getContent())
                .isAdminAnswer(user.getRole() == UserRole.ADMIN)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Answer saved = answerRepository.save(answer);

        question.setIsAnswered(true);
        question.setUpdatedAt(LocalDateTime.now());
        questionRepository.save(question);

        return toAnswerDto(saved);
    }

    @Override
    public List<AnswerDto> getQuestionAnswers(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        return question.getAnswers().stream()
                .map(this::toAnswerDto)
                .toList();
    }

    @Override
    public QuestionDto getQuestionById(Long questionId) {
        Question question = questionRepository.findByIdWithUserAndAnswers(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        return toDto(question, true);
    }

    @Override
    @Transactional
    public void deleteQuestionByUser(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        if (!question.getUser().getId().equals(userId)) {
            throw new SecurityException("Bạn không có quyền xóa câu hỏi này.");
        }
        if (question.getAnswers() != null && !question.getAnswers().isEmpty()) {
            answerRepository.deleteAll(question.getAnswers());
        }
        questionRepository.delete(question);
    }

    @Override
    @Transactional
    public QuestionDto updateQuestion(Long questionId, Long userId, String newContent) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        if (!question.getUser().getId().equals(userId)) {
            throw new SecurityException("Bạn không có quyền sửa câu hỏi này.");
        }
        question.setContent(newContent);
        question.setUpdatedAt(LocalDateTime.now());
        Question saved = questionRepository.save(question);
        return toDto(saved, true);
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN METHODS
    // ══════════════════════════════════════════════════════════════

    @Override
    @Transactional(readOnly = true)
    public PagedQuestionResponseDto getAllQuestions(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Question> questionPage = questionRepository.findAllWithDetails(pageable);
        return buildPagedResponse(questionPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedQuestionResponseDto getPendingQuestions(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Question> questionPage = questionRepository.findPendingWithDetails(pageable);
        return buildPagedResponse(questionPage);
    }

    @Override
    @Transactional(readOnly = true)
    public long countAllQuestions() {
        return questionRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingQuestions() {
        return questionRepository.countByIsAnsweredFalse();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedQuestionResponseDto searchQuestions(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Question> questionPage = questionRepository.findByIsVisibleTrueOrderByCreatedAtDesc(pageable);
        List<Question> filtered = questionPage.getContent().stream()
                .filter(q -> {
                    String qLower = (q.getContent() != null ? q.getContent() : "").toLowerCase();
                    String userLower = (q.getUser() != null && q.getUser().getFullName() != null
                            ? q.getUser().getFullName() : "").toLowerCase();
                    String productLower = (q.getProduct() != null && q.getProduct().getName() != null
                            ? q.getProduct().getName() : "").toLowerCase();
                    String qSearch = query.toLowerCase();
                    return qLower.contains(qSearch) || userLower.contains(qSearch) || productLower.contains(qSearch);
                })
                .toList();
        long total = questionPage.getTotalElements();
        return PagedQuestionResponseDto.builder()
                .questions(filtered.stream().map(q -> toDto(q, true)).toList())
                .totalElements(total)
                .totalPages(questionPage.getTotalPages())
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    @Override
    @Transactional
    public void deleteQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        if (question.getAnswers() != null && !question.getAnswers().isEmpty()) {
            answerRepository.deleteAll(question.getAnswers());
        }
        questionRepository.delete(question);
    }

    @Override
    @Transactional
    public void hideQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        question.setIsVisible(false);
        question.setUpdatedAt(LocalDateTime.now());
        questionRepository.save(question);
    }

    @Override
    @Transactional
    public void showQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        question.setIsVisible(true);
        question.setUpdatedAt(LocalDateTime.now());
        questionRepository.save(question);
    }

    @Override
    @Transactional
    public AnswerDto answerQuestion(Long questionId, Long userId, String content) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

        Answer answer = Answer.builder()
                .question(question)
                .user(user)
                .content(content)
                .isAdminAnswer(user.getRole() == UserRole.ADMIN)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Answer saved = answerRepository.save(answer);

        question.setIsAnswered(true);
        question.setUpdatedAt(LocalDateTime.now());
        questionRepository.save(question);

        return toAnswerDto(saved);
    }

    // ══════════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════════

    private PagedQuestionResponseDto buildPagedResponse(Page<Question> questionPage) {
        List<QuestionDto> dtos = questionPage.getContent().stream()
                .map(q -> toDto(q, true))
                .toList();
        return PagedQuestionResponseDto.builder()
                .questions(dtos)
                .totalElements(questionPage.getTotalElements())
                .totalPages(questionPage.getTotalPages())
                .currentPage(questionPage.getNumber())
                .pageSize(questionPage.getSize())
                .build();
    }

    private QuestionDto toDto(Question question, boolean includeAnswers) {
        List<AnswerDto> answerDtos = new ArrayList<>();
        if (includeAnswers && question.getAnswers() != null) {
            answerDtos = question.getAnswers().stream()
                    .map(this::toAnswerDto)
                    .toList();
        }
        Product p = question.getProduct();
        User u = question.getUser();
        return QuestionDto.builder()
                .id(question.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getName() : "Sản phẩm đã bị xóa")
                .userId(u != null ? u.getId() : null)
                .userFullName(u != null ? u.getFullName() : "Người dùng đã bị xóa")
                .userAvatarUrl(u != null ? u.getAvatarUrl() : null)
                .content(question.getContent())
                .isAnswered(question.getIsAnswered())
                .isVisible(question.getIsVisible())
                .answers(answerDtos)
                .createdAt(question.getCreatedAt())
                .build();
    }

    private AnswerDto toAnswerDto(Answer answer) {
        return AnswerDto.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion() != null ? answer.getQuestion().getId() : null)
                .userId(answer.getUser() != null ? answer.getUser().getId() : null)
                .userFullName(answer.getUser() != null ? answer.getUser().getFullName() : null)
                .userAvatarUrl(answer.getUser() != null ? answer.getUser().getAvatarUrl() : null)
                .isAdminAnswer(answer.getIsAdminAnswer())
                .content(answer.getContent())
                .createdAt(answer.getCreatedAt())
                .build();
    }
}
