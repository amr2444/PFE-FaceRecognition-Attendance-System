package ma.dream.case_backend.repository;

import ma.dream.case_backend.model.EntreeRecente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EntreeRecenteRepository extends JpaRepository<EntreeRecente, Long> {
}
