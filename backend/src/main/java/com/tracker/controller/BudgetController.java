package com.tracker.controller;

import com.tracker.dto.BudgetDTO;
import com.tracker.security.UserDetailsImpl;
import com.tracker.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetDTO>> getBudgets(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        int m = (month == null) ? java.time.LocalDate.now().getMonthValue() : month;
        int y = (year == null) ? java.time.LocalDate.now().getYear() : year;
        return ResponseEntity.ok(budgetService.getUserBudgetsByMonthAndYear(userDetails.getId(), m, y));
    }

    @PostMapping
    public ResponseEntity<BudgetDTO> setBudget(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody BudgetDTO budgetDTO) {
        return ResponseEntity.ok(budgetService.setBudget(userDetails.getId(), budgetDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBudget(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        budgetService.deleteBudget(id, userDetails.getId());
        return ResponseEntity.ok().build();
    }
}
