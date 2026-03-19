package ma.dream.case_backend.service;

import ma.dream.case_backend.dto.FaceRecognitionEventRequestDto;
import ma.dream.case_backend.dto.FaceRecognitionEventResponseDto;
import ma.dream.case_backend.enums.RecognitionEventType;
import ma.dream.case_backend.enums.StatutEmploye;
import ma.dream.case_backend.enums.StatutPresence;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.model.Employee;
import ma.dream.case_backend.model.EntreeRecente;
import ma.dream.case_backend.model.PresenceJour;
import ma.dream.case_backend.repository.EmployeRepository;
import ma.dream.case_backend.repository.EntreeRecenteRepository;
import ma.dream.case_backend.repository.PresenceJourRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FaceRecognitionServiceTest {

    @Mock
    private EmployeRepository employeRepository;

    @Mock
    private PresenceJourRepository presenceJourRepository;

    @Mock
    private EntreeRecenteRepository entreeRecenteRepository;

    @Mock
    private EmployeeService employeeService;

    private FaceRecognitionService faceRecognitionService;

    @BeforeEach
    void setUp() {
        faceRecognitionService = new FaceRecognitionService(
                employeRepository,
                presenceJourRepository,
                entreeRecenteRepository,
                employeeService
        );
    }

    @Test
    void shouldCreateCheckInForActiveEmployeeWithoutPresence() {
        Employee employee = buildEmployee(StatutEmploye.ACTIF);

        when(employeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(entreeRecenteRepository.findTopByEmployeeEmployeeIdAndDateOrderByHeureDesc(anyLong(), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(presenceJourRepository.findFirstByEmployeeEmployeeIdAndCreationDateBetween(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());
        when(presenceJourRepository.save(any(PresenceJour.class))).thenAnswer(invocation -> {
            PresenceJour savedPresence = invocation.getArgument(0);
            savedPresence.setPresenceJourId(10L);
            return savedPresence;
        });

        FaceRecognitionEventResponseDto response = assertDoesNotThrow(() -> faceRecognitionService.registerRecognition(
                new FaceRecognitionEventRequestDto(1L, "Porte A", RecognitionEventType.AUTO)
        ));

        assertEquals("CHECK_IN", response.getAction());
        assertEquals(StatutPresence.PRESENT, response.getStatut());
        assertNotNull(response.getFirstIn());
        assertNull(response.getBreakTime());
        assertNull(response.getLastOut());
        verify(presenceJourRepository).save(any(PresenceJour.class));
        verify(entreeRecenteRepository).save(any(EntreeRecente.class));
    }

    @Test
    void shouldRejectInactiveEmployee() {
        Employee employee = buildEmployee(StatutEmploye.INACTIF);

        when(employeRepository.findById(1L)).thenReturn(Optional.of(employee));

        TechnicalException exception = assertThrows(TechnicalException.class, () -> faceRecognitionService.registerRecognition(
                new FaceRecognitionEventRequestDto(1L, "Porte A", RecognitionEventType.AUTO)
        ));

        assertEquals("Employee is not active", exception.getMessage());
        verify(presenceJourRepository, never()).findFirstByEmployeeEmployeeIdAndCreationDateBetween(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(entreeRecenteRepository, never()).save(any(EntreeRecente.class));
    }

    @Test
    void shouldStartBreakForPresentEmployee() {
        Employee employee = buildEmployee(StatutEmploye.ACTIF);
        PresenceJour presenceJour = PresenceJour.builder()
                .presenceJourId(10L)
                .employee(employee)
                .firstIn(LocalTime.of(8, 0))
                .statut(StatutPresence.PRESENT)
                .build();

        when(employeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(entreeRecenteRepository.findTopByEmployeeEmployeeIdAndDateOrderByHeureDesc(anyLong(), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(presenceJourRepository.findFirstByEmployeeEmployeeIdAndCreationDateBetween(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Optional.of(presenceJour));
        when(presenceJourRepository.save(any(PresenceJour.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FaceRecognitionEventResponseDto response = assertDoesNotThrow(() -> faceRecognitionService.registerRecognition(
                new FaceRecognitionEventRequestDto(1L, "Porte A", RecognitionEventType.BREAK_START)
        ));

        assertEquals("BREAK_START", response.getAction());
        assertEquals(StatutPresence.EN_PAUSE, response.getStatut());
        assertNotNull(response.getBreakTime());
        assertNull(response.getResumeTime());
        verify(entreeRecenteRepository).save(any(EntreeRecente.class));
    }

    @Test
    void shouldResumeBreakForPausedEmployee() {
        Employee employee = buildEmployee(StatutEmploye.ACTIF);
        PresenceJour presenceJour = PresenceJour.builder()
                .presenceJourId(10L)
                .employee(employee)
                .firstIn(LocalTime.of(8, 0))
                .breakTime(LocalTime.of(12, 0))
                .statut(StatutPresence.EN_PAUSE)
                .build();

        when(employeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(entreeRecenteRepository.findTopByEmployeeEmployeeIdAndDateOrderByHeureDesc(anyLong(), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(presenceJourRepository.findFirstByEmployeeEmployeeIdAndCreationDateBetween(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Optional.of(presenceJour));
        when(presenceJourRepository.save(any(PresenceJour.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FaceRecognitionEventResponseDto response = assertDoesNotThrow(() -> faceRecognitionService.registerRecognition(
                new FaceRecognitionEventRequestDto(1L, "Porte A", RecognitionEventType.BREAK_END)
        ));

        assertEquals("BREAK_END", response.getAction());
        assertEquals(StatutPresence.PRESENT, response.getStatut());
        assertEquals(LocalTime.of(12, 0), response.getBreakTime());
        assertNotNull(response.getResumeTime());
        assertNull(response.getLastOut());
    }

    @Test
    void shouldComputeWorkedDurationWithActualBreakOnCheckout() {
        Employee employee = buildEmployee(StatutEmploye.ACTIF);
        LocalTime firstIn = LocalTime.MIDNIGHT;
        LocalTime breakStart = LocalTime.of(0, 1);
        LocalTime resumeTime = LocalTime.of(0, 2);
        PresenceJour presenceJour = PresenceJour.builder()
                .presenceJourId(10L)
                .employee(employee)
                .firstIn(firstIn)
                .breakTime(breakStart)
                .resumeTime(resumeTime)
                .statut(StatutPresence.PRESENT)
                .build();

        when(employeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(entreeRecenteRepository.findTopByEmployeeEmployeeIdAndDateOrderByHeureDesc(anyLong(), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(presenceJourRepository.findFirstByEmployeeEmployeeIdAndCreationDateBetween(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Optional.of(presenceJour));
        when(presenceJourRepository.save(any(PresenceJour.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FaceRecognitionEventResponseDto response = assertDoesNotThrow(() -> faceRecognitionService.registerRecognition(
                new FaceRecognitionEventRequestDto(1L, "Porte A", RecognitionEventType.CHECK_OUT)
        ));

        Duration expectedDuration = Duration.between(firstIn, response.getLastOut());
        if (!response.getLastOut().isBefore(resumeTime)) {
            expectedDuration = expectedDuration.minus(Duration.between(breakStart, resumeTime));
        }

        assertEquals("CHECK_OUT", response.getAction());
        assertEquals(StatutPresence.TERMINE, response.getStatut());
        assertNotNull(response.getLastOut());
        assertEquals(expectedDuration, response.getTotalHeures());
    }

    @Test
    void shouldIgnoreRecentDuplicateScan() {
        Employee employee = buildEmployee(StatutEmploye.ACTIF);
        PresenceJour presenceJour = PresenceJour.builder()
                .presenceJourId(10L)
                .employee(employee)
                .firstIn(LocalTime.of(8, 0))
                .statut(StatutPresence.PRESENT)
                .build();
        EntreeRecente recentEntry = EntreeRecente.builder()
                .employee(employee)
                .date(LocalDate.now())
                .heure(LocalTime.now().minusSeconds(5))
                .build();

        when(employeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(entreeRecenteRepository.findTopByEmployeeEmployeeIdAndDateOrderByHeureDesc(anyLong(), any(LocalDate.class)))
                .thenReturn(Optional.of(recentEntry));
        when(presenceJourRepository.findFirstByEmployeeEmployeeIdAndCreationDateBetween(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Optional.of(presenceJour));

        FaceRecognitionEventResponseDto response = assertDoesNotThrow(() -> faceRecognitionService.registerRecognition(
                new FaceRecognitionEventRequestDto(1L, "Porte A", RecognitionEventType.AUTO)
        ));

        assertEquals("IGNORED_RECENT_SCAN", response.getAction());
        assertEquals(StatutPresence.PRESENT, response.getStatut());
        verify(presenceJourRepository, never()).save(any(PresenceJour.class));
        verify(entreeRecenteRepository, never()).save(any(EntreeRecente.class));
    }

    @Test
    void shouldRejectBreakEndWhenEmployeeIsNotOnBreak() {
        Employee employee = buildEmployee(StatutEmploye.ACTIF);
        PresenceJour presenceJour = PresenceJour.builder()
                .presenceJourId(10L)
                .employee(employee)
                .firstIn(LocalTime.of(8, 0))
                .statut(StatutPresence.PRESENT)
                .build();

        when(employeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(entreeRecenteRepository.findTopByEmployeeEmployeeIdAndDateOrderByHeureDesc(anyLong(), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(presenceJourRepository.findFirstByEmployeeEmployeeIdAndCreationDateBetween(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Optional.of(presenceJour));

        TechnicalException exception = assertThrows(TechnicalException.class, () -> faceRecognitionService.registerRecognition(
                new FaceRecognitionEventRequestDto(1L, "Porte A", RecognitionEventType.BREAK_END)
        ));

        assertEquals("Cannot resume when employee is not on break", exception.getMessage());
    }

    private Employee buildEmployee(StatutEmploye statut) {
        return Employee.builder()
                .employeeId(1L)
                .nom("Alice")
                .statut(statut)
                .build();
    }
}
