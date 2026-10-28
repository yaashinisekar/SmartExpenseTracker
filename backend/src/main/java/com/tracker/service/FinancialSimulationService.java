package com.tracker.service;

import com.tracker.dto.MonthlyProjectionDTO;
import com.tracker.dto.ScenarioRequestDTO;
import com.tracker.dto.SimulationResultDTO;
import com.tracker.entity.FinancialScenario;
import com.tracker.entity.Transaction;
import com.tracker.entity.TransactionType;
import com.tracker.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinancialSimulationService {

    private final TransactionRepository transactionRepository;

    private static final DateTimeFormatter MONTH_LABEL_FMT = DateTimeFormatter.ofPattern("MMM yyyy");
    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    /**
     * Runs simulation for an existing saved scenario entity.
     */
    public SimulationResultDTO simulate(FinancialScenario scenario, Long userId) {
        ScenarioRequestDTO request = ScenarioRequestDTO.builder()
                .name(scenario.getName())
                .type(scenario.getType())
                .description(scenario.getDescription())
                .oneTimeAmount(scenario.getOneTimeAmount())
                .oneTimeDate(scenario.getOneTimeDate())
                .isExpense(scenario.getIsExpense())
                .recurringMonthlyAmount(scenario.getRecurringMonthlyAmount())
                .recurringDurationMonths(scenario.getRecurringDurationMonths())
                .incomeChangeMonthlyAmount(scenario.getIncomeChangeMonthlyAmount())
                .incomeChangeDurationMonths(scenario.getIncomeChangeDurationMonths())
                .targetSavingsCushion(scenario.getTargetSavingsCushion())
                .customStartingFunds(scenario.getCustomStartingFunds())
                .projectionHorizonMonths(scenario.getProjectionHorizonMonths())
                .build();

        SimulationResultDTO result = runSimulation(userId, request);
        result.setScenarioId(scenario.getId());
        result.setScenarioName(scenario.getName());
        result.setScenarioType(scenario.getType());
        return result;
    }

    /**
     * Runs simulation on arbitrary request parameters (for preview, what-if sandbox, or unsaved scenarios).
     */
    public SimulationResultDTO runSimulation(Long userId, ScenarioRequestDTO req) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);

        // 1. Calculate historical baseline metrics from transactions
        BaselineStats baseline = calculateBaseline(transactions, req.getCustomStartingFunds());

        // 2. Prepare scenario parameters with safe null-checks
        BigDecimal oneTimeAmt = req.getOneTimeAmount() != null ? req.getOneTimeAmount() : BigDecimal.ZERO;
        LocalDate oneTimeDate = req.getOneTimeDate() != null ? req.getOneTimeDate() : LocalDate.now();
        boolean isExpense = req.getIsExpense() != null ? req.getIsExpense() : true;
        BigDecimal recurringAmt = req.getRecurringMonthlyAmount() != null ? req.getRecurringMonthlyAmount() : BigDecimal.ZERO;
        int recurringDuration = req.getRecurringDurationMonths() != null ? req.getRecurringDurationMonths() : 0;
        BigDecimal incomeChangeAmt = req.getIncomeChangeMonthlyAmount() != null ? req.getIncomeChangeMonthlyAmount() : BigDecimal.ZERO;
        int incomeChangeDuration = req.getIncomeChangeDurationMonths() != null ? req.getIncomeChangeDurationMonths() : 0;
        BigDecimal targetCushion = req.getTargetSavingsCushion();
        int horizon = (req.getProjectionHorizonMonths() != null && req.getProjectionHorizonMonths() > 0)
                ? req.getProjectionHorizonMonths() : 6;

        YearMonth startYearMonth = YearMonth.now();
        YearMonth oneTimeYearMonth = YearMonth.from(oneTimeDate);

        // 3. Chronological Month-by-Month Simulation
        List<MonthlyProjectionDTO> projections = new ArrayList<>();
        BigDecimal runningBalance = baseline.startingBalance;
        BigDecimal runningBaselineBalance = baseline.startingBalance;

        BigDecimal lowestBalance = runningBalance;
        String lowestBalanceMonth = startYearMonth.format(MONTH_LABEL_FMT);
        boolean anyCushionBreached = false;
        Integer recoveryMonthIndex = null;

        for (int i = 1; i <= horizon; i++) {
            YearMonth currentYm = startYearMonth.plusMonths(i - 1);
            String ymStr = currentYm.format(YEAR_MONTH_FMT);
            String label = currentYm.format(MONTH_LABEL_FMT);

            BigDecimal openingBal = runningBalance;

            // Scenario Income Adjustment
            BigDecimal scenarioIncomeAdj = BigDecimal.ZERO;
            if (!isExpense && currentYm.equals(oneTimeYearMonth)) {
                scenarioIncomeAdj = scenarioIncomeAdj.add(oneTimeAmt);
            }
            if (i <= incomeChangeDuration && incomeChangeAmt.compareTo(BigDecimal.ZERO) > 0) {
                scenarioIncomeAdj = scenarioIncomeAdj.add(incomeChangeAmt);
            }

            // Scenario Expense Adjustment
            BigDecimal scenarioExpenseAdj = BigDecimal.ZERO;
            if (isExpense && currentYm.equals(oneTimeYearMonth)) {
                scenarioExpenseAdj = scenarioExpenseAdj.add(oneTimeAmt);
            }
            if (i <= recurringDuration) {
                scenarioExpenseAdj = scenarioExpenseAdj.add(recurringAmt);
            }
            // If negative income change, treat deduction as extra stress on cash flow
            if (i <= incomeChangeDuration && incomeChangeAmt.compareTo(BigDecimal.ZERO) < 0) {
                scenarioExpenseAdj = scenarioExpenseAdj.add(incomeChangeAmt.abs());
            }

            BigDecimal totalIncome = baseline.monthlyIncome.add(scenarioIncomeAdj);
            BigDecimal totalExpense = baseline.monthlyExpense.add(scenarioExpenseAdj);
            BigDecimal netCashFlow = totalIncome.subtract(totalExpense);

            runningBalance = openingBal.add(netCashFlow);

            // Baseline trajectory without this scenario
            BigDecimal baselineNetFlow = baseline.monthlyIncome.subtract(baseline.monthlyExpense);
            runningBaselineBalance = runningBaselineBalance.add(baselineNetFlow);

            boolean cushionBreached = targetCushion != null && runningBalance.compareTo(targetCushion) < 0;
            if (cushionBreached) {
                anyCushionBreached = true;
            }

            if (runningBalance.compareTo(lowestBalance) < 0) {
                lowestBalance = runningBalance;
                lowestBalanceMonth = label;
            }

            // Check if savings has recovered back to the starting balance (if one-time expense occurred)
            if (recoveryMonthIndex == null && i > 1 && runningBalance.compareTo(baseline.startingBalance) >= 0) {
                recoveryMonthIndex = i;
            }

            projections.add(MonthlyProjectionDTO.builder()
                    .monthIndex(i)
                    .yearMonth(ymStr)
                    .label(label)
                    .openingBalance(round(openingBal))
                    .baselineIncome(round(baseline.monthlyIncome))
                    .scenarioIncomeAdjustment(round(scenarioIncomeAdj))
                    .totalIncome(round(totalIncome))
                    .baselineExpense(round(baseline.monthlyExpense))
                    .scenarioExpenseAdjustment(round(scenarioExpenseAdj))
                    .totalExpense(round(totalExpense))
                    .netCashFlow(round(netCashFlow))
                    .closingBalance(round(runningBalance))
                    .baselineClosingBalance(round(runningBaselineBalance))
                    .cushionBreached(cushionBreached)
                    .build());
        }

        BigDecimal netScenarioImpact = runningBalance.subtract(runningBaselineBalance);

        // 4. Determine Affordability Verdict
        VerdictEvaluation verdict = evaluateAffordability(
                lowestBalance,
                targetCushion,
                baseline.startingBalance,
                runningBalance,
                baseline.monthlySurplus,
                projections
        );

        // 5. Build Explainable Insights & Trade-offs
        ExplainableReport report = buildExplainabilityReport(
                req,
                baseline,
                verdict,
                lowestBalance,
                lowestBalanceMonth,
                netScenarioImpact,
                targetCushion,
                anyCushionBreached,
                recoveryMonthIndex,
                horizon
        );

        return SimulationResultDTO.builder()
                .scenarioName(req.getName())
                .scenarioType(req.getType())
                .affordabilityVerdict(verdict.verdictCode)
                .verdictTitle(verdict.title)
                .verdictSummary(verdict.summary)
                .startingBalance(round(baseline.startingBalance))
                .startingBalanceEstimated(baseline.isStartingBalanceEstimated)
                .monthlyBaselineIncome(round(baseline.monthlyIncome))
                .monthlyBaselineExpense(round(baseline.monthlyExpense))
                .monthlyBaselineSurplus(round(baseline.monthlySurplus))
                .dataConfidence(baseline.confidence)
                .projectedLowestBalance(round(lowestBalance))
                .lowestBalanceMonth(lowestBalanceMonth)
                .projectedFinalBalance(round(runningBalance))
                .baselineFinalBalance(round(runningBaselineBalance))
                .netScenarioImpact(round(netScenarioImpact))
                .savingsRecoveryMonths(recoveryMonthIndex)
                .targetSavingsCushion(targetCushion != null ? round(targetCushion) : null)
                .targetCushionMaintained(!anyCushionBreached)
                .explainableFactors(report.factors)
                .assumptions(report.assumptions)
                .tradeOffSummary(report.tradeOff)
                .recommendations(report.recommendations)
                .monthlyProjections(projections)
                .build();
    }

    /**
     * Evaluates baseline historical statistics from recorded transactions.
     */
    private BaselineStats calculateBaseline(List<Transaction> transactions, BigDecimal customStartingFunds) {
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        Set<YearMonth> distinctMonths = new HashSet<>();

        for (Transaction tx : transactions) {
            distinctMonths.add(YearMonth.from(tx.getDate()));
            if (tx.getType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(tx.getAmount());
            } else if (tx.getType() == TransactionType.EXPENSE) {
                totalExpense = totalExpense.add(tx.getAmount());
            }
        }

        BigDecimal netRecorded = totalIncome.subtract(totalExpense);
        boolean isEstimated = (customStartingFunds == null);
        BigDecimal startingBalance = customStartingFunds != null
                ? customStartingFunds
                : (netRecorded.compareTo(BigDecimal.ZERO) > 0 ? netRecorded : BigDecimal.ZERO);

        int monthCount = Math.max(1, distinctMonths.size());
        BigDecimal monthlyIncome;
        BigDecimal monthlyExpense;

        String confidence;
        if (transactions.isEmpty()) {
            confidence = "LOW_TRANSACTION_HISTORY";
            monthlyIncome = BigDecimal.valueOf(50000); // Sensible baseline fallback for simulation
            monthlyExpense = BigDecimal.valueOf(30000);
        } else if (distinctMonths.size() < 2 || totalIncome.compareTo(BigDecimal.ZERO) == 0) {
            confidence = "MODERATE";
            monthlyIncome = totalIncome.compareTo(BigDecimal.ZERO) > 0
                    ? totalIncome.divide(BigDecimal.valueOf(monthCount), 2, RoundingMode.HALF_UP)
                    : BigDecimal.valueOf(40000);
            monthlyExpense = totalExpense.divide(BigDecimal.valueOf(monthCount), 2, RoundingMode.HALF_UP);
        } else {
            confidence = "HIGH";
            monthlyIncome = totalIncome.divide(BigDecimal.valueOf(monthCount), 2, RoundingMode.HALF_UP);
            monthlyExpense = totalExpense.divide(BigDecimal.valueOf(monthCount), 2, RoundingMode.HALF_UP);
        }

        BigDecimal monthlySurplus = monthlyIncome.subtract(monthlyExpense);

        return new BaselineStats(startingBalance, isEstimated, monthlyIncome, monthlyExpense, monthlySurplus, confidence);
    }

    private VerdictEvaluation evaluateAffordability(
            BigDecimal lowestBalance,
            BigDecimal targetCushion,
            BigDecimal startingBalance,
            BigDecimal finalBalance,
            BigDecimal monthlySurplus,
            List<MonthlyProjectionDTO> projections
    ) {
        // Condition 1: Negative balance (Deficit / Overdraft risk)
        if (lowestBalance.compareTo(BigDecimal.ZERO) < 0) {
            return new VerdictEvaluation(
                    "UNSUSTAINABLE",
                    "High Deficit Risk",
                    "This commitment drives your balance into negative funds, creating debt or immediate shortfall without external financing."
            );
        }

        // Condition 2: Safety cushion breached
        if (targetCushion != null && lowestBalance.compareTo(targetCushion) < 0) {
            return new VerdictEvaluation(
                    "CRITICAL_STRESS",
                    "Safety Cushion Breached",
                    "Affordable in absolute numbers, but dips below your designated emergency cushion, leaving you vulnerable to sudden shocks."
            );
        }

        // Condition 3: Negative cash flow in peak months or tight surplus
        boolean hasNegativeMonthlyFlow = projections.stream().anyMatch(p -> p.getNetCashFlow().compareTo(BigDecimal.ZERO) < 0);
        if (hasNegativeMonthlyFlow || monthlySurplus.compareTo(BigDecimal.valueOf(5000)) < 0) {
            return new VerdictEvaluation(
                    "MODERATE_RISK",
                    "Affordable with Caution",
                    "Feasible under current cash reserves, but creates temporary cash flow deficits or delays overall savings velocity."
            );
        }

        // Condition 4: High affordability
        return new VerdictEvaluation(
                "HIGHLY_AFFORDABLE",
                "Comfortably Affordable",
                "Your financial surplus easily absorbs this commitment while preserving your target emergency buffer throughout the horizon."
        );
    }

    private ExplainableReport buildExplainabilityReport(
            ScenarioRequestDTO req,
            BaselineStats baseline,
            VerdictEvaluation verdict,
            BigDecimal lowestBalance,
            String lowestMonth,
            BigDecimal netImpact,
            BigDecimal targetCushion,
            boolean cushionBreached,
            Integer recoveryMonth,
            int horizon
    ) {
        List<String> factors = new ArrayList<>();
        List<String> assumptions = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        // Factors
        if (req.getOneTimeAmount() != null && req.getOneTimeAmount().compareTo(BigDecimal.ZERO) > 0) {
            factors.add(String.format("One-time %s of ₹%s scheduled in %s.",
                    Boolean.TRUE.equals(req.getIsExpense()) ? "expense" : "inflow",
                    req.getOneTimeAmount().toPlainString(),
                    req.getOneTimeDate() != null ? req.getOneTimeDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) : "initial month"));
        }
        if (req.getRecurringMonthlyAmount() != null && req.getRecurringMonthlyAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal totalRec = req.getRecurringMonthlyAmount().multiply(BigDecimal.valueOf(req.getRecurringDurationMonths()));
            factors.add(String.format("Recurring commitment of ₹%s/month for %d months (Total: ₹%s).",
                    req.getRecurringMonthlyAmount().toPlainString(),
                    req.getRecurringDurationMonths(),
                    totalRec.toPlainString()));
        }
        if (req.getIncomeChangeMonthlyAmount() != null && req.getIncomeChangeMonthlyAmount().compareTo(BigDecimal.ZERO) != 0) {
            factors.add(String.format("Income shift of %s₹%s/month for %d months.",
                    req.getIncomeChangeMonthlyAmount().compareTo(BigDecimal.ZERO) > 0 ? "+" : "-",
                    req.getIncomeChangeMonthlyAmount().abs().toPlainString(),
                    req.getIncomeChangeDurationMonths()));
        }

        factors.add(String.format("Historical baseline monthly surplus: ₹%s (Income: ₹%s, Expenses: ₹%s).",
                baseline.monthlySurplus.toPlainString(),
                baseline.monthlyIncome.toPlainString(),
                baseline.monthlyExpense.toPlainString()));

        // Assumptions
        assumptions.add("Baseline living expenses remain stable within historical variance over the horizon.");
        assumptions.add("No unbudgeted extraordinary emergencies occur outside the specified cushion.");
        if (baseline.isStartingBalanceEstimated) {
            assumptions.add("Starting balance is derived from cumulative recorded transactions (use Custom Starting Funds to override).");
        }
        if ("LOW_TRANSACTION_HISTORY".equals(baseline.confidence)) {
            assumptions.add("Limited historical transactions detected; baseline estimates use sensible defaults.");
        }

        // Trade-offs
        String tradeOff = String.format(
                "This scenario results in a net %s of ₹%s at month %d. Your liquidity reaches its lowest point of ₹%s in %s.",
                netImpact.compareTo(BigDecimal.ZERO) <= 0 ? "reduction" : "gain",
                netImpact.abs().toPlainString(),
                horizon,
                lowestBalance.toPlainString(),
                lowestMonth
        );

        // Recommendations
        if ("UNSUSTAINABLE".equals(verdict.verdictCode)) {
            recommendations.add("Defer this commitment until you accumulate at least ₹" + lowestBalance.abs().add(BigDecimal.valueOf(10000)).toPlainString() + " additional reserves.");
            recommendations.add("Consider splitting the one-time cost across a multi-month plan to mitigate peak deficit.");
        } else if ("CRITICAL_STRESS".equals(verdict.verdictCode)) {
            recommendations.add("Build an additional buffer of ₹" + (targetCushion != null ? targetCushion.subtract(lowestBalance).toPlainString() : "5000") + " before initiating this commitment.");
            recommendations.add("Temporarily reduce discretionary expenses during the trough month to safeguard your cushion.");
        } else if ("MODERATE_RISK".equals(verdict.verdictCode)) {
            if (recoveryMonth != null) {
                recommendations.add("Expected recovery of pre-scenario savings occurs by month " + recoveryMonth + ".");
            }
            recommendations.add("Maintain tight control on non-essential expenditures during the first " + Math.min(3, horizon) + " months.");
        } else {
            recommendations.add("Green light: Proceed with confidence. Your emergency reserve is well-protected.");
            recommendations.add("Any incidental savings can be routed toward higher-yield savings or investment goals.");
        }

        return new ExplainableReport(factors, assumptions, tradeOff, recommendations);
    }

    private BigDecimal round(BigDecimal value) {
        if (value == null) return BigDecimal.ZERO;
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private record BaselineStats(
            BigDecimal startingBalance,
            boolean isStartingBalanceEstimated,
            BigDecimal monthlyIncome,
            BigDecimal monthlyExpense,
            BigDecimal monthlySurplus,
            String confidence
    ) {}

    private record VerdictEvaluation(String verdictCode, String title, String summary) {}

    private record ExplainableReport(
            List<String> factors,
            List<String> assumptions,
            String tradeOff,
            List<String> recommendations
    ) {}
}
