package com.tracker.dto;

import com.tracker.entity.ScenarioType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScenarioRequestDTO {

    @NotBlank(message = "Scenario name is required")
    @Size(max = 120, message = "Scenario name must not exceed 120 characters")
    private String name;

    @NotNull(message = "Scenario type is required")
    private ScenarioType type;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @DecimalMin(value = "0.0", message = "One-time amount cannot be negative")
    private BigDecimal oneTimeAmount;

    private LocalDate oneTimeDate;

    @Builder.Default
    private Boolean isExpense = true;

    @DecimalMin(value = "0.0", message = "Recurring amount cannot be negative")
    private BigDecimal recurringMonthlyAmount;

    @Min(value = 0, message = "Recurring duration must be at least 0 months")
    @Max(value = 60, message = "Recurring duration cannot exceed 60 months")
    private Integer recurringDurationMonths;

    private BigDecimal incomeChangeMonthlyAmount;

    @Min(value = 0, message = "Income change duration must be at least 0 months")
    @Max(value = 60, message = "Income change duration cannot exceed 60 months")
    private Integer incomeChangeDurationMonths;

    @DecimalMin(value = "0.0", message = "Target savings cushion cannot be negative")
    private BigDecimal targetSavingsCushion;

    @DecimalMin(value = "0.0", message = "Custom starting funds cannot be negative")
    private BigDecimal customStartingFunds;

    @Min(value = 1, message = "Projection horizon must be at least 1 month")
    @Max(value = 36, message = "Projection horizon cannot exceed 36 months")
    @Builder.Default
    private Integer projectionHorizonMonths = 6;
}
