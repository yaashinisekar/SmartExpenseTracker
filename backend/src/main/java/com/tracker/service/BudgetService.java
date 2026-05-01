package com.tracker.service;

import com.tracker.dto.BudgetDTO;
import com.tracker.entity.Budget;
import com.tracker.entity.Category;
import com.tracker.entity.User;
import com.tracker.repository.BudgetRepository;
import com.tracker.repository.CategoryRepository;
import com.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public List<BudgetDTO> getUserBudgetsByMonthAndYear(Long userId, Integer month, Integer year) {
        return budgetRepository.findByUserIdAndMonthAndYear(userId, month, year).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public BudgetDTO setBudget(Long userId, BudgetDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Budget budget = budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(
                userId, dto.getCategoryId(), dto.getMonth(), dto.getYear()).orElse(new Budget());

        budget.setUser(user);
        budget.setCategory(category);
        budget.setAmount(dto.getAmount());
        budget.setMonth(dto.getMonth());
        budget.setYear(dto.getYear());

        return mapToDTO(budgetRepository.save(budget));
    }

    public void deleteBudget(Long id, Long userId) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        budgetRepository.delete(budget);
    }

    private BudgetDTO mapToDTO(Budget budget) {
        return BudgetDTO.builder()
                .id(budget.getId())
                .categoryId(budget.getCategory().getId())
                .categoryName(budget.getCategory().getName())
                .amount(budget.getAmount())
                .month(budget.getMonth())
                .year(budget.getYear())
                .build();
    }
}
