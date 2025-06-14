package ma.dream.case_backend.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class EntreeRecente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long entreeRecenteId;
    @ManyToOne
    private Employee employee;

    private LocalTime heure;
    private String portail;

    private LocalDate date;

    @CreationTimestamp
    private LocalDateTime creationDate;

    @UpdateTimestamp
    private LocalDateTime lastUpdateDate;

}
