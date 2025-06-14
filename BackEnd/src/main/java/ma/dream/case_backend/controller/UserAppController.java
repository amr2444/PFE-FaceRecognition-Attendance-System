package ma.dream.case_backend.controller;


import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.dto.UserAppDto;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.model.UserApp;
import ma.dream.case_backend.service.UserAppService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@AllArgsConstructor
@Slf4j
public class UserAppController {

    private final UserAppService userAppService;

    @PostMapping("/")
    public ResponseEntity<UserApp> createUserApp(@RequestBody UserAppDto userAppDto) {
        try {
            UserApp createUserApp = userAppService.createUserApp(userAppDto);
            return new ResponseEntity<>(createUserApp, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @Operation(summary = "Retrieve all UserApp", description = "Récupère la liste de tous les UserApps")
    @GetMapping("/")
    public ResponseEntity<Page<UserAppDto>> getAllUserApps(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) final String searchByName,
            @RequestParam(required = false) final String searchByEmail
    ) {
        Page<UserAppDto> userApps = userAppService.getAllUserApps(page, size, searchByName, searchByEmail);
        return ResponseEntity.ok(userApps);
    }

    @Operation(summary = "Update UserApp details", description = "Récupère les détails d'un UserApp par ID")
    @PutMapping("/{id}")
    public ResponseEntity<UserAppDto> updateUserApp(@PathVariable Long id, @RequestBody UserAppDto userAppDto) throws TechnicalException {
        log.info("Update UserApp: {}", id);
        UserAppDto updateUserApp = userAppService.updateUserApp(id, userAppDto);
        return ResponseEntity.ok(updateUserApp);
    }

    @Operation(summary = "Retrieve UserApp by ID", description = "Récupère les détails d'un UserApp par ID")
    @GetMapping("/{id}")
    public ResponseEntity<UserAppDto> getUserAppById(@PathVariable Long id) throws TechnicalException {
        log.info("get UserApp by id: {}", id);
        return ResponseEntity.ok(userAppService.getUserAppById(id));
    }

    @Operation(summary = "Delete a UserApp", description = "Supprime un UserApp par ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserApp(@PathVariable Long id) {
        log.info("delete UserApp by id: {}", id);
        try {
            userAppService.deleteUserApp(id);
            return ResponseEntity.noContent().build();
        } catch (TechnicalException e) {
            log.error("Error deleting UserApp: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getTotalUserApps() {
        return ResponseEntity.ok(userAppService.getTotalUserApps());
    }

}
