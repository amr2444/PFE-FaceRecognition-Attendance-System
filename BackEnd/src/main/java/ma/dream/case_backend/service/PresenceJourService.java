package ma.dream.case_backend.service;


import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.config.Messages;
import ma.dream.case_backend.dto.PresenceJourDto;
import ma.dream.case_backend.dto.PresenceStatutCountDto;
import ma.dream.case_backend.enums.StatutPresence;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.mapper.PresenceJourMapper;
import ma.dream.case_backend.model.Employee;
import ma.dream.case_backend.model.PresenceJour;
import ma.dream.case_backend.repository.PresenceJourRepository;
import ma.dream.case_backend.util.constants.GlobalConstants;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.poi.xssf.usermodel.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFSheet;

@Service
@AllArgsConstructor
@Slf4j
public class PresenceJourService {

    private final PresenceJourRepository presenceJourRepository;
    private final PresenceJourMapper presenceJourMapper;
    private final EntityManager entityManager;
    private final Messages messages;


    public PresenceJour createPresenceJour(PresenceJourDto presenceJourDto) {
        PresenceJour presenceJour = presenceJourMapper.toPresenceJour(presenceJourDto);

        if (presenceJour.getFirstIn() != null && presenceJour.getLastOut() != null) {
            Duration dureeTravail = Duration.between(presenceJour.getFirstIn(), presenceJour.getLastOut());

            Duration pause = presenceJour.getBreakTime() != null ? Duration.ofHours(1) : Duration.ZERO;

            Duration total = dureeTravail.minus(pause);
            presenceJour.setTotalHeures(total);
        } else {
            presenceJour.setTotalHeures(Duration.ZERO);
        }

        presenceJour.setCreationDate(LocalDateTime.now());
        presenceJour.setLastUpdateDate(LocalDateTime.now());

        return presenceJourRepository.save(presenceJour);
    }

    public Page<PresenceJourDto> getAllPresenceJour(int page, int size, String searchByNom, String searchByStatus, String searchByShift, String sortBy, String direction) {
        log.debug("Start service Get Presences page: {} size: {} sortBy: {} direction: {} searchByNom: {} searchByStatus: {} searchByShift: {}",
                page, size, sortBy, direction, searchByNom, searchByStatus, searchByShift);

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PresenceJour> presenceJours;

        if (searchByNom != null || searchByStatus != null || searchByShift != null) {
            presenceJours = filterPresenceJours(searchByNom, searchByStatus, searchByShift, pageable);
        } else {
            presenceJours = presenceJourRepository.findAll(pageable);
        }

        List<PresenceJourDto> presenceJourDtos = presenceJours.getContent().stream()
                .map(presenceJourMapper::toPresenceJourDto)
                .toList();
        log.debug("End service getPresenceJourByCriteria ");
        return new PageImpl<>(presenceJourDtos, pageable, presenceJours.getTotalElements());
    }

    private Page<PresenceJour> filterPresenceJours(String searchByNom, String searchByStatus, String searchByShift, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<PresenceJour> cq = cb.createQuery(PresenceJour.class);
        Root<PresenceJour> root = cq.from(PresenceJour.class);

        Predicate predicate = buildPredicate(cb, root, searchByNom, searchByStatus, searchByShift);
        cq.where(predicate);

        if (!pageable.getSort().isEmpty()) {
            List<Order> orders = new ArrayList<>();
            for (Sort.Order order : pageable.getSort()) {
                Path<Object> path = root.get(order.getProperty());
                orders.add(order.isAscending() ? cb.asc(path) : cb.desc(path));
            }
            cq.orderBy(orders);
        }

        TypedQuery<PresenceJour> typedQuery = entityManager.createQuery(cq);
        long totalCount = typedQuery.getResultList().size();

        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<PresenceJour> resultList = typedQuery.getResultList();

        return new PageImpl<>(resultList, pageable, totalCount);
    }

    private Predicate buildPredicate(CriteriaBuilder criteriaBuilder, Root<PresenceJour> root,
                                     String searchByNom, String searchByStatus, String searchByShift) {
        Predicate predicate = criteriaBuilder.conjunction();

        if (searchByNom != null && !searchByNom.isEmpty()) {
            Join<Object, Object> employeeJoin = root.join("employee");
            predicate = criteriaBuilder.and(predicate,
                    criteriaBuilder.like(
                            criteriaBuilder.lower(employeeJoin.get("nom")),
                            "%" + searchByNom.toLowerCase() + "%"
                    )
            );
        }


        if (searchByStatus != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(criteriaBuilder.lower(root.get("statut")),
                    "%" + searchByStatus.toLowerCase() + "%"));
        }

