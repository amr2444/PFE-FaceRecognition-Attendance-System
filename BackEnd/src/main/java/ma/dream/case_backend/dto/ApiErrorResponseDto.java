package ma.dream.case_backend.dto;

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
public class ApiErrorResponseDto {

    private Instant timestamp;
    private int status;
    private ApiErrorCode code;
    private String error;
    private String message;
    private String path;
    private Map<String, String> validationErrors;
}
