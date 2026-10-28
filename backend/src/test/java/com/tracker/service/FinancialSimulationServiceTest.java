package com.tracker.service;

import com.tracker.dto.ScenarioRequestDTO;
import com.tracker.dto.SimulationResultDTO;
import com.tracker.entity.Category;
import com.tracker.entity.ScenarioType;
import com.tracker.entity.Transaction;
import com.tracker.entity.TransactionType;
import com.tracker.entity.User;
import com.tracker.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinancialSimulationServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private FinancialSimulationService simulationService;

    private User testUser;
    private Category incomeCategory;
    private Category expenseCategory;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).email("tester@example.com").firstName("Test").lastName("User").build();
        incomeCategory = Category.builder().id(1L).name("Salary").type(TransactionType.INCOME).build();
        expenseCategory = Category.builder().id(2L).name("Rent").type(TransactionType.EXPENSE).build();
    }

    @Test
    @DisplayName("Should simulate one-time purchase with high affordability when starting funds and surplus are high")
    void testHighlyAffordableOneTimePurchase() {
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(Transaction.builder()
                .id(1L).user(testUser).category(incomeCategory)
                .amount(BigDecimal.valueOf(100000))
                .type(TransactionType.INCOME)
                .date(LocalDate.now().minusMonths(1))
                .build());
        transactions.add(Transaction.builder()
                .id(2L).user(testUser).category(expenseCategory)
                .amount(BigDecimal.valueOf(40000))
                .type(TransactionType.EXPENSE)
                .date(LocalDate.now().minusMonths(1))
                .build());

        when(transactionRepository.findByUserIdOrderByDateDesc(1L)).thenReturn(transactions);

        ScenarioRequestDTO req = ScenarioRequestDTO.builder()
                .name("Affordable Laptop")
                .type(ScenarioType.ONE_TIME_PURCHASE)
                .oneTimeAmount(BigDecimal.valueOf(30000))
                .oneTimeDate(LocalDate.now())
                .isExpense(true)
                .targetSavingsCushion(BigDecimal.valueOf(20000))
                .projectionHorizonMonths(6)
                .build();

        SimulationResultDTO result = simulationService.runSimulation(1L, req);

        assertNotNull(result);
        assertEquals("HIGHLY_AFFORDABLE", result.getAffordabilityVerdict());
        assertTrue(result.getTargetCushionMaintained());
        assertEquals(6, result.getMonthlyProjections().size());
        assertTrue(result.getProjectedLowestBalance().compareTo(BigDecimal.valueOf(20000)) >= 0);
    }

    @Test
    @DisplayName("Should detect UNSUSTAINABLE verdict when expense exceeds starting funds and causes negative balance")
    void testUnsustainableDeficitPurchase() {
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(Transaction.builder()
                .id(1L).user(testUser).category(incomeCategory)
                .amount(BigDecimal.valueOf(20000))
                .type(TransactionType.INCOME)
                .date(LocalDate.now().minusMonths(1))
                .build());
        transactions.add(Transaction.builder()
                .id(2L).user(testUser).category(expenseCategory)
                .amount(BigDecimal.valueOf(18000))
                .type(TransactionType.EXPENSE)
                .date(LocalDate.now().minusMonths(1))
                .build());

        when(transactionRepository.findByUserIdOrderByDateDesc(1L)).thenReturn(transactions);

        ScenarioRequestDTO req = ScenarioRequestDTO.builder()
                .name("Super Expensive Car Down Payment")
                .type(ScenarioType.ONE_TIME_PURCHASE)
                .oneTimeAmount(BigDecimal.valueOf(150000))
                .oneTimeDate(LocalDate.now())
                .isExpense(true)
                .targetSavingsCushion(BigDecimal.valueOf(10000))
                .projectionHorizonMonths(6)
                .build();

        SimulationResultDTO result = simulationService.runSimulation(1L, req);

        assertNotNull(result);
        assertEquals("UNSUSTAINABLE", result.getAffordabilityVerdict());
        assertTrue(result.getProjectedLowestBalance().compareTo(BigDecimal.ZERO) < 0);
        assertFalse(result.getTargetCushionMaintained());
    }

    @Test
    @DisplayName("Should detect CRITICAL_STRESS when balance stays positive but breaches safety cushion")
    void testCriticalStressCushionBreached() {
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(Transaction.builder()
                .id(1L).user(testUser).category(incomeCategory)
                .amount(BigDecimal.valueOf(50000))
                .type(TransactionType.INCOME)
                .date(LocalDate.now().minusMonths(1))
                .build());
        transactions.add(Transaction.builder()
                .id(2L).user(testUser).category(expenseCategory)
                .amount(BigDecimal.valueOf(45000))
                .type(TransactionType.EXPENSE)
                .date(LocalDate.now().minusMonths(1))
                .build());

        when(transactionRepository.findByUserIdOrderByDateDesc(1L)).thenReturn(transactions);

        ScenarioRequestDTO req = ScenarioRequestDTO.builder()
                .name("Trip to Goa")
                .type(ScenarioType.ONE_TIME_PURCHASE)
                .customStartingFunds(BigDecimal.valueOf(30000))
                .oneTimeAmount(BigDecimal.valueOf(20000))
                .oneTimeDate(LocalDate.now())
                .isExpense(true)
                .targetSavingsCushion(BigDecimal.valueOf(25000)) // Cushion is 25k, but post-trip balance dips to 15k
                .projectionHorizonMonths(6)
                .build();

        SimulationResultDTO result = simulationService.runSimulation(1L, req);

        assertNotNull(result);
        assertEquals("CRITICAL_STRESS", result.getAffordabilityVerdict());
        assertFalse(result.getTargetCushionMaintained());
        assertTrue(result.getProjectedLowestBalance().compareTo(BigDecimal.ZERO) >= 0);
    }

    @Test
    @DisplayName("Should correctly project recurring commitments over duration")
    void testRecurringCommitmentProjection() {
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(Transaction.builder()
                .id(1L).user(testUser).category(incomeCategory)
                .amount(BigDecimal.valueOf(80000))
                .type(TransactionType.INCOME)
                .date(LocalDate.now().minusMonths(1))
                .build());
        transactions.add(Transaction.builder()
                .id(2L).user(testUser).category(expenseCategory)
                .amount(BigDecimal.valueOf(50000))
                .type(TransactionType.EXPENSE)
                .date(LocalDate.now().minusMonths(1))
                .build());

        when(transactionRepository.findByUserIdOrderByDateDesc(1L)).thenReturn(transactions);

        ScenarioRequestDTO req = ScenarioRequestDTO.builder()
                .name("Gym Membership Plan")
                .type(ScenarioType.RECURRING_COMMITMENT)
                .recurringMonthlyAmount(BigDecimal.valueOf(5000))
                .recurringDurationMonths(3)
                .projectionHorizonMonths(6)
                .build();

        SimulationResultDTO result = simulationService.runSimulation(1L, req);

        assertNotNull(result);
        assertEquals(6, result.getMonthlyProjections().size());
        // Verify recurring expense applied for first 3 months only
        assertEquals(BigDecimal.valueOf(5000.00).setScale(2), result.getMonthlyProjections().get(0).getScenarioExpenseAdjustment());
        assertEquals(BigDecimal.valueOf(5000.00).setScale(2), result.getMonthlyProjections().get(1).getScenarioExpenseAdjustment());
        assertEquals(BigDecimal.valueOf(5000.00).setScale(2), result.getMonthlyProjections().get(2).getScenarioExpenseAdjustment());
        assertEquals(BigDecimal.ZERO.setScale(2), result.getMonthlyProjections().get(3).getScenarioExpenseAdjustment());
    }

    @Test
    @DisplayName("Should handle empty transaction history safely without NullPointerException")
    void testEmptyTransactionHistoryFallback() {
        when(transactionRepository.findByUserIdOrderByDateDesc(1L)).thenReturn(new ArrayList<>());

        ScenarioRequestDTO req = ScenarioRequestDTO.builder()
                .name("Empty History Simulation")
                .type(ScenarioType.ONE_TIME_PURCHASE)
                .oneTimeAmount(BigDecimal.valueOf(10000))
                .projectionHorizonMonths(4)
                .build();

        SimulationResultDTO result = simulationService.runSimulation(1L, req);

        assertNotNull(result);
        assertEquals("LOW_TRANSACTION_HISTORY", result.getDataConfidence());
        assertEquals(4, result.getMonthlyProjections().size());
        assertNotNull(result.getExplainableFactors());
        assertFalse(result.getExplainableFactors().isEmpty());
    }
}
