import json
import urllib.error
import urllib.request

from python_app.config import API_BASE_URL, API_EMAIL, API_PASSWORD, API_TIMEOUT_SECONDS


class BackendClientError(Exception):
    pass


class BackendClient:
    def __init__(self, base_url=None, timeout=None, auth_email=None, auth_password=None):
        self.base_url = (base_url or API_BASE_URL).rstrip("/")
        self.timeout = timeout or API_TIMEOUT_SECONDS
        self.auth_email = auth_email or API_EMAIL
        self.auth_password = auth_password or API_PASSWORD
        self._access_token = None

    def get_active_face_employees(self):
        return self._request("/face-recognition/employees")

    def get_employee(self, employee_id):
        return self._request(f"/employes/{employee_id}")

    def upload_employee_photo(self, employee_id, photo_data_url):
        return self._request(
            f"/face-recognition/employees/{employee_id}/photo",
            method="POST",
            payload={"photo": photo_data_url},
            expect_json=False,
        )

    def register_recognition(self, employee_id, portail, event_type="AUTO"):
        return self._request(
            "/face-recognition/events",
            method="POST",
            payload={"employeeId": employee_id, "portail": portail, "eventType": event_type},
        )

    def _authenticate(self, force=False):
        if self._access_token and not force:
            return self._access_token

        if not self.auth_email or not self.auth_password:
            raise BackendClientError(
                "Authentification backend manquante. Renseigne FACE_API_EMAIL et FACE_API_PASSWORD."
            )

        payload = self._request(
            "/auth/login",
            method="POST",
            payload={"email": self.auth_email, "password": self.auth_password},
            include_auth=False,
            retry_on_unauthorized=False,
        )
        token = payload.get("accessToken") if isinstance(payload, dict) else None
        if not token:
            raise BackendClientError("Le backend n'a pas retourne de jeton JWT.")

        self._access_token = token
        return token

    def _request(self, path, method="GET", payload=None, expect_json=True, include_auth=True, retry_on_unauthorized=True):
        url = f"{self.base_url}{path}"
        data = None
        headers = {}

        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"

        if include_auth:
            token = self._authenticate()
            headers["Authorization"] = f"Bearer {token}"

        request = urllib.request.Request(url, data=data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                response_body = response.read()
                if not expect_json:
                    return response.status
                if not response_body:
                    return None
                return json.loads(response_body.decode("utf-8"))
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            if exc.code == 401 and include_auth and retry_on_unauthorized:
                self._access_token = None
                self._authenticate(force=True)
                return self._request(
                    path,
                    method=method,
                    payload=payload,
                    expect_json=expect_json,
                    include_auth=include_auth,
                    retry_on_unauthorized=False,
                )

            message = self._extract_error_message(body) or exc.reason
            raise BackendClientError(f"HTTP {exc.code} sur {path}: {message}") from exc
        except urllib.error.URLError as exc:
            raise BackendClientError(f"Backend inaccessible sur {url}: {exc.reason}") from exc
        except json.JSONDecodeError as exc:
            raise BackendClientError(f"Reponse JSON invalide sur {path}") from exc

    @staticmethod
    def _extract_error_message(body):
        if not body:
            return None

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return body

        if isinstance(payload, dict):
            return payload.get("message") or payload.get("error")
        return body
