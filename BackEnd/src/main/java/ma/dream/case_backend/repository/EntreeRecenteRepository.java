package ma.dream.case_backend.repository;

import ma.dream.case_backend.model.EntreeRecente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EntreeRecenteRepository extends JpaRepository<EntreeRecente, Long> {

    Optional<EntreeRecente> findTopByEmployeeEmployeeIdAndDateOrderByHeureDesc(Long employeeId, LocalDate date);

    List<EntreeRecente> findTop10ByOrderByDateDescHeureDesc();
}
