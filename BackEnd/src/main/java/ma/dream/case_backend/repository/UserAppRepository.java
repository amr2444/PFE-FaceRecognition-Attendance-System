package ma.dream.case_backend.repository;


import ma.dream.case_backend.model.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAppRepository extends JpaRepository<UserApp, Long> {

    Optional<UserApp> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
