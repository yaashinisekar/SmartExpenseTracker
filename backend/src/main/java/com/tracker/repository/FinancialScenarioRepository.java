package com.tracker.repository;

import com.tracker.entity.FinancialScenario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinancialScenarioRepository extends JpaRepository<FinancialScenario, Long> {

    List<FinancialScenario> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<FinancialScenario> findByIdAndUserId(Long id, Long userId);

    List<FinancialScenario> findAllByIdInAndUserId(List<Long> ids, Long userId);

    long countByUserId(Long userId);
}
