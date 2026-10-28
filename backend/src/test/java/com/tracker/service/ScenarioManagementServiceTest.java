package com.tracker.service;

import com.tracker.dto.ScenarioComparisonDTO;
import com.tracker.dto.ScenarioRequestDTO;
import com.tracker.dto.ScenarioResponseDTO;
import com.tracker.dto.SimulationResultDTO;
import com.tracker.entity.FinancialScenario;
import com.tracker.entity.ScenarioType;
import com.tracker.entity.User;
import com.tracker.repository.FinancialScenarioRepository;
import com.tracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScenarioManagementServiceTest {

    @Mock
    private FinancialScenarioRepository scenarioRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FinancialSimulationService simulationService;

    @InjectMocks
    private ScenarioManagementService managementService;

    private User user;
    private FinancialScenario scenario1;
    private FinancialScenario scenario2;

    @BeforeEach
    void setUp() {
        user = User.builder().id(10L).email("user10@tracker.com").firstName("Jane").lastName("Doe").build();

        scenario1 = FinancialScenario.builder()
                .id(101L)
                .user(user)
                .name("Option A - Upfront Buy")
                .type(ScenarioType.ONE_TIME_PURCHASE)
                .oneTimeAmount(BigDecimal.valueOf(60000))
                .isExpense(true)
                .projectionHorizonMonths(6)
                .build();

        scenario2 = FinancialScenario.builder()
                .id(102L)
                .user(user)
                .name("Option B - EMI")
                .type(ScenarioType.RECURRING_COMMITMENT)
                .recurringMonthlyAmount(BigDecimal.valueOf(10000))
                .recurringDurationMonths(6)
                .projectionHorizonMonths(6)
                .build();
    }

    @Test
    @DisplayName("Should successfully create a scenario scoped to the authenticated user")
    void testCreateScenarioScopedToUser() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(scenarioRepository.save(any(FinancialScenario.class))).thenReturn(scenario1);
        when(simulationService.simulate(any(FinancialScenario.class), eq(10L))).thenReturn(
                SimulationResultDTO.builder()
                        .scenarioId(101L)
                        .scenarioName("Option A - Upfront Buy")
                        .affordabilityVerdict("HIGHLY_AFFORDABLE")
                        .build()
        );

        ScenarioRequestDTO req = ScenarioRequestDTO.builder()
                .name("Option A - Upfront Buy")
                .type(ScenarioType.ONE_TIME_PURCHASE)
                .oneTimeAmount(BigDecimal.valueOf(60000))
                .isExpense(true)
                .projectionHorizonMonths(6)
                .build();

        ScenarioResponseDTO response = managementService.createScenario(10L, req);

        assertNotNull(response);
        assertEquals("Option A - Upfront Buy", response.getName());
        verify(userRepository, times(1)).findById(10L);
        verify(scenarioRepository, times(1)).save(any(FinancialScenario.class));
    }

    @Test
    @DisplayName("Should throw exception when accessing scenario belonging to another user")
    void testAccessDeniedForOtherUserScenario() {
        when(scenarioRepository.findByIdAndUserId(999L, 10L)).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () ->
                managementService.getScenarioById(999L, 10L)
        );

        assertTrue(exception.getMessage().contains("not found or access denied"));
    }

    @Test
    @DisplayName("Should compare scenarios and recommend the option with best affordability and liquidity")
    void testCompareScenariosRecommendation() {
        when(scenarioRepository.findAllByIdInAndUserId(Arrays.asList(101L, 102L), 10L))
                .thenReturn(Arrays.asList(scenario1, scenario2));

        SimulationResultDTO sim1 = SimulationResultDTO.builder()
                .scenarioId(101L)
                .scenarioName("Option A - Upfront Buy")
                .affordabilityVerdict("MODERATE_RISK")
                .verdictTitle("Affordable with Caution")
                .projectedLowestBalance(BigDecimal.valueOf(10000))
                .lowestBalanceMonth("Nov 2026")
                .projectedFinalBalance(BigDecimal.valueOf(80000))
                .netScenarioImpact(BigDecimal.valueOf(-60000))
                .targetCushionMaintained(true)
                .build();

        SimulationResultDTO sim2 = SimulationResultDTO.builder()
                .scenarioId(102L)
                .scenarioName("Option B - EMI")
                .affordabilityVerdict("HIGHLY_AFFORDABLE")
                .verdictTitle("Comfortably Affordable")
                .projectedLowestBalance(BigDecimal.valueOf(35000))
                .lowestBalanceMonth("Jan 2027")
                .projectedFinalBalance(BigDecimal.valueOf(85000))
                .netScenarioImpact(BigDecimal.valueOf(-60000))
                .targetCushionMaintained(true)
                .build();

        when(simulationService.simulate(scenario1, 10L)).thenReturn(sim1);
        when(simulationService.simulate(scenario2, 10L)).thenReturn(sim2);

        ScenarioComparisonDTO comparison = managementService.compareScenarios(10L, Arrays.asList(101L, 102L));

        assertNotNull(comparison);
        assertEquals(2, comparison.getScenarios().size());
        assertEquals(102L, comparison.getRecommendedScenarioId());
        assertEquals("Option B - EMI", comparison.getRecommendedScenarioName());
        assertFalse(comparison.getComparisonTable().isEmpty());
    }
}
