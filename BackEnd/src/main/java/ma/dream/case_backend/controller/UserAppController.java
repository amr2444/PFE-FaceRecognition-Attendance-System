package ma.dream.case_backend.controller;


import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.dto.UserAppDto;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.service.UserAppService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@AllArgsConstructor
@Slf4j
@Validated
public class UserAppController {

    private final UserAppService userAppService;

    @PostMapping("/")
    public ResponseEntity<UserAppDto> createUserApp(@Valid @RequestBody UserAppDto userAppDto) throws TechnicalException {
        UserAppDto createdUserApp = userAppService.createUserApp(userAppDto);
        return new ResponseEntity<>(createdUserApp, HttpStatus.CREATED);
    }

    @Operation(summary = "Retrieve all UserApp", description = "Récupère la liste de tous les UserApps")
    @GetMapping("/")
    public ResponseEntity<Page<UserAppDto>> getAllUserApps(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "5") @Min(value = 1, message = "Size must be at least 1") @Max(value = 100, message = "Size must not exceed 100") int size,
            @RequestParam(required = false) @Size(max = 120, message = "searchByName must not exceed 120 characters") final String searchByName,
            @RequestParam(required = false) @Size(max = 160, message = "searchByEmail must not exceed 160 characters") final String searchByEmail
    ) {
        Page<UserAppDto> userApps = userAppService.getAllUserApps(page, size, searchByName, searchByEmail);
        return ResponseEntity.ok(userApps);
    }

    @Operation(summary = "Update UserApp details", description = "Récupère les détails d'un UserApp par ID")
    @PutMapping("/{id}")
    public ResponseEntity<UserAppDto> updateUserApp(@PathVariable @Positive(message = "id must be positive") Long id, @Valid @RequestBody UserAppDto userAppDto) throws TechnicalException {
        log.info("Update UserApp: {}", id);
        UserAppDto updateUserApp = userAppService.updateUserApp(id, userAppDto);
        return ResponseEntity.ok(updateUserApp);
    }

    @Operation(summary = "Retrieve UserApp by ID", description = "Récupère les détails d'un UserApp par ID")
    @GetMapping("/{id}")
    public ResponseEntity<UserAppDto> getUserAppById(@PathVariable @Positive(message = "id must be positive") Long id) throws TechnicalException {
        log.info("get UserApp by id: {}", id);
        return ResponseEntity.ok(userAppService.getUserAppById(id));
    }

    @Operation(summary = "Delete a UserApp", description = "Supprime un UserApp par ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserApp(@PathVariable @Positive(message = "id must be positive") Long id) throws TechnicalException {
        log.info("delete UserApp by id: {}", id);
        userAppService.deleteUserApp(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getTotalUserApps() {
        return ResponseEntity.ok(userAppService.getTotalUserApps());
    }

}
