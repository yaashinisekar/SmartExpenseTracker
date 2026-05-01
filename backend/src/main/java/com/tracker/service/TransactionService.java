package com.tracker.service;

import com.tracker.dto.TransactionDTO;
import com.tracker.entity.Category;
import com.tracker.entity.Transaction;
import com.tracker.entity.User;
import com.tracker.repository.CategoryRepository;
import com.tracker.repository.TransactionRepository;
import com.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public List<TransactionDTO> getAllUserTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByDateDesc(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TransactionDTO createTransaction(Long userId, TransactionDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Transaction transaction = Transaction.builder()
                .user(user)
                .category(category)
                .amount(dto.getAmount())
                .type(dto.getType())
                .date(dto.getDate())
                .description(dto.getDescription())
                .tags(dto.getTags())
                .build();

        return mapToDTO(transactionRepository.save(transaction));
    }

    public TransactionDTO updateTransaction(Long transactionId, Long userId, TransactionDTO dto) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        transaction.setCategory(category);
        transaction.setAmount(dto.getAmount());
        transaction.setType(dto.getType());
        transaction.setDate(dto.getDate());
        transaction.setDescription(dto.getDescription());
        transaction.setTags(dto.getTags());

        return mapToDTO(transactionRepository.save(transaction));
    }

    public void deleteTransaction(Long transactionId, Long userId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        transactionRepository.deleteById(transactionId);
    }

    private TransactionDTO mapToDTO(Transaction transaction) {
        return TransactionDTO.builder()
                .id(transaction.getId())
                .categoryId(transaction.getCategory().getId())
                .categoryName(transaction.getCategory().getName())
                .amount(transaction.getAmount())
                .type(transaction.getType())
                .date(transaction.getDate())
                .description(transaction.getDescription())
                .tags(transaction.getTags())
                .build();
    }
}
