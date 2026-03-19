package ma.dream.case_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.dream.case_backend.enums.RecognitionEventType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionEventRequestDto {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotBlank(message = "Portail is required")
    @Size(max = 80, message = "Portail must not exceed 80 characters")
    private String portail;

    @NotNull(message = "Event type is required")
    private RecognitionEventType eventType;
}
