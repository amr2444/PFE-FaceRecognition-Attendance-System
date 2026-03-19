package ma.dream.case_backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import ma.dream.case_backend.config.SwaggerConfig;
import ma.dream.case_backend.dto.ApiErrorResponseDto;
import ma.dream.case_backend.dto.EntreeRecenteDto;
import ma.dream.case_backend.dto.EmployeePhotoUpdateDto;
import ma.dream.case_backend.dto.FaceRecognitionEmployeeDto;
import ma.dream.case_backend.dto.FaceRecognitionEventRequestDto;
import ma.dream.case_backend.dto.FaceRecognitionEventResponseDto;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.service.FaceRecognitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/face-recognition")
@AllArgsConstructor
@Validated
@SecurityRequirement(name = SwaggerConfig.BEARER_SECURITY_SCHEME)
public class FaceRecognitionController {

    private final FaceRecognitionService faceRecognitionService;

    @Operation(summary = "List active employees for recognition", description = "Returns the active employees exposed to the recognition client")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Employees returned"),
            @ApiResponse(responseCode = "401", description = "Authentication required", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Access denied", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class)))
    })
    @GetMapping("/employees")
    public ResponseEntity<List<FaceRecognitionEmployeeDto>> getActiveEmployees() {
        return ResponseEntity.ok(faceRecognitionService.getActiveEmployees());
    }

    @Operation(summary = "List recent recognition entries", description = "Returns the latest face recognition entries for the dashboard")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recent entries returned"),
            @ApiResponse(responseCode = "400", description = "Invalid limit parameter", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class)))
    })
    @GetMapping("/recent-entries")
    public ResponseEntity<List<EntreeRecenteDto>> getRecentEntries(@RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(faceRecognitionService.getRecentEntries(limit));
    }

    @Operation(summary = "Upload employee photo for recognition", description = "Updates the stored photo used for facial recognition")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Photo updated"),
            @ApiResponse(responseCode = "400", description = "Invalid employee ID or photo payload", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Employee not found", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class)))
    })
    @PostMapping("/employees/{employeeId}/photo")
    public ResponseEntity<Void> uploadEmployeePhoto(@PathVariable @Positive(message = "employeeId must be positive") Long employeeId,
                                                     @Valid @RequestBody EmployeePhotoUpdateDto employeePhotoUpdateDto) throws TechnicalException {
        faceRecognitionService.updateEmployeePhoto(employeeId, employeePhotoUpdateDto.getPhoto());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Register a recognition event", description = "Registers a face recognition event and updates the attendance workflow")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recognition event processed"),
            @ApiResponse(responseCode = "400", description = "Invalid payload or business rule violation", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Employee not found", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class)))
    })
    @PostMapping("/events")
    public ResponseEntity<FaceRecognitionEventResponseDto> registerRecognition(@Valid @RequestBody FaceRecognitionEventRequestDto requestDto)
            throws TechnicalException {
        return ResponseEntity.ok(faceRecognitionService.registerRecognition(requestDto));
    }
}
