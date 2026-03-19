package ma.dream.case_backend.exceptions;

import lombok.EqualsAndHashCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.dream.case_backend.enums.ApiErrorCode;
import org.springframework.http.HttpStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class GlobalException  extends Exception {
    private HttpStatus status;
    private ApiErrorCode code;

    public GlobalException(String message) {
        super(message);
    }

    public GlobalException(HttpStatus status, ApiErrorCode code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

}
