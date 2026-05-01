package com.tracker.controller;

import com.tracker.dto.CategoryDTO;
import com.tracker.security.UserDetailsImpl;
import com.tracker.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getCategories(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(categoryService.getUserCategories(userDetails.getId()));
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CategoryDTO categoryDTO) {
        return ResponseEntity.ok(categoryService.createCategory(userDetails.getId(), categoryDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CategoryDTO categoryDTO) {
        return ResponseEntity.ok(categoryService.updateCategory(id, userDetails.getId(), categoryDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        categoryService.deleteCategory(id, userDetails.getId());
        return ResponseEntity.ok("Category deleted successfully");
    }
}
