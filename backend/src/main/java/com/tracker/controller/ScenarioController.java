package com.tracker.controller;

import com.tracker.dto.*;
import com.tracker.security.UserDetailsImpl;
import com.tracker.service.FinancialSimulationService;
import com.tracker.service.ScenarioManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

    private final ScenarioManagementService scenarioService;
    private final FinancialSimulationService simulationService;

    @GetMapping
    public ResponseEntity<List<ScenarioResponseDTO>> getAllScenarios(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(scenarioService.getAllScenarios(userDetails.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScenarioResponseDTO> getScenarioById(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(scenarioService.getScenarioById(id, userDetails.getId()));
    }

    @PostMapping
    public ResponseEntity<ScenarioResponseDTO> createScenario(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ScenarioRequestDTO requestDTO) {
        ScenarioResponseDTO created = scenarioService.createScenario(userDetails.getId(), requestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScenarioResponseDTO> updateScenario(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ScenarioRequestDTO requestDTO) {
        return ResponseEntity.ok(scenarioService.updateScenario(id, userDetails.getId(), requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteScenario(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        scenarioService.deleteScenario(id, userDetails.getId());
        return ResponseEntity.ok("Scenario deleted successfully");
    }

    @PostMapping("/simulate")
    public ResponseEntity<SimulationResultDTO> runSimulation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ScenarioRequestDTO requestDTO) {
        return ResponseEntity.ok(simulationService.runSimulation(userDetails.getId(), requestDTO));
    }

    @PostMapping("/compare")
    public ResponseEntity<ScenarioComparisonDTO> compareScenarios(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ScenarioComparisonRequestDTO requestDTO) {
        return ResponseEntity.ok(scenarioService.compareScenarios(userDetails.getId(), requestDTO.getScenarioIds()));
    }
}
