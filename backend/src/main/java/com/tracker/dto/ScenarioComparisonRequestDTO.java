package com.tracker.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScenarioComparisonRequestDTO {

    @NotEmpty(message = "Please provide scenario IDs to compare")
    @Size(min = 2, max = 5, message = "Please select between 2 and 5 scenarios to compare")
    private List<Long> scenarioIds;
}
