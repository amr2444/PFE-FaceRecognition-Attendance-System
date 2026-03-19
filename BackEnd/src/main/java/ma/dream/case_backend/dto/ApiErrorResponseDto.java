package ma.dream.case_backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.dream.case_backend.enums.ApiErrorCode;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Standard API error payload")
public class ApiErrorResponseDto {

    @Schema(example = "2026-03-19T10:15:30Z")
    private Instant timestamp;

    @Schema(example = "400")
    private int status;

    @Schema(example = "REQUEST_VALIDATION_FAILED")
    private ApiErrorCode code;

    @Schema(example = "Bad Request")
    private String error;

    @Schema(example = "Request validation failed")
    private String message;

    @Schema(example = "/auth/login")
    private String path;

    @Schema(description = "Field-level validation errors when available")
    private Map<String, String> validationErrors;
}
