package ma.dream.case_backend.model;


import jakarta.persistence.*;
import lombok.*;
import ma.dream.case_backend.enums.StatutPresence;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class PresenceJour {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long presenceJourId;

    @ManyToOne
    private Employee employee;

    private LocalTime firstIn;
    private LocalTime breakTime;
    private LocalTime lastOut;
    private Duration totalHeures;

    @Enumerated(EnumType.STRING)
    private StatutPresence statut;
    private String note;

    private String shift;

    @CreationTimestamp
    private LocalDateTime creationDate;

    @UpdateTimestamp
    private LocalDateTime lastUpdateDate;
}
