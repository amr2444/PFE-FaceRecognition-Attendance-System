package ma.dream.case_backend.config;

import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.enums.StatutEmploye;
import ma.dream.case_backend.enums.StatutPresence;
import ma.dream.case_backend.model.Employee;
import ma.dream.case_backend.model.PresenceJour;
import ma.dream.case_backend.repository.EmployeRepository;
import ma.dream.case_backend.repository.PresenceJourRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Configuration
@Profile("dev")
@Slf4j
public class LocalH2SeedConfig {

    @Bean
    @ConditionalOnProperty(prefix = "app.seed.local-h2", name = "enabled", havingValue = "true")
    CommandLineRunner localH2SeedRunner(EmployeRepository employeRepository, PresenceJourRepository presenceJourRepository) {
        return args -> {
            if (employeRepository.count() > 0 || presenceJourRepository.count() > 0) {
                log.info("Local H2 seed skipped because data already exists");
                return;
            }

            List<Employee> employees = employeRepository.saveAll(List.of(
                    Employee.builder()
                            .nom("Amine El Idrissi")
                            .role("Agent d'accueil")
                            .departement("Accueil")
                            .mobile("0612345678")
                            .dateEmbauche(LocalDate.of(2023, 1, 10))
                            .email("amine.elidrissi@example.com")
                            .genre("Homme")
                            .adresse("Casablanca")
                            .statut(StatutEmploye.ACTIF)
                            .build(),
                    Employee.builder()
                            .nom("Salma Benjelloun")
                            .role("Responsable RH")
                            .departement("Administration")
                            .mobile("0623456789")
                            .dateEmbauche(LocalDate.of(2022, 5, 16))
                            .email("salma.benjelloun@example.com")
                            .genre("Femme")
                            .adresse("Rabat")
                            .statut(StatutEmploye.ACTIF)
                            .build(),
                    Employee.builder()
                            .nom("Youssef Alaoui")
                            .role("Technicien maintenance")
                            .departement("Technique")
                            .mobile("0634567890")
                            .dateEmbauche(LocalDate.of(2021, 9, 5))
                            .email("youssef.alaoui@example.com")
                            .genre("Homme")
                            .adresse("Mohammedia")
                            .statut(StatutEmploye.ACTIF)
                            .build(),
                    Employee.builder()
                            .nom("Nora Tazi")
                            .role("Chargee logistique")
                            .departement("Administration")
                            .mobile("0645678901")
                            .dateEmbauche(LocalDate.of(2024, 2, 12))
                            .email("nora.tazi@example.com")
                            .genre("Femme")
                            .adresse("Marrakech")
                            .statut(StatutEmploye.EN_CONGE)
                            .build(),
                    Employee.builder()
                            .nom("Hamza Chraibi")
                            .role("Agent de securite")
                            .departement("Securite")
                            .mobile("0656789012")
                            .dateEmbauche(LocalDate.of(2020, 11, 3))
                            .email("hamza.chraibi@example.com")
                            .genre("Homme")
                            .adresse("Fes")
                            .statut(StatutEmploye.INACTIF)
                            .build(),
                    Employee.builder()
                            .nom("Imane Saidi")
                            .role("Assistante administrative")
                            .departement("Bureaux")
                            .mobile("0667890123")
                            .dateEmbauche(LocalDate.of(2023, 7, 24))
                            .email("imane.saidi@example.com")
                            .genre("Femme")
                            .adresse("Tanger")
                            .statut(StatutEmploye.ACTIF)
                            .build()
            ));

            LocalDateTime now = LocalDateTime.now();

            presenceJourRepository.saveAll(List.of(
                    PresenceJour.builder()
                            .employee(employees.get(0))
                            .firstIn(LocalTime.of(8, 5))
                            .breakTime(LocalTime.of(12, 15))
                            .resumeTime(LocalTime.of(13, 15))
                            .lastOut(LocalTime.of(17, 5))
                            .totalHeures(Duration.ofHours(8))
                            .statut(StatutPresence.TERMINE)
                            .shift("Matin")
                            .note("Journee complete")
                            .creationDate(now)
                            .lastUpdateDate(now)
                            .build(),
                    PresenceJour.builder()
                            .employee(employees.get(1))
                            .firstIn(LocalTime.of(8, 20))
                            .breakTime(null)
                            .resumeTime(null)
                            .lastOut(null)
                            .totalHeures(Duration.ZERO)
                            .statut(StatutPresence.PRESENT)
                            .shift("Matin")
                            .note("Arrivee enregistree")
                            .creationDate(now)
                            .lastUpdateDate(now)
                            .build(),
                    PresenceJour.builder()
                            .employee(employees.get(2))
                            .firstIn(LocalTime.of(9, 0))
                            .breakTime(LocalTime.of(13, 0))
                            .resumeTime(null)
                            .lastOut(null)
                            .totalHeures(Duration.ZERO)
                            .statut(StatutPresence.EN_PAUSE)
                            .shift("Apres-midi")
                            .note("Pause dejeuner")
                            .creationDate(now)
                            .lastUpdateDate(now)
                            .build(),
                    PresenceJour.builder()
                            .employee(employees.get(3))
                            .firstIn(null)
                            .breakTime(null)
                            .resumeTime(null)
                            .lastOut(null)
                            .totalHeures(Duration.ZERO)
                            .statut(StatutPresence.ABSENT)
                            .shift("Matin")
                            .note("En conge")
                            .creationDate(now)
                            .lastUpdateDate(now)
                            .build(),
                    PresenceJour.builder()
                            .employee(employees.get(5))
                            .firstIn(LocalTime.of(13, 30))
                            .breakTime(null)
                            .resumeTime(null)
                            .lastOut(LocalTime.of(18, 0))
                            .totalHeures(Duration.ofHours(4).plusMinutes(30))
                            .statut(StatutPresence.TERMINE)
                            .shift("Soir")
                            .note("Demi-journee")
                            .creationDate(now)
                            .lastUpdateDate(now)
                            .build()
            ));

            log.info("Local H2 seed created with {} employees and {} presences", employees.size(), 5);
        };
    }
}
