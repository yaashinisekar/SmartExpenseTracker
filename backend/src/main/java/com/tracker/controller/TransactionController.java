package com.tracker.controller;

import com.tracker.dto.TransactionDTO;
import com.tracker.security.UserDetailsImpl;
import com.tracker.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionDTO>> getAllTransactions(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(transactionService.getAllUserTransactions(userDetails.getId()));
    }

    @PostMapping
    public ResponseEntity<TransactionDTO> createTransaction(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody TransactionDTO transactionDTO) {
        return ResponseEntity.ok(transactionService.createTransaction(userDetails.getId(), transactionDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDTO> updateTransaction(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @Valid @RequestBody TransactionDTO transactionDTO) {
        return ResponseEntity.ok(transactionService.updateTransaction(id, userDetails.getId(), transactionDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        transactionService.deleteTransaction(id, userDetails.getId());
        return ResponseEntity.ok("Transaction deleted successfully");
    }
}
