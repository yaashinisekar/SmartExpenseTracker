package com.tracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyProjectionDTO {
    private int monthIndex;
    private String yearMonth;
    private String label;
    private BigDecimal openingBalance;
    private BigDecimal baselineIncome;
    private BigDecimal scenarioIncomeAdjustment;
    private BigDecimal totalIncome;
    private BigDecimal baselineExpense;
    private BigDecimal scenarioExpenseAdjustment;
    private BigDecimal totalExpense;
    private BigDecimal netCashFlow;
    private BigDecimal closingBalance;
    private BigDecimal baselineClosingBalance;
    private boolean cushionBreached;
}
