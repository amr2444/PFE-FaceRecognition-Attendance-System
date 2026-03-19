package ma.dream.case_backend.service;

import ma.dream.case_backend.config.Messages;
import ma.dream.case_backend.dto.EmployeeDto;
import ma.dream.case_backend.enums.StatutEmploye;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.mapper.EmployeeMapper;
import ma.dream.case_backend.model.Employee;
import ma.dream.case_backend.repository.EmployeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeRepository employeRepository;

    @Mock
    private EmployeeMapper employeeMapper;

    @Mock
    private EntityManager entityManager;

    @Mock
    private Messages messages;

    private EmployeeService employeeService;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeService(employeRepository, employeeMapper, entityManager, messages);
    }

    @Test
    void shouldCreateEmployeeAndPopulateAuditDates() {
        EmployeeDto inputDto = buildEmployeeDto();
        Employee mappedEmployee = buildEmployeeEntity();
        Employee savedEmployee = buildEmployeeEntity();
        savedEmployee.setEmployeeId(7L);
        EmployeeDto savedDto = buildEmployeeDto();
        savedDto.setEmployeeId(7L);

        when(employeeMapper.toEmployee(inputDto)).thenReturn(mappedEmployee);
        when(employeRepository.save(any(Employee.class))).thenReturn(savedEmployee);
        when(employeeMapper.toEmployeeDto(savedEmployee)).thenReturn(savedDto);

        EmployeeDto result = employeeService.createEmployee(inputDto);

        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(employeRepository).save(captor.capture());
        Employee persistedEmployee = captor.getValue();

        assertNotNull(persistedEmployee.getCreationDate());
        assertNotNull(persistedEmployee.getLastUpdateDate());
        assertEquals(7L, result.getEmployeeId());
        assertEquals(inputDto.getNom(), result.getNom());
    }

    @Test
    void shouldUpdateEmployeePhotoWhenEmployeeExists() throws TechnicalException {
        Employee existingEmployee = buildEmployeeEntity();
        existingEmployee.setEmployeeId(3L);
        Employee updatedEmployee = buildEmployeeEntity();
        updatedEmployee.setEmployeeId(3L);
        updatedEmployee.setPhoto("data:image/png;base64,abc");

        EmployeeDto updatedDto = buildEmployeeDto();
        updatedDto.setEmployeeId(3L);
        updatedDto.setPhoto("data:image/png;base64,abc");

        when(employeRepository.findById(3L)).thenReturn(Optional.of(existingEmployee));
        when(employeRepository.save(any(Employee.class))).thenReturn(updatedEmployee);
        when(employeeMapper.toEmployeeDto(updatedEmployee)).thenReturn(updatedDto);

        EmployeeDto result = employeeService.updateEmployeePhoto(3L, "data:image/png;base64,abc");

        assertEquals("data:image/png;base64,abc", result.getPhoto());
        assertEquals(3L, result.getEmployeeId());
    }

    @Test
    void shouldRejectPhotoUpdateWhenEmployeeDoesNotExist() {
        when(messages.get(anyString())).thenReturn("Employee not found");
        when(employeRepository.findById(42L)).thenReturn(Optional.empty());

        TechnicalException exception = assertThrows(
                TechnicalException.class,
                () -> employeeService.updateEmployeePhoto(42L, "data:image/png;base64,abc")
        );

        assertEquals("Employee not found", exception.getMessage());
    }

    private EmployeeDto buildEmployeeDto() {
        return EmployeeDto.builder()
                .employeeId(1L)
                .nom("Salma")
                .role("RH")
                .departement("Administration")
                .mobile("0612345678")
                .dateEmbauche(LocalDate.of(2023, 1, 10))
                .email("salma@example.com")
                .genre("Femme")
                .adresse("Casablanca")
                .photo(null)
                .statut(StatutEmploye.ACTIF)
                .build();
    }

    private Employee buildEmployeeEntity() {
        return Employee.builder()
                .employeeId(1L)
                .nom("Salma")
                .role("RH")
                .departement("Administration")
                .mobile("0612345678")
                .dateEmbauche(LocalDate.of(2023, 1, 10))
                .email("salma@example.com")
                .genre("Femme")
                .adresse("Casablanca")
                .statut(StatutEmploye.ACTIF)
                .build();
    }
}
