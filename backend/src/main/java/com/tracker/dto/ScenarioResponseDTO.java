package com.tracker.dto;

import com.tracker.entity.ScenarioType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScenarioResponseDTO {
    private Long id;
    private String name;
    private ScenarioType type;
    private String description;
    private BigDecimal oneTimeAmount;
    private LocalDate oneTimeDate;
    private Boolean isExpense;
    private BigDecimal recurringMonthlyAmount;
    private Integer recurringDurationMonths;
    private BigDecimal incomeChangeMonthlyAmount;
    private Integer incomeChangeDurationMonths;
    private BigDecimal targetSavingsCushion;
    private BigDecimal customStartingFunds;
    private Integer projectionHorizonMonths;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Computed simulation metrics
    private SimulationResultDTO simulation;
}
