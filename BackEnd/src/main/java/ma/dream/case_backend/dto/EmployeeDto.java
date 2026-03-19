package ma.dream.case_backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import ma.dream.case_backend.enums.StatutEmploye;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Employee payload exposed by the REST API")
public class EmployeeDto {

    @Schema(example = "12")
    private Long employeeId;

    @NotBlank(message = "Nom is required")
    @Size(max = 120, message = "Nom must not exceed 120 characters")
    @Schema(example = "Ali Bennani")
    private String nom;

    @NotBlank(message = "Role is required")
    @Size(max = 120, message = "Role must not exceed 120 characters")
    @Schema(example = "Technicien")
    private String role;

    @NotBlank(message = "Departement is required")
    @Size(max = 120, message = "Departement must not exceed 120 characters")
    @Schema(example = "Technique")
    private String departement;

    @NotBlank(message = "Mobile is required")
    @Pattern(regexp = "^[0-9+()\\-\\s]{8,20}$", message = "Mobile format is invalid")
    @Schema(example = "+212600112233")
    private String mobile;

    @NotNull(message = "Date embauche is required")
    @PastOrPresent(message = "Date embauche cannot be in the future")
    @Schema(example = "2025-10-01")
    private LocalDate dateEmbauche;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 160, message = "Email must not exceed 160 characters")
    @Schema(example = "ali.bennani@example.com")
    private String email;

    @NotBlank(message = "Genre is required")
    @Size(max = 20, message = "Genre must not exceed 20 characters")
    @Schema(example = "Homme")
    private String genre;

    @Size(max = 255, message = "Adresse must not exceed 255 characters")
    @Schema(example = "Rabat, Maroc")
    private String adresse;

    @Size(max = 2_000_000, message = "Photo payload is too large")
    @Schema(example = "data:image/jpeg;base64,...")
    private String photo;

    @NotNull(message = "Statut is required")
    @Schema(example = "ACTIF")
    private StatutEmploye statut;

}
