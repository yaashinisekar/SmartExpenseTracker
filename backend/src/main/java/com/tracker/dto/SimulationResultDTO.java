package com.tracker.dto;

import com.tracker.entity.ScenarioType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulationResultDTO {
    private Long scenarioId;
    private String scenarioName;
    private ScenarioType scenarioType;

    // Affordability Verdict: HIGHLY_AFFORDABLE, MODERATE_RISK, CRITICAL_STRESS, UNSUSTAINABLE
    private String affordabilityVerdict;
    private String verdictTitle;
    private String verdictSummary;

    // Baseline stats
    private BigDecimal startingBalance;
    private boolean startingBalanceEstimated;
    private BigDecimal monthlyBaselineIncome;
    private BigDecimal monthlyBaselineExpense;
    private BigDecimal monthlyBaselineSurplus;
    private String dataConfidence; // HIGH, MODERATE, LOW_TRANSACTION_HISTORY

    // Simulation outcome
    private BigDecimal projectedLowestBalance;
    private String lowestBalanceMonth;
    private BigDecimal projectedFinalBalance;
    private BigDecimal baselineFinalBalance;
    private BigDecimal netScenarioImpact;
    private Integer savingsRecoveryMonths; // null if not recovered within horizon

    // Cushion / Goals
    private BigDecimal targetSavingsCushion;
    private Boolean targetCushionMaintained;

    // Explainable Insights
    private List<String> explainableFactors;
    private List<String> assumptions;
    private String tradeOffSummary;
    private List<String> recommendations;

    // Timeline breakdown
    private List<MonthlyProjectionDTO> monthlyProjections;
}
