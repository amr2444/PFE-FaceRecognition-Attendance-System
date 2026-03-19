package ma.dream.case_backend.controller;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import ma.dream.case_backend.dto.AuthChangePasswordRequestDto;
import ma.dream.case_backend.dto.AuthLoginRequestDto;
import ma.dream.case_backend.dto.AuthResponseDto;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@AllArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody AuthLoginRequestDto requestDto) throws TechnicalException {
        return ResponseEntity.ok(authService.login(requestDto));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody AuthChangePasswordRequestDto requestDto) throws TechnicalException {
        authService.changePassword(requestDto);
        return ResponseEntity.noContent().build();
    }
}
