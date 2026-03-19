package ma.dream.case_backend.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/face-recognition")
@AllArgsConstructor
@Validated
public class FaceRecognitionController {

    private final FaceRecognitionService faceRecognitionService;

    @GetMapping("/employees")
    public ResponseEntity<List<FaceRecognitionEmployeeDto>> getActiveEmployees() {
        return ResponseEntity.ok(faceRecognitionService.getActiveEmployees());
    }

    @PostMapping("/employees/{employeeId}/photo")
    public ResponseEntity<Void> uploadEmployeePhoto(@PathVariable @Positive(message = "employeeId must be positive") Long employeeId,
                                                     @Valid @RequestBody EmployeePhotoUpdateDto employeePhotoUpdateDto) throws TechnicalException {
        faceRecognitionService.updateEmployeePhoto(employeeId, employeePhotoUpdateDto.getPhoto());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/events")
    public ResponseEntity<FaceRecognitionEventResponseDto> registerRecognition(@Valid @RequestBody FaceRecognitionEventRequestDto requestDto)
            throws TechnicalException {
        return ResponseEntity.ok(faceRecognitionService.registerRecognition(requestDto));
    }
}
