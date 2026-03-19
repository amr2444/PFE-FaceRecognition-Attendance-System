package ma.dream.case_backend.service;

import lombok.AllArgsConstructor;
import ma.dream.case_backend.dto.AuthChangePasswordRequestDto;
import ma.dream.case_backend.dto.AuthLoginRequestDto;
import ma.dream.case_backend.dto.AuthResponseDto;
import ma.dream.case_backend.enums.ApiErrorCode;
import ma.dream.case_backend.enums.UserRole;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.model.UserApp;
import ma.dream.case_backend.repository.UserAppRepository;
import ma.dream.case_backend.security.AppSecurityProperties;
import ma.dream.case_backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@AllArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserAppRepository userAppRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppSecurityProperties securityProperties;

    public AuthResponseDto login(AuthLoginRequestDto requestDto) throws TechnicalException {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(requestDto.getEmail().trim().toLowerCase(), requestDto.getPassword())
        );

        String email = authentication.getName();
        UserApp user = userAppRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new TechnicalException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        String accessToken = jwtService.generateToken(user);
        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(securityProperties.getJwt().getExpirationMs() / 1000)
                .userId(user.getUserAppId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public void changePassword(AuthChangePasswordRequestDto requestDto) throws TechnicalException {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        UserApp user = userAppRepository.findByEmailIgnoreCase(currentEmail)
                .orElseThrow(() -> new TechnicalException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Authenticated user not found"));

        if (!passwordEncoder.matches(requestDto.getCurrentPassword(), user.getPasswordHash())) {
            throw new TechnicalException(HttpStatus.BAD_REQUEST, ApiErrorCode.BUSINESS_RULE_VIOLATION, "Current password is invalid");
        }

        user.setPasswordHash(passwordEncoder.encode(requestDto.getNewPassword()));
        user.setLastUpdateDate(LocalDateTime.now());
        userAppRepository.save(user);
    }

    public String initializeBootstrapAdminIfNeeded() {
        if (!securityProperties.getBootstrapAdmin().isEnabled()) {
            return null;
        }

        String email = securityProperties.getBootstrapAdmin().getEmail().trim().toLowerCase();
        if (userAppRepository.existsByEmailIgnoreCase(email)) {
            return null;
        }

        String password = securityProperties.getBootstrapAdmin().getPassword();
        String resolvedPassword = resolveBootstrapPassword(password);

        UserApp adminUser = UserApp.builder()
                .name(securityProperties.getBootstrapAdmin().getName())
                .email(email)
                .passwordHash(passwordEncoder.encode(resolvedPassword))
                .role(UserRole.ADMIN)
                .active(true)
                .build();

        userAppRepository.save(adminUser);
        return resolvedPassword;
    }

    public String initializeBootstrapRecognitionClientIfNeeded() {
        if (!securityProperties.getBootstrapRecognitionClient().isEnabled()) {
            return null;
        }

        String email = securityProperties.getBootstrapRecognitionClient().getEmail().trim().toLowerCase();
        if (userAppRepository.existsByEmailIgnoreCase(email)) {
            return null;
        }

        String password = securityProperties.getBootstrapRecognitionClient().getPassword();
        String resolvedPassword = resolveBootstrapPassword(password);

        UserApp clientUser = UserApp.builder()
                .name(securityProperties.getBootstrapRecognitionClient().getName())
                .email(email)
                .passwordHash(passwordEncoder.encode(resolvedPassword))
                .role(UserRole.RECOGNITION_CLIENT)
                .active(true)
                .build();

        userAppRepository.save(clientUser);
        return resolvedPassword;
    }

    private String resolveBootstrapPassword(String configuredPassword) {
        if (configuredPassword != null && !configuredPassword.isBlank()) {
            return configuredPassword;
        }

        byte[] randomBytes = new byte[18];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
