package com.tracker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_scenarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ScenarioType type;

    @Column(length = 500)
    private String description;

    @Builder.Default
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal oneTimeAmount = BigDecimal.ZERO;

    private LocalDate oneTimeDate;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isExpense = true;

    @Builder.Default
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal recurringMonthlyAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private Integer recurringDurationMonths = 0;

    @Builder.Default
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal incomeChangeMonthlyAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private Integer incomeChangeDurationMonths = 0;

    @Column(precision = 15, scale = 2)
    private BigDecimal targetSavingsCushion;

    @Column(precision = 15, scale = 2)
    private BigDecimal customStartingFunds;

    @Builder.Default
    @Column(nullable = false)
    private Integer projectionHorizonMonths = 6;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
