package ma.dream.case_backend.dto;


import lombok.*;
import ma.dream.case_backend.enums.StatutPresence;

import java.time.Duration;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresenceJourDto {

    private Long presenceJourId;

    private Long employeeId;
    private String employeeName;

    private LocalTime firstIn;
    private LocalTime breakTime;
    private LocalTime lastOut;
    private Duration totalHeures;
    private StatutPresence statut;
    private String shift;
    private String note;

}
