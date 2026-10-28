package com.tracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComparisonMetricRowDTO {
    private String metricKey;
    private String label;
    // Map of scenarioId (or scenarioName) -> formatted value
    private Map<String, String> values;
    private String highlight;
}
