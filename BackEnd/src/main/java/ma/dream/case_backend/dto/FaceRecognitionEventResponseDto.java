package ma.dream.case_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.dream.case_backend.enums.StatutPresence;

import java.time.Duration;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceRecognitionEventResponseDto {

    private Long employeeId;
    private String employeeName;
    private Long presenceJourId;
    private String action;
    private StatutPresence statut;
    private LocalTime firstIn;
    private LocalTime breakTime;
    private LocalTime resumeTime;
    private LocalTime lastOut;
    private Duration totalHeures;
}
