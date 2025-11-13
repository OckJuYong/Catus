package com.catus.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller for monitoring service status.
 * Provides endpoints for checking service availability.
 */
@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "🏥 헬스체크", description = "서비스 상태 확인 API")
public class HealthController {

    @GetMapping
    @Operation(summary = "서비스 상태 확인", description = "백엔드 서비스의 상태와 버전 정보를 조회합니다")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "서비스 정상 작동 중",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Catus Backend");
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
