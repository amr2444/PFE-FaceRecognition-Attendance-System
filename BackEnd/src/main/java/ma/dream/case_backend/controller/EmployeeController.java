package ma.dream.case_backend.controller;


import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.dto.EmployeeDto;
import ma.dream.case_backend.dto.EmployeeStatutCountDto;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.model.Employee;
import ma.dream.case_backend.service.EmployeeService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employes")
@AllArgsConstructor
@Slf4j
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping("/")
    public ResponseEntity<Employee> createEmployee(@RequestBody EmployeeDto employeeDto) {
        try {
            Employee createEmployee = employeeService.createEmployee(employeeDto);
            return new ResponseEntity<>(createEmployee, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @Operation(summary = "Retrieve all employees", description = "Récupère la liste de tous les employees")
    @GetMapping("/")
    public ResponseEntity<Page<EmployeeDto>> getAllEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) final String searchByNom,
            @RequestParam(required = false) final String searchByDepartement,
            @RequestParam(required = false) final String searchByStatus,
            @RequestParam(defaultValue = "lastUpdateDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Page<EmployeeDto> employees = employeeService.getAllEmployees(page, size, searchByNom, searchByDepartement, searchByStatus, sortBy, direction);
        return ResponseEntity.ok(employees);
    }

    @Operation(summary = "Retrieve all employees", description = "Récupère la liste de tous les employés")
    @GetMapping("/find/all")
    public ResponseEntity<List<EmployeeDto>> findAllEmployees() {
        List<EmployeeDto> employees = employeeService.findAllEmployees();
        return ResponseEntity.ok(employees);
    }



    @Operation(summary = "Update employee details", description = "Récupère les détails d'un employee par ID")
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDto> updateEmployee(@PathVariable Long id, @RequestBody EmployeeDto employeeDto) throws TechnicalException {
        log.info("Update employee: {}", id);
        EmployeeDto updatedEmployee = employeeService.updateEmployee(id, employeeDto);
        return ResponseEntity.ok(updatedEmployee);
    }

    @Operation(summary = "Retrieve employee by ID", description = "Récupère les détails d'un employee par ID")
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getEmployeeById(@PathVariable Long id) throws TechnicalException {
        log.info("get employee by id: {}", id);
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @Operation(summary = "Delete a employee", description = "Supprime un employee par ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        log.info("delete employee by id: {}", id);
        try {
            employeeService.deleteEmployee(id);
            return ResponseEntity.noContent().build();
        } catch (TechnicalException e) {
            log.error("Error deleting employee: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/count-by-statut/all")
    public ResponseEntity<List<EmployeeStatutCountDto>> getCountByStatut() {
        return ResponseEntity.ok(employeeService.countEmployeesByStatut());
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getTotalEmployees() {
        return ResponseEntity.ok(employeeService.getTotalEmployees());
    }



}
