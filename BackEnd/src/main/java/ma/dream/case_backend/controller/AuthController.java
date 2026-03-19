package ma.dream.case_backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import ma.dream.case_backend.config.SwaggerConfig;
import ma.dream.case_backend.dto.ApiErrorResponseDto;
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
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Authenticate a user", description = "Authenticates a user and returns a JWT access token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication succeeded"),
            @ApiResponse(responseCode = "400", description = "Invalid login payload", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "Bad credentials", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody AuthLoginRequestDto requestDto) throws TechnicalException {
        return ResponseEntity.ok(authService.login(requestDto));
    }

    @Operation(summary = "Change current user password", description = "Changes the password of the authenticated user")
    @SecurityRequirement(name = SwaggerConfig.BEARER_SECURITY_SCHEME)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Password changed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or business rule violation", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "Authentication required", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Authenticated user not found", content = @Content(schema = @Schema(implementation = ApiErrorResponseDto.class)))
    })
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody AuthChangePasswordRequestDto requestDto) throws TechnicalException {
        authService.changePassword(requestDto);
        return ResponseEntity.noContent().build();
    }
}
