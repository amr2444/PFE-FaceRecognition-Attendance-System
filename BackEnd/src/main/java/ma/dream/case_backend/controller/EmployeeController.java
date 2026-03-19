package ma.dream.case_backend.controller;


import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.dto.EmployeeDto;
import ma.dream.case_backend.dto.EmployeeStatutCountDto;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.service.EmployeeService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employes")
@AllArgsConstructor
@Slf4j
@Validated
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping("/")
    public ResponseEntity<EmployeeDto> createEmployee(@Valid @RequestBody EmployeeDto employeeDto) {
        EmployeeDto createdEmployee = employeeService.createEmployee(employeeDto);
        return new ResponseEntity<>(createdEmployee, HttpStatus.CREATED);
    }

    @Operation(summary = "Retrieve all employees", description = "Récupère la liste de tous les employees")
    @GetMapping("/")
    public ResponseEntity<Page<EmployeeDto>> getAllEmployees(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "5") @Min(value = 1, message = "Size must be at least 1") @Max(value = 100, message = "Size must not exceed 100") int size,
            @RequestParam(required = false) @Size(max = 120, message = "searchByNom must not exceed 120 characters") final String searchByNom,
            @RequestParam(required = false) @Size(max = 120, message = "searchByDepartement must not exceed 120 characters") final String searchByDepartement,
            @RequestParam(required = false) @Size(max = 20, message = "searchByStatus must not exceed 20 characters") final String searchByStatus,
            @RequestParam(defaultValue = "lastUpdateDate") @Pattern(regexp = "^(nom|departement|dateEmbauche|email|statut|creationDate|lastUpdateDate)$", message = "sortBy is invalid") String sortBy,
            @RequestParam(defaultValue = "desc") @Pattern(regexp = "^(?i)(asc|desc)$", message = "direction must be asc or desc") String direction
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
    public ResponseEntity<EmployeeDto> updateEmployee(@PathVariable @Positive(message = "id must be positive") Long id, @Valid @RequestBody EmployeeDto employeeDto) throws TechnicalException {
        log.info("Update employee: {}", id);
        EmployeeDto updatedEmployee = employeeService.updateEmployee(id, employeeDto);
        return ResponseEntity.ok(updatedEmployee);
    }

    @Operation(summary = "Retrieve employee by ID", description = "Récupère les détails d'un employee par ID")
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getEmployeeById(@PathVariable @Positive(message = "id must be positive") Long id) throws TechnicalException {
        log.info("get employee by id: {}", id);
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @Operation(summary = "Delete a employee", description = "Supprime un employee par ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable @Positive(message = "id must be positive") Long id) throws TechnicalException {
        log.info("delete employee by id: {}", id);
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
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
