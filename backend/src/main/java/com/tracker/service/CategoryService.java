package com.tracker.service;

import com.tracker.dto.CategoryDTO;
import com.tracker.entity.Category;
import com.tracker.entity.User;
import com.tracker.repository.CategoryRepository;
import com.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<CategoryDTO> getUserCategories(Long userId) {
        return categoryRepository.findByUserIdOrUserIsNull(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CategoryDTO createCategory(Long userId, CategoryDTO categoryDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = Category.builder()
                .name(categoryDTO.getName())
                .type(categoryDTO.getType())
                .user(user)
                .icon(categoryDTO.getIcon())
                .build();

        return mapToDTO(categoryRepository.save(category));
    }

    public CategoryDTO updateCategory(Long id, Long userId, CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (category.getUser() == null || !category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this category");
        }

        category.setName(categoryDTO.getName());
        category.setIcon(categoryDTO.getIcon());
        return mapToDTO(categoryRepository.save(category));
    }

    public void deleteCategory(Long id, Long userId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (category.getUser() == null || !category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this category");
        }

        categoryRepository.deleteById(id);
    }

    private CategoryDTO mapToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .icon(category.getIcon())
                .build();
    }
}
