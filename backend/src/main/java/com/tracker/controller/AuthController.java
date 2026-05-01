package com.tracker.controller;

import com.tracker.dto.AuthRequest;
import com.tracker.dto.AuthResponse;
import com.tracker.dto.RegisterRequest;
import com.tracker.dto.UserDTO;
import com.tracker.entity.Category;
import com.tracker.entity.TransactionType;
import com.tracker.entity.User;
import com.tracker.repository.CategoryRepository;
import com.tracker.repository.UserRepository;
import com.tracker.security.JwtUtils;
import com.tracker.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwt)
                .user(UserDTO.builder()
                        .id(userDetails.getId())
                        .email(userDetails.getEmail())
                        .firstName(userDetails.getFirstName())
                        .lastName(userDetails.getLastName())
                        .build())
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        User user = User.builder()
                .firstName(signUpRequest.getFirstName())
                .lastName(signUpRequest.getLastName())
                .email(signUpRequest.getEmail())
                .passwordHash(encoder.encode(signUpRequest.getPassword()))
                .role("ROLE_USER")
                .build();

        user = userRepository.save(user);

        List<Category> defaultCategories = List.of(
                // Expense
                Category.builder().name("Food").type(TransactionType.EXPENSE).user(user).icon("🍔").build(),
                Category.builder().name("Travel").type(TransactionType.EXPENSE).user(user).icon("🚗").build(),
                Category.builder().name("Shopping").type(TransactionType.EXPENSE).user(user).icon("🛍️").build(),
                Category.builder().name("Bills").type(TransactionType.EXPENSE).user(user).icon("💡").build(),
                Category.builder().name("Health").type(TransactionType.EXPENSE).user(user).icon("💊").build(),
                Category.builder().name("Education").type(TransactionType.EXPENSE).user(user).icon("📚").build(),
                Category.builder().name("Entertainment").type(TransactionType.EXPENSE).user(user).icon("🍿").build(),
                // Income
                Category.builder().name("Salary").type(TransactionType.INCOME).user(user).icon("💼").build(),
                Category.builder().name("Freelancing").type(TransactionType.INCOME).user(user).icon("💻").build(),
                Category.builder().name("Business").type(TransactionType.INCOME).user(user).icon("📈").build(),
                Category.builder().name("Investments").type(TransactionType.INCOME).user(user).icon("💰").build());
        categoryRepository.saveAll(defaultCategories);

        return ResponseEntity.ok("User registered successfully!");
    }
}
