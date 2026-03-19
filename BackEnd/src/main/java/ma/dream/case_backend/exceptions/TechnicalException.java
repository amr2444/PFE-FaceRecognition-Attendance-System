package ma.dream.case_backend.exceptions;

import ma.dream.case_backend.enums.ApiErrorCode;
import org.springframework.http.HttpStatus;

public class TechnicalException extends GlobalException {

    public TechnicalException(String message) {
        super(message);
    }

    public TechnicalException(HttpStatus status, ApiErrorCode code, String message) {
        super(status, code, message);
    }

}
