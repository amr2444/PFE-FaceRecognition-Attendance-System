package ma.dream.case_backend.dto;

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
    private String nom;
    private String role;
    private String departement;
    private String mobile;
    private LocalDate dateEmbauche;
    private String email;
    private String genre;
    private String adresse;
    private StatutEmploye statut;

}
