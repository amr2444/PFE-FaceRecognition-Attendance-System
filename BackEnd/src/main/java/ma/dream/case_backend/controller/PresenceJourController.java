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
import ma.dream.case_backend.dto.PresenceJourDto;
import ma.dream.case_backend.dto.PresenceStatutCountDto;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.service.PresenceJourService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/presences")
@AllArgsConstructor
@Slf4j
@Validated
public class PresenceJourController {

    private final PresenceJourService presenceJourService;

    @PostMapping("/")
    public ResponseEntity<PresenceJourDto> createPresenceJour(@Valid @RequestBody PresenceJourDto presenceJourDto) {
        PresenceJourDto createdPresenceJour = presenceJourService.createPresenceJour(presenceJourDto);
        return new ResponseEntity<>(createdPresenceJour, HttpStatus.CREATED);
    }

    @Operation(summary = "Retrieve all PresenceJour", description = "Récupère la liste de tous les PresenceJour")
    @GetMapping("/")
    public ResponseEntity<Page<PresenceJourDto>> getAllPresenceJour(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "5") @Min(value = 1, message = "Size must be at least 1") @Max(value = 100, message = "Size must not exceed 100") int size,
            @RequestParam(required = false) @Size(max = 120, message = "searchByNom must not exceed 120 characters") final String searchByNom,
            @RequestParam(required = false) @Size(max = 20, message = "searchByStatus must not exceed 20 characters") final String searchByStatus,
            @RequestParam(required = false) @Size(max = 40, message = "searchByShift must not exceed 40 characters") final String searchByShift,
            @RequestParam(defaultValue = "lastUpdateDate") @Pattern(regexp = "^(firstIn|breakTime|resumeTime|lastOut|statut|shift|creationDate|lastUpdateDate)$", message = "sortBy is invalid") String sortBy,
            @RequestParam(defaultValue = "desc") @Pattern(regexp = "^(?i)(asc|desc)$", message = "direction must be asc or desc") String direction
    ) {
        Page<PresenceJourDto> presenceJours = presenceJourService.getAllPresenceJour(page, size, searchByNom, searchByStatus, searchByShift, sortBy, direction);
        return ResponseEntity.ok(presenceJours);
    }

    @Operation(summary = "Update PresenceJour details", description = "Récupère les détails d'un PresenceJour par ID")
    @PutMapping("/{id}")
    public ResponseEntity<PresenceJourDto> updatePresenceJour(@PathVariable @Positive(message = "id must be positive") Long id, @Valid @RequestBody PresenceJourDto presenceJourDto) throws TechnicalException {
        log.info("Update PresenceJour: {}", id);
        PresenceJourDto updatedPresenceJour = presenceJourService.updatePresenceJour(id, presenceJourDto);
        return ResponseEntity.ok(updatedPresenceJour);
    }

    @Operation(summary = "Retrieve PresenceJour by ID", description = "Récupère les détails d'un PresenceJour par ID")
    @GetMapping("/{id}")
    public ResponseEntity<PresenceJourDto> getPresenceJourById(@PathVariable @Positive(message = "id must be positive") Long id) throws TechnicalException {
        log.info("get PresenceJour by id: {}", id);
        return ResponseEntity.ok(presenceJourService.getPresenceJourById(id));
    }

    @Operation(summary = "Delete a PresenceJour", description = "Supprime un PresenceJour par ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePresenceJour(@PathVariable @Positive(message = "id must be positive") Long id) throws TechnicalException {
        log.info("delete PresenceJour by id: {}", id);
        presenceJourService.deletePresenceJour(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/statuts/today")
    public ResponseEntity<List<PresenceStatutCountDto>> getPresenceStatutsCountToday() {
        List<PresenceStatutCountDto> result = presenceJourService.countPresenceStatutsToday();
        return ResponseEntity.ok(result);
    }


    @Operation(summary = "Export PresenceJour data", description = "Exporte les données de présence dans un format spécifié (CSV, Excel, etc.)")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportPresenceJour(
            @RequestParam(defaultValue = "csv") @Pattern(regexp = "^(?i)(csv|excel)$", message = "format must be csv or excel") String format,
            @RequestParam(required = false) @Size(max = 120, message = "searchByNom must not exceed 120 characters") final String searchByNom,
            @RequestParam(required = false) @Size(max = 20, message = "searchByStatus must not exceed 20 characters") final String searchByStatus,
            @RequestParam(required = false) @Size(max = 40, message = "searchByShift must not exceed 40 characters") final String searchByShift,
            @RequestParam(required = false) @Min(value = 0, message = "page must be greater than or equal to 0") Integer page,
            @RequestParam(required = false) @Min(value = 1, message = "size must be at least 1") @Max(value = 1000, message = "size must not exceed 1000") Integer size,
            @RequestParam(defaultValue = "false") boolean exportAll
    ) throws TechnicalException {
        if (!exportAll && (page == null || size == null)) {
            throw new IllegalArgumentException("page and size are required when exportAll is false");
        }

        byte[] exportData;
        Integer requestedPage = exportAll ? null : page;
        Integer requestedSize = exportAll ? null : size;

        exportData = presenceJourService.exportPresenceJourPage(
                format,
                searchByNom,
                searchByStatus,
                searchByShift,
                requestedPage,
                requestedSize
        );

        HttpHeaders headers = new HttpHeaders();
        String contentType;
        String fileName;

        switch (format.toLowerCase()) {
            case "excel":
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                fileName = "presences.xlsx";
                break;
            case "csv":
            default:
                contentType = "text/csv";
                fileName = "presences.csv";
                break;
        }

        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDispositionFormData("attachment", fileName);

        return new ResponseEntity<>(exportData, headers, HttpStatus.OK);
    }

}
