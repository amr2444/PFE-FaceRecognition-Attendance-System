package ma.dream.case_backend.dto;

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
public class EmployeeDto {

    private Long employeeId;

    @NotBlank(message = "Nom is required")
    @Size(max = 120, message = "Nom must not exceed 120 characters")
    private String nom;

    @NotBlank(message = "Role is required")
    @Size(max = 120, message = "Role must not exceed 120 characters")
    private String role;

    @NotBlank(message = "Departement is required")
    @Size(max = 120, message = "Departement must not exceed 120 characters")
    private String departement;

    @NotBlank(message = "Mobile is required")
    @Pattern(regexp = "^[0-9+()\\-\\s]{8,20}$", message = "Mobile format is invalid")
    private String mobile;

    @NotNull(message = "Date embauche is required")
    @PastOrPresent(message = "Date embauche cannot be in the future")
    private LocalDate dateEmbauche;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 160, message = "Email must not exceed 160 characters")
    private String email;

    @NotBlank(message = "Genre is required")
    @Size(max = 20, message = "Genre must not exceed 20 characters")
    private String genre;

    @Size(max = 255, message = "Adresse must not exceed 255 characters")
    private String adresse;

    @Size(max = 2_000_000, message = "Photo payload is too large")
    private String photo;

    @NotNull(message = "Statut is required")
    private StatutEmploye statut;

}
