package ma.dream.case_backend.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import ma.dream.case_backend.enums.StatutPresence;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Attendance record for a single employee and day")
public class PresenceJourDto {

    @Schema(example = "45")
    private Long presenceJourId;

    @NotNull(message = "Employee ID is required")
    @Schema(example = "12")
    private Long employeeId;

    @Schema(example = "Ali Bennani")
    private String employeeName;

    @Schema(example = "08:15:00")
    private LocalTime firstIn;

    @Schema(example = "12:30:00")
    private LocalTime breakTime;

    @Schema(example = "13:15:00")
    private LocalTime resumeTime;

    @Schema(example = "17:45:00")
    private LocalTime lastOut;

    @Schema(example = "PT8H15M")
    private Duration totalHeures;

    @NotNull(message = "Statut is required")
    @Schema(example = "PRESENT")
    private StatutPresence statut;

    @Size(max = 40, message = "Shift must not exceed 40 characters")
    @Schema(example = "Matin")
    private String shift;

    @Size(max = 500, message = "Note must not exceed 500 characters")
    @Schema(example = "Enregistre via reconnaissance faciale")
    private String note;

    @Schema(example = "2026-03-19T08:15:00")
    private LocalDateTime creationDate;

    @Schema(example = "2026-03-19T17:45:00")
    private LocalDateTime lastUpdateDate;

}
