package ma.dream.case_backend.dto;


import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @NotNull(message = "Employee ID is required")
    private Long employeeId;
    private String employeeName;

    private LocalTime firstIn;
    private LocalTime breakTime;
    private LocalTime resumeTime;
    private LocalTime lastOut;
    private Duration totalHeures;
    @NotNull(message = "Statut is required")
    private StatutPresence statut;

    @Size(max = 40, message = "Shift must not exceed 40 characters")
    private String shift;

    @Size(max = 500, message = "Note must not exceed 500 characters")
    private String note;

}
