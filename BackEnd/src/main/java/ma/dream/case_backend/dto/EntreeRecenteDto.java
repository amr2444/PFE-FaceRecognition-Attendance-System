package ma.dream.case_backend.dto;


import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntreeRecenteDto {

    private Long entreeRecenteId;
    private Long employeeId;
    private LocalTime heure;
    private String portail;
    private LocalDate date;

}
