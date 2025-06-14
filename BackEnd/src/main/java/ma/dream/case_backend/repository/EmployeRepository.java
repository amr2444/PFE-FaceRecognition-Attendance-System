package ma.dream.case_backend.repository;

import ma.dream.case_backend.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeRepository extends JpaRepository<Employee, Long> {

    @Query("SELECT e.statut, COUNT(e) FROM Employee e GROUP BY e.statut")
    List<Object[]> countEmployeesByStatut();


}
