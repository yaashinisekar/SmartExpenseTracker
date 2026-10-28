package com.tracker.service;

import com.tracker.dto.*;
import com.tracker.entity.FinancialScenario;
import com.tracker.entity.User;
import com.tracker.repository.FinancialScenarioRepository;
import com.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScenarioManagementService {

    private final FinancialScenarioRepository scenarioRepository;
    private final UserRepository userRepository;
    private final FinancialSimulationService simulationService;

    @Transactional(readOnly = true)
    public List<ScenarioResponseDTO> getAllScenarios(Long userId) {
        List<FinancialScenario> scenarios = scenarioRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return scenarios.stream()
                .map(sc -> toResponseDTO(sc, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ScenarioResponseDTO getScenarioById(Long id, Long userId) {
        FinancialScenario scenario = scenarioRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Scenario not found or access denied"));
        return toResponseDTO(scenario, userId);
    }

    @Transactional
    public ScenarioResponseDTO createScenario(Long userId, ScenarioRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FinancialScenario scenario = FinancialScenario.builder()
                .user(user)
                .name(dto.getName())
                .type(dto.getType())
                .description(dto.getDescription())
                .oneTimeAmount(dto.getOneTimeAmount() != null ? dto.getOneTimeAmount() : BigDecimal.ZERO)
                .oneTimeDate(dto.getOneTimeDate())
                .isExpense(dto.getIsExpense() != null ? dto.getIsExpense() : true)
                .recurringMonthlyAmount(dto.getRecurringMonthlyAmount() != null ? dto.getRecurringMonthlyAmount() : BigDecimal.ZERO)
                .recurringDurationMonths(dto.getRecurringDurationMonths() != null ? dto.getRecurringDurationMonths() : 0)
                .incomeChangeMonthlyAmount(dto.getIncomeChangeMonthlyAmount() != null ? dto.getIncomeChangeMonthlyAmount() : BigDecimal.ZERO)
                .incomeChangeDurationMonths(dto.getIncomeChangeDurationMonths() != null ? dto.getIncomeChangeDurationMonths() : 0)
                .targetSavingsCushion(dto.getTargetSavingsCushion())
                .customStartingFunds(dto.getCustomStartingFunds())
                .projectionHorizonMonths(dto.getProjectionHorizonMonths() != null ? dto.getProjectionHorizonMonths() : 6)
                .build();

        FinancialScenario saved = scenarioRepository.save(scenario);
        return toResponseDTO(saved, userId);
    }

    @Transactional
    public ScenarioResponseDTO updateScenario(Long id, Long userId, ScenarioRequestDTO dto) {
        FinancialScenario scenario = scenarioRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Scenario not found or access denied"));

        scenario.setName(dto.getName());
        scenario.setType(dto.getType());
        scenario.setDescription(dto.getDescription());
        scenario.setOneTimeAmount(dto.getOneTimeAmount() != null ? dto.getOneTimeAmount() : BigDecimal.ZERO);
        scenario.setOneTimeDate(dto.getOneTimeDate());
        scenario.setIsExpense(dto.getIsExpense() != null ? dto.getIsExpense() : true);
        scenario.setRecurringMonthlyAmount(dto.getRecurringMonthlyAmount() != null ? dto.getRecurringMonthlyAmount() : BigDecimal.ZERO);
        scenario.setRecurringDurationMonths(dto.getRecurringDurationMonths() != null ? dto.getRecurringDurationMonths() : 0);
        scenario.setIncomeChangeMonthlyAmount(dto.getIncomeChangeMonthlyAmount() != null ? dto.getIncomeChangeMonthlyAmount() : BigDecimal.ZERO);
        scenario.setIncomeChangeDurationMonths(dto.getIncomeChangeDurationMonths() != null ? dto.getIncomeChangeDurationMonths() : 0);
        scenario.setTargetSavingsCushion(dto.getTargetSavingsCushion());
        scenario.setCustomStartingFunds(dto.getCustomStartingFunds());
        scenario.setProjectionHorizonMonths(dto.getProjectionHorizonMonths() != null ? dto.getProjectionHorizonMonths() : 6);

        FinancialScenario updated = scenarioRepository.save(scenario);
        return toResponseDTO(updated, userId);
    }

    @Transactional
    public void deleteScenario(Long id, Long userId) {
        FinancialScenario scenario = scenarioRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Scenario not found or access denied"));
        scenarioRepository.delete(scenario);
    }

    @Transactional(readOnly = true)
    public ScenarioComparisonDTO compareScenarios(Long userId, List<Long> scenarioIds) {
        if (scenarioIds == null || scenarioIds.size() < 2) {
            throw new RuntimeException("At least 2 scenarios are required for comparison");
        }

        List<FinancialScenario> scenarios = scenarioRepository.findAllByIdInAndUserId(scenarioIds, userId);
        if (scenarios.size() < 2) {
            throw new RuntimeException("Selected scenarios not found or access denied");
        }

        List<SimulationResultDTO> simulations = scenarios.stream()
                .map(sc -> simulationService.simulate(sc, userId))
                .collect(Collectors.toList());

        // Determine recommended scenario based on verdict ranking and highest final balance
        // Ranking: HIGHLY_AFFORDABLE (4) > MODERATE_RISK (3) > CRITICAL_STRESS (2) > UNSUSTAINABLE (1)
        SimulationResultDTO bestScenario = simulations.stream()
                .max(Comparator.comparingInt(this::getVerdictRank)
                        .thenComparing(SimulationResultDTO::getProjectedFinalBalance))
                .orElse(simulations.get(0));

        // Build structured comparison table
        List<ComparisonMetricRowDTO> rows = new ArrayList<>();

        Map<String, String> verdictMap = new LinkedHashMap<>();
        Map<String, String> lowestBalMap = new LinkedHashMap<>();
        Map<String, String> finalBalMap = new LinkedHashMap<>();
        Map<String, String> impactMap = new LinkedHashMap<>();
        Map<String, String> recoveryMap = new LinkedHashMap<>();
        Map<String, String> cushionMap = new LinkedHashMap<>();

        for (SimulationResultDTO sim : simulations) {
            String key = sim.getScenarioName();
            verdictMap.put(key, sim.getVerdictTitle());
            lowestBalMap.put(key, "₹" + sim.getProjectedLowestBalance().toPlainString() + " (" + sim.getLowestBalanceMonth() + ")");
            finalBalMap.put(key, "₹" + sim.getProjectedFinalBalance().toPlainString());
            impactMap.put(key, (sim.getNetScenarioImpact().compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + "₹" + sim.getNetScenarioImpact().toPlainString());
            recoveryMap.put(key, sim.getSavingsRecoveryMonths() != null ? sim.getSavingsRecoveryMonths() + " Months" : "Exceeds Horizon");
            cushionMap.put(key, Boolean.TRUE.equals(sim.getTargetCushionMaintained()) ? "Maintained ✓" : "Breached ✕");
        }

        rows.add(ComparisonMetricRowDTO.builder().metricKey("verdict").label("Affordability Verdict").values(verdictMap).highlight("Status").build());
        rows.add(ComparisonMetricRowDTO.builder().metricKey("lowestBal").label("Lowest Projected Balance (Trough)").values(lowestBalMap).highlight("Liquidity Risk").build());
        rows.add(ComparisonMetricRowDTO.builder().metricKey("finalBal").label("Projected Balance at Horizon").values(finalBalMap).highlight("Wealth Accumulation").build());
        rows.add(ComparisonMetricRowDTO.builder().metricKey("impact").label("Net Financial Difference").values(impactMap).highlight("Cost Delta").build());
        rows.add(ComparisonMetricRowDTO.builder().metricKey("recovery").label("Savings Recovery Period").values(recoveryMap).highlight("Timeline").build());
        rows.add(ComparisonMetricRowDTO.builder().metricKey("cushion").label("Safety Cushion Integrity").values(cushionMap).highlight("Resilience").build());

        String reason = String.format("Scenario '%s' is recommended because it provides superior liquidity preservation with a projected final balance of ₹%s and maintains higher safety margin (%s).",
                bestScenario.getScenarioName(),
                bestScenario.getProjectedFinalBalance().toPlainString(),
                bestScenario.getVerdictTitle());

        String summary = String.format("Comparing %d scenarios across a simulated horizon. The highest preservation of liquid funds is achieved under '%s'.",
                simulations.size(), bestScenario.getScenarioName());

        return ScenarioComparisonDTO.builder()
                .scenarios(simulations)
                .recommendedScenarioId(bestScenario.getScenarioId())
                .recommendedScenarioName(bestScenario.getScenarioName())
                .recommendationReason(reason)
                .comparisonTable(rows)
                .executiveSummary(summary)
                .build();
    }

    private int getVerdictRank(SimulationResultDTO sim) {
        return switch (sim.getAffordabilityVerdict()) {
            case "HIGHLY_AFFORDABLE" -> 4;
            case "MODERATE_RISK" -> 3;
            case "CRITICAL_STRESS" -> 2;
            default -> 1;
        };
    }

    private ScenarioResponseDTO toResponseDTO(FinancialScenario sc, Long userId) {
        SimulationResultDTO sim = simulationService.simulate(sc, userId);

        return ScenarioResponseDTO.builder()
                .id(sc.getId())
                .name(sc.getName())
                .type(sc.getType())
                .description(sc.getDescription())
                .oneTimeAmount(sc.getOneTimeAmount())
                .oneTimeDate(sc.getOneTimeDate())
                .isExpense(sc.getIsExpense())
                .recurringMonthlyAmount(sc.getRecurringMonthlyAmount())
                .recurringDurationMonths(sc.getRecurringDurationMonths())
                .incomeChangeMonthlyAmount(sc.getIncomeChangeMonthlyAmount())
                .incomeChangeDurationMonths(sc.getIncomeChangeDurationMonths())
                .targetSavingsCushion(sc.getTargetSavingsCushion())
                .customStartingFunds(sc.getCustomStartingFunds())
                .projectionHorizonMonths(sc.getProjectionHorizonMonths())
                .createdAt(sc.getCreatedAt())
                .updatedAt(sc.getUpdatedAt())
                .simulation(sim)
                .build();
    }
}
