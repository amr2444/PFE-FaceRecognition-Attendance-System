package ma.dream.case_backend.service;

import jakarta.persistence.EntityManager;
import ma.dream.case_backend.config.Messages;
import ma.dream.case_backend.dto.PresenceJourDto;
import ma.dream.case_backend.enums.StatutPresence;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.mapper.PresenceJourMapper;
import ma.dream.case_backend.model.Employee;
import ma.dream.case_backend.model.PresenceJour;
import ma.dream.case_backend.repository.PresenceJourRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PresenceJourServiceTest {

    @Mock
    private PresenceJourRepository presenceJourRepository;

    @Mock
    private PresenceJourMapper presenceJourMapper;

    @Mock
    private EntityManager entityManager;

    @Mock
    private Messages messages;

    private PresenceJourService presenceJourService;

    @BeforeEach
    void setUp() {
        presenceJourService = new PresenceJourService(presenceJourRepository, presenceJourMapper, entityManager, messages);
    }

    @Test
    void shouldCreatePresentPresenceWhenEmployeeCheckedInOnly() {
        PresenceJourDto inputDto = PresenceJourDto.builder()
                .employeeId(1L)
                .firstIn(LocalTime.of(8, 0))
                .statut(StatutPresence.ABSENT)
                .shift("Matin")
                .build();

        PresenceJour mappedEntity = PresenceJour.builder()
                .employee(Employee.builder().employeeId(1L).build())
                .firstIn(LocalTime.of(8, 0))
                .shift("Matin")
                .statut(StatutPresence.ABSENT)
                .build();

        when(presenceJourMapper.toPresenceJour(inputDto)).thenReturn(mappedEntity);
        when(presenceJourRepository.save(any(PresenceJour.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(presenceJourMapper.toPresenceJourDto(any(PresenceJour.class))).thenAnswer(invocation -> {
            PresenceJour saved = invocation.getArgument(0);
            return PresenceJourDto.builder()
                    .employeeId(saved.getEmployee().getEmployeeId())
                    .firstIn(saved.getFirstIn())
                    .totalHeures(saved.getTotalHeures())
                    .statut(saved.getStatut())
                    .shift(saved.getShift())
                    .build();
        });

        PresenceJourDto result = presenceJourService.createPresenceJour(inputDto);

        ArgumentCaptor<PresenceJour> captor = ArgumentCaptor.forClass(PresenceJour.class);
        verify(presenceJourRepository).save(captor.capture());
        PresenceJour persisted = captor.getValue();

        assertEquals(StatutPresence.PRESENT, persisted.getStatut());
        assertEquals(Duration.ZERO, persisted.getTotalHeures());
        assertEquals(StatutPresence.PRESENT, result.getStatut());
    }

    @Test
    void shouldRejectPresenceWhenLastOutIsBeforeFirstIn() {
        PresenceJourDto inputDto = PresenceJourDto.builder()
                .employeeId(1L)
                .firstIn(LocalTime.of(9, 0))
                .lastOut(LocalTime.of(8, 30))
                .statut(StatutPresence.TERMINE)
                .build();

        PresenceJour mappedEntity = PresenceJour.builder()
                .employee(Employee.builder().employeeId(1L).build())
                .firstIn(LocalTime.of(9, 0))
                .lastOut(LocalTime.of(8, 30))
                .statut(StatutPresence.TERMINE)
                .build();

        when(presenceJourMapper.toPresenceJour(inputDto)).thenReturn(mappedEntity);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> presenceJourService.createPresenceJour(inputDto)
        );

        assertEquals("Last out cannot be before firstIn", exception.getMessage());
        verify(presenceJourRepository, never()).save(any(PresenceJour.class));
    }

    @Test
    void shouldMarkPresenceAsPausedWhenBreakStartedWithoutResume() throws TechnicalException {
        PresenceJour existingPresence = PresenceJour.builder()
                .presenceJourId(5L)
                .employee(Employee.builder().employeeId(1L).build())
                .firstIn(LocalTime.of(8, 0))
                .statut(StatutPresence.PRESENT)
                .build();

        PresenceJourDto updateDto = PresenceJourDto.builder()
                .employeeId(1L)
                .firstIn(LocalTime.of(8, 0))
                .breakTime(LocalTime.of(12, 0))
                .resumeTime(null)
                .lastOut(null)
                .statut(StatutPresence.PRESENT)
                .shift("Matin")
                .build();

        when(presenceJourRepository.findById(5L)).thenReturn(Optional.of(existingPresence));
        when(presenceJourRepository.save(any(PresenceJour.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(presenceJourMapper.toPresenceJourDto(any(PresenceJour.class))).thenAnswer(invocation -> {
            PresenceJour saved = invocation.getArgument(0);
            return PresenceJourDto.builder()
                    .presenceJourId(saved.getPresenceJourId())
                    .employeeId(saved.getEmployee().getEmployeeId())
                    .breakTime(saved.getBreakTime())
                    .resumeTime(saved.getResumeTime())
                    .statut(saved.getStatut())
                    .build();
        });

        PresenceJourDto result = presenceJourService.updatePresenceJour(5L, updateDto);

        assertEquals(StatutPresence.EN_PAUSE, result.getStatut());
        assertEquals(LocalTime.of(12, 0), result.getBreakTime());
    }

    @Test
    void shouldRejectCheckoutWhenBreakHasNoResumeTime() {
        PresenceJourDto inputDto = PresenceJourDto.builder()
                .employeeId(1L)
                .firstIn(LocalTime.of(8, 0))
                .breakTime(LocalTime.of(12, 0))
                .lastOut(LocalTime.of(17, 0))
                .statut(StatutPresence.TERMINE)
                .build();

        PresenceJour mappedEntity = PresenceJour.builder()
                .employee(Employee.builder().employeeId(1L).build())
                .firstIn(LocalTime.of(8, 0))
                .breakTime(LocalTime.of(12, 0))
                .lastOut(LocalTime.of(17, 0))
                .statut(StatutPresence.TERMINE)
                .build();

        when(presenceJourMapper.toPresenceJour(inputDto)).thenReturn(mappedEntity);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> presenceJourService.createPresenceJour(inputDto)
        );

        assertEquals("Resume time is required before lastOut when a break exists", exception.getMessage());
        verify(presenceJourRepository, never()).save(any(PresenceJour.class));
    }
}
