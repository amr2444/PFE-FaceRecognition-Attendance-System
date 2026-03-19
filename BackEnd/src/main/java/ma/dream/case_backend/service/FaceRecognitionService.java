package ma.dream.case_backend.service;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.dto.FaceRecognitionEmployeeDto;
import ma.dream.case_backend.dto.FaceRecognitionEventRequestDto;
import ma.dream.case_backend.dto.FaceRecognitionEventResponseDto;
import ma.dream.case_backend.enums.ApiErrorCode;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class FaceRecognitionService {

    private static final Duration DEFAULT_BREAK_DURATION = Duration.ofHours(1);
    private static final Duration RECOGNITION_COOLDOWN = Duration.ofSeconds(30);
    private static final String ACTION_CHECK_IN = "CHECK_IN";
    private static final String ACTION_BREAK_START = "BREAK_START";
    private static final String ACTION_BREAK_END = "BREAK_END";
    private static final String ACTION_CHECK_OUT = "CHECK_OUT";
    private static final String ACTION_ALREADY_COMPLETED = "ALREADY_COMPLETED";
    private static final String ACTION_IGNORED_RECENT_SCAN = "IGNORED_RECENT_SCAN";

    private final EmployeRepository employeRepository;
    private final PresenceJourRepository presenceJourRepository;
    private final EntreeRecenteRepository entreeRecenteRepository;
    private final EmployeeService employeeService;

    public List<FaceRecognitionEmployeeDto> getActiveEmployees() {
        return employeRepository.findAllByStatut(StatutEmploye.ACTIF)
                .stream()
                .map(this::toFaceRecognitionEmployeeDto)
                .toList();
    }

    public FaceRecognitionEventResponseDto registerRecognition(FaceRecognitionEventRequestDto requestDto) throws TechnicalException {
        if (requestDto == null || requestDto.getEmployeeId() == null) {
            throw new TechnicalException(HttpStatus.BAD_REQUEST, ApiErrorCode.REQUEST_VALIDATION_FAILED, "Employee ID is required");
        }

        Employee employee = employeRepository.findById(requestDto.getEmployeeId())
                .orElseThrow(() -> new TechnicalException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Employee not found"));

        if (employee.getStatut() != StatutEmploye.ACTIF) {
            throw new TechnicalException(HttpStatus.BAD_REQUEST, ApiErrorCode.BUSINESS_RULE_VIOLATION, "Employee is not active");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);

        if (isRecentDuplicateScan(employee.getEmployeeId(), now)) {
            PresenceJour currentPresence = presenceJourRepository
                    .findFirstByEmployeeEmployeeIdAndCreationDateBetween(employee.getEmployeeId(), startOfDay, endOfDay)
                    .orElse(null);
            return buildResponse(employee, currentPresence, ACTION_IGNORED_RECENT_SCAN);
        }

        PresenceJour presenceJour = presenceJourRepository
                .findFirstByEmployeeEmployeeIdAndCreationDateBetween(employee.getEmployeeId(), startOfDay, endOfDay)
                .orElse(null);

        String action = ACTION_ALREADY_COMPLETED;
        RecognitionEventType eventType = requestDto.getEventType() != null ? requestDto.getEventType() : RecognitionEventType.AUTO;

        if (presenceJour == null) {
            if (eventType == RecognitionEventType.BREAK_START || eventType == RecognitionEventType.BREAK_END || eventType == RecognitionEventType.CHECK_OUT) {
                throw new TechnicalException(HttpStatus.BAD_REQUEST, ApiErrorCode.BUSINESS_RULE_VIOLATION, "Cannot apply this event before check-in");
            }
            presenceJour = PresenceJour.builder()
                    .employee(employee)
                    .firstIn(now.toLocalTime())
                    .breakTime(null)
                    .resumeTime(null)
                    .lastOut(null)
                    .totalHeures(Duration.ZERO)
                    .statut(StatutPresence.PRESENT)
                    .shift(detectShift(now.toLocalTime()))
                    .note("Entree enregistree via reconnaissance faciale")
                    .creationDate(now)
                    .lastUpdateDate(now)
                    .build();
            presenceJour = presenceJourRepository.save(presenceJour);
            action = ACTION_CHECK_IN;
        } else {
            action = applyRecognitionTransition(presenceJour, now, eventType);
        }

        if (!ACTION_ALREADY_COMPLETED.equals(action) && !ACTION_IGNORED_RECENT_SCAN.equals(action)) {
            saveRecentEntry(employee, requestDto.getPortail(), now);
        }

        log.info("Face recognition processed for employee {} with action {}", employee.getEmployeeId(), action);

        return buildResponse(employee, presenceJour, action);
    }

    public void updateEmployeePhoto(Long employeeId, String photo) throws TechnicalException {
        employeeService.updateEmployeePhoto(employeeId, photo);
    }

    private void saveRecentEntry(Employee employee, String portail, LocalDateTime now) {
        EntreeRecente entreeRecente = EntreeRecente.builder()
                .employee(employee)
                .heure(now.toLocalTime())
                .portail((portail == null || portail.isBlank()) ? "Porte Principale" : portail)
                .date(LocalDate.now())
                .creationDate(now)
                .lastUpdateDate(now)
                .build();

        entreeRecenteRepository.save(entreeRecente);
    }

    private boolean isRecentDuplicateScan(Long employeeId, LocalDateTime now) {
        return entreeRecenteRepository
                .findTopByEmployeeEmployeeIdAndDateOrderByHeureDesc(employeeId, now.toLocalDate())
                .map(lastEntry -> {
                    LocalDateTime lastScanTime = LocalDateTime.of(lastEntry.getDate(), lastEntry.getHeure());
                    Duration elapsed = Duration.between(lastScanTime, now);
                    return !elapsed.isNegative() && elapsed.compareTo(RECOGNITION_COOLDOWN) < 0;
                })
                .orElse(false);
    }

    private String applyRecognitionTransition(PresenceJour presenceJour, LocalDateTime now, RecognitionEventType eventType) throws TechnicalException {
        if (presenceJour.getStatut() == StatutPresence.ABSENT || presenceJour.getFirstIn() == null) {
            if (eventType == RecognitionEventType.BREAK_START || eventType == RecognitionEventType.BREAK_END || eventType == RecognitionEventType.CHECK_OUT) {
                throw new TechnicalException(HttpStatus.BAD_REQUEST, ApiErrorCode.BUSINESS_RULE_VIOLATION, "Cannot apply this event before check-in");
            }
            presenceJour.setFirstIn(now.toLocalTime());
            presenceJour.setBreakTime(null);
            presenceJour.setResumeTime(null);
            presenceJour.setLastOut(null);
            presenceJour.setTotalHeures(Duration.ZERO);
            presenceJour.setStatut(StatutPresence.PRESENT);
            presenceJour.setShift(detectShift(now.toLocalTime()));
            presenceJour.setNote("Presence corrigee via reconnaissance faciale");
            presenceJour.setLastUpdateDate(LocalDateTime.now(ZoneOffset.UTC));
            presenceJourRepository.save(presenceJour);
            return ACTION_CHECK_IN;
        }

        if (presenceJour.getLastOut() != null || presenceJour.getStatut() == StatutPresence.TERMINE) {
            return ACTION_ALREADY_COMPLETED;
        }

        RecognitionEventType resolvedEventType = resolveEventType(presenceJour, eventType);

        if (resolvedEventType == RecognitionEventType.BREAK_START) {
            if (presenceJour.getStatut() == StatutPresence.EN_PAUSE) {
                return ACTION_ALREADY_COMPLETED;
            }
            presenceJour.setBreakTime(now.toLocalTime());
            presenceJour.setResumeTime(null);
            presenceJour.setStatut(StatutPresence.EN_PAUSE);
            presenceJour.setNote("Pause demarree via reconnaissance faciale");
            presenceJour.setLastUpdateDate(LocalDateTime.now(ZoneOffset.UTC));
            presenceJourRepository.save(presenceJour);
            return ACTION_BREAK_START;
        }

        if (resolvedEventType == RecognitionEventType.BREAK_END) {
            if (presenceJour.getStatut() != StatutPresence.EN_PAUSE || presenceJour.getBreakTime() == null) {
                throw new TechnicalException(HttpStatus.BAD_REQUEST, ApiErrorCode.BUSINESS_RULE_VIOLATION, "Cannot resume when employee is not on break");
            }
            presenceJour.setResumeTime(now.toLocalTime());
            presenceJour.setStatut(StatutPresence.PRESENT);
            presenceJour.setNote("Pause terminee via reconnaissance faciale");
            presenceJour.setLastUpdateDate(LocalDateTime.now(ZoneOffset.UTC));
            presenceJourRepository.save(presenceJour);
            return ACTION_BREAK_END;
        }

        if (presenceJour.getStatut() == StatutPresence.EN_PAUSE) {
            throw new TechnicalException(HttpStatus.BAD_REQUEST, ApiErrorCode.BUSINESS_RULE_VIOLATION, "Employee is currently on break");
        }

        presenceJour.setLastOut(now.toLocalTime());
        presenceJour.setStatut(StatutPresence.TERMINE);
        presenceJour.setTotalHeures(calculateTotalHeures(
                presenceJour.getFirstIn(),
                presenceJour.getBreakTime(),
                presenceJour.getResumeTime(),
                presenceJour.getLastOut()
        ));
        presenceJour.setNote("Sortie enregistree via reconnaissance faciale");
        presenceJour.setLastUpdateDate(LocalDateTime.now(ZoneOffset.UTC));
        presenceJourRepository.save(presenceJour);
        return ACTION_CHECK_OUT;
    }

    private RecognitionEventType resolveEventType(PresenceJour presenceJour, RecognitionEventType eventType) {
        if (eventType != RecognitionEventType.AUTO) {
            return eventType;
        }

        if (presenceJour.getStatut() == StatutPresence.EN_PAUSE) {
            return RecognitionEventType.BREAK_END;
        }

        return RecognitionEventType.CHECK_OUT;
    }

    private FaceRecognitionEventResponseDto buildResponse(Employee employee, PresenceJour presenceJour, String action) {
        return FaceRecognitionEventResponseDto.builder()
                .employeeId(employee.getEmployeeId())
                .employeeName(employee.getNom())
                .presenceJourId(presenceJour != null ? presenceJour.getPresenceJourId() : null)
                .action(action)
                .statut(presenceJour != null ? presenceJour.getStatut() : null)
                .firstIn(presenceJour != null ? presenceJour.getFirstIn() : null)
                .breakTime(presenceJour != null ? presenceJour.getBreakTime() : null)
                .resumeTime(presenceJour != null ? presenceJour.getResumeTime() : null)
                .lastOut(presenceJour != null ? presenceJour.getLastOut() : null)
                .totalHeures(presenceJour != null ? presenceJour.getTotalHeures() : Duration.ZERO)
                .build();
    }

    private Duration calculateTotalHeures(LocalTime firstIn, LocalTime breakTime, LocalTime resumeTime, LocalTime lastOut) {
        if (firstIn == null || lastOut == null || lastOut.isBefore(firstIn)) {
            return Duration.ZERO;
        }

        Duration total = Duration.between(firstIn, lastOut);
        if (breakTime != null && resumeTime != null && breakTime.isAfter(firstIn) && !resumeTime.isBefore(breakTime) && !resumeTime.isAfter(lastOut)) {
            total = total.minus(Duration.between(breakTime, resumeTime));
        } else if (breakTime != null && breakTime.isAfter(firstIn) && breakTime.isBefore(lastOut)) {
            total = total.minus(DEFAULT_BREAK_DURATION);
        }

        return total.isNegative() ? Duration.ZERO : total;
    }

    private String detectShift(LocalTime time) {
        if (time.isBefore(LocalTime.NOON)) {
            return "Matin";
        }
        if (time.isBefore(LocalTime.of(17, 0))) {
            return "Apres-midi";
        }
        return "Soir";
    }

    private FaceRecognitionEmployeeDto toFaceRecognitionEmployeeDto(Employee employee) {
        return FaceRecognitionEmployeeDto.builder()
                .employeeId(employee.getEmployeeId())
                .nom(employee.getNom())
                .role(employee.getRole())
                .departement(employee.getDepartement())
                .statut(employee.getStatut())
                .photo(employee.getPhoto())
                .build();
    }
}
