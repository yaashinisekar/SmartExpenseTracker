package com.tracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScenarioComparisonDTO {
    private List<SimulationResultDTO> scenarios;
    private Long recommendedScenarioId;
    private String recommendedScenarioName;
    private String recommendationReason;
    private List<ComparisonMetricRowDTO> comparisonTable;
    private String executiveSummary;
}
