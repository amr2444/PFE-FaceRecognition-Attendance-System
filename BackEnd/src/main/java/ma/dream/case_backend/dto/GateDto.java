package ma.dream.case_backend.dto;


import lombok.*;
import ma.dream.case_backend.enums.StatutPresence;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GateDto {

    private Long employeeId;
    private String employeeName;
    private StatutPresence statut;

}
