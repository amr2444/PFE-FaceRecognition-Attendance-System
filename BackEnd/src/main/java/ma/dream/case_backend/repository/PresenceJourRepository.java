package ma.dream.case_backend.repository;

import ma.dream.case_backend.model.PresenceJour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PresenceJourRepository extends JpaRepository<PresenceJour, Long> {

    @Query("SELECT p.statut, COUNT(p) FROM PresenceJour p WHERE p.creationDate BETWEEN :startOfDay AND :endOfDay GROUP BY p.statut")
    List<Object[]> countByStatutBetweenDates(@Param("startOfDay") LocalDateTime startOfDay,
                                             @Param("endOfDay") LocalDateTime endOfDay);

}
