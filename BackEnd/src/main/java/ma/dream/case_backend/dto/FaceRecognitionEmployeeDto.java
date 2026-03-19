package ma.dream.case_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.dream.case_backend.enums.StatutEmploye;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceRecognitionEmployeeDto {

    private Long employeeId;
    private String nom;
    private String role;
    private String departement;
    private StatutEmploye statut;
    private String photo;
}
