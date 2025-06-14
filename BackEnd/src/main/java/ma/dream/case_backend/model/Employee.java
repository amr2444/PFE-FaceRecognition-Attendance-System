package ma.dream.case_backend.model;


import jakarta.persistence.*;
import lombok.*;
import ma.dream.case_backend.enums.StatutEmploye;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class Employee {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long employeeId;
    private String nom;
    private String role;
    private String departement;
    private String mobile;
    private LocalDate dateEmbauche;
    private String email;
    private String genre;
    private String adresse;

    @Enumerated(EnumType.STRING)
    private StatutEmploye statut;

    @CreationTimestamp
    private LocalDateTime creationDate;

    @UpdateTimestamp
    private LocalDateTime lastUpdateDate;
}
