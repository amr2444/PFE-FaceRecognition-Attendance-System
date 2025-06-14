package ma.dream.case_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.dream.case_backend.enums.StatutEmploye;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeStatutCountDto {

    private StatutEmploye statut;
    private long count;

}
