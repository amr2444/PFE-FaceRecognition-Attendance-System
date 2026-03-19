package ma.dream.case_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePhotoUpdateDto {

    @NotBlank(message = "Photo is required")
    @Size(max = 2_000_000, message = "Photo payload is too large")
    @Pattern(regexp = "^data:image/(png|jpeg|jpg);base64,.+$", message = "Photo must be a valid data URL")
    private String photo;
}