        if (searchByShift != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(criteriaBuilder.lower(root.get("shift")),
                    "%" + searchByShift.toLowerCase() + "%"));
        }



        return predicate;
    }

    public PresenceJourDto updatePresenceJour(Long id, PresenceJourDto presenceJourDto) throws TechnicalException {
        log.debug("Start service update PresenceJour id {}", id);
        PresenceJour presenceJour = presenceJourRepository.findById(id)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));

        presenceJour.setBreakTime(presenceJourDto.getBreakTime());
        presenceJour.setLastOut(presenceJourDto.getLastOut());
        presenceJour.setFirstIn(presenceJourDto.getFirstIn());
        presenceJour.setNote(presenceJourDto.getNote());
        presenceJour.setShift(presenceJourDto.getShift());
        presenceJour.setStatut(presenceJourDto.getStatut());

        if (presenceJour.getFirstIn() != null && presenceJour.getLastOut() != null) {
            Duration dureeTravail = Duration.between(presenceJour.getFirstIn(), presenceJour.getLastOut());

            Duration pause = presenceJour.getBreakTime() != null ? Duration.ofHours(1) : Duration.ZERO;

            Duration total = dureeTravail.minus(pause);
            presenceJour.setTotalHeures(total);
        } else {
            presenceJour.setTotalHeures(Duration.ZERO);
        }

        presenceJour.setLastUpdateDate(LocalDateTime.now(ZoneOffset.UTC));
        log.debug("End service update employee  with id {}, employee {}", id, presenceJourDto);
        return presenceJourMapper.toPresenceJourDto(presenceJourRepository.save(presenceJour));
    }

    public PresenceJourDto getPresenceJourById(Long id) throws TechnicalException {
        log.debug("Start service get PresenceJour By Id {}", id);
        return presenceJourRepository.findById(id)
                .map(presenceJourMapper::toPresenceJourDto)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));
    }

    public void deletePresenceJour(Long id) throws TechnicalException {
        log.debug("Start service delete PresenceJour By Id {}", id);
        if (id == null) {
            throw new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND));
        }
        PresenceJour presenceJour = presenceJourRepository.findById(id)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));
        presenceJourRepository.delete(presenceJour);
        log.debug("End service delete PresenceJour By Id {}", id);
    }


    public List<PresenceStatutCountDto> countPresenceStatutsToday() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);

        List<Object[]> results = presenceJourRepository.countByStatutBetweenDates(startOfDay, endOfDay);

        return results.stream()
                .map(row -> new PresenceStatutCountDto((StatutPresence) row[0], (Long) row[1]))
                .collect(Collectors.toList());
    }

    public byte[] exportPresenceJourPage(String format, String searchByNom, String searchByStatus,
                                         String searchByShift, Integer page, Integer size) throws TechnicalException {
        try {
            // Définir des valeurs par défaut si page ou size sont null
            int pageNumber = (page != null) ? page : 0;
            int pageSize = (size != null) ? size : Integer.MAX_VALUE;

            // Récupérer les données paginées
            Page<PresenceJourDto> presencePage = getAllPresenceJour(
                    pageNumber,
                    pageSize,
                    searchByNom,
                    searchByStatus,
                    searchByShift,
                    "lastUpdateDate",
                    "desc"
            );

            // Convertir en liste
            List<PresenceJourDto> data = presencePage.getContent();

            // Générer le fichier selon le format demandé
            switch (format.toLowerCase()) {
                case "excel":
                    return generateExcelExport(data);
                case "csv":
                default:
                    return generateCsvExport(data);
            }
        } catch (Exception e) {
            log.error("Error during export: {}", e.getMessage());
            throw new TechnicalException("Export failed: " + e.getMessage());
        }
    }

    private byte[] generateExcelExport(List<PresenceJourDto> data) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            XSSFSheet sheet = workbook.createSheet("Presences");

            // Création de l'en-tête
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "ID", "Employee ID", "Employee Name", "First In",
                    "Break Time", "Last Out", "Total Hours",
                    "Status", "Shift", "Note", "Creation Date", "Last Update"
            };

            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            // Remplissage des données
            int rowNum = 1;
            for (PresenceJourDto dto : data) {
                Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(dto.getPresenceJourId() != null ? dto.getPresenceJourId() : 0);
                row.createCell(1).setCellValue(dto.getEmployeeId() != null ? dto.getEmployeeId() : 0);
                row.createCell(2).setCellValue(dto.getEmployeeName() != null ? dto.getEmployeeName() : "");
                row.createCell(3).setCellValue(dto.getFirstIn() != null ? dto.getFirstIn().toString() : "");
                row.createCell(4).setCellValue(dto.getBreakTime() != null ? dto.getBreakTime().toString() : "");
                row.createCell(5).setCellValue(dto.getLastOut() != null ? dto.getLastOut().toString() : "");
                row.createCell(6).setCellValue(dto.getTotalHeures() != null ? formatDuration(dto.getTotalHeures()) : "");
                row.createCell(7).setCellValue(dto.getStatut() != null ? dto.getStatut().name() : "");
                row.createCell(8).setCellValue(dto.getShift() != null ? dto.getShift() : "");
                row.createCell(9).setCellValue(dto.getNote() != null ? dto.getNote() : "");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generateCsvExport(List<PresenceJourDto> data) throws TechnicalException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(out))) {

            // En-tête CSV
            writer.println("ID,Employee ID,Employee Name,First In,Break Time,Last Out,Total Hours,Status,Shift,Note");

            // Données CSV
            for (PresenceJourDto dto : data) {
                writer.println(String.join(",",
                        dto.getPresenceJourId() != null ? dto.getPresenceJourId().toString() : "",
                        dto.getEmployeeId() != null ? dto.getEmployeeId().toString() : "",
                        escapeCsv(dto.getEmployeeName()),
                        dto.getFirstIn() != null ? dto.getFirstIn().toString() : "",
                        dto.getBreakTime() != null ? dto.getBreakTime().toString() : "",
                        dto.getLastOut() != null ? dto.getLastOut().toString() : "",
                        dto.getTotalHeures() != null ? formatDuration(dto.getTotalHeures()) : "",
                        dto.getStatut() != null ? dto.getStatut().name() : "",
                        escapeCsv(dto.getShift()),
                        escapeCsv(dto.getNote())
                ));
            }

            writer.flush();
            return out.toByteArray();
        } catch (IOException e) {
            String errorMessage = "CSV generation failed: " + e.getMessage();
            log.error(errorMessage, e);
            throw new TechnicalException(errorMessage);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String formatDuration(Duration duration) {
        long hours = duration.toHours();
        long minutes = duration.minusHours(hours).toMinutes();
        return String.format("%dh %02dm", hours, minutes);
    }


}
