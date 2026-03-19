import os


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return int(value)


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API_BASE_URL = os.getenv("FACE_API_BASE_URL", "http://localhost:8080")
API_EMAIL = os.getenv("FACE_API_EMAIL", "")
API_PASSWORD = os.getenv("FACE_API_PASSWORD", "")
API_TIMEOUT_SECONDS = _get_int("FACE_API_TIMEOUT_SECONDS", 15)
API_RETRY_COUNT = _get_int("FACE_API_RETRY_COUNT", 2)
API_RETRY_BACKOFF_SECONDS = float(os.getenv("FACE_API_RETRY_BACKOFF_SECONDS", "1.5"))
DEFAULT_PORTAL = os.getenv("FACE_DEFAULT_PORTAL", "Porte Principale")
CAMERA_INDEX = _get_int("FACE_CAMERA_INDEX", 0)
FACE_FRAME_SCALE = float(os.getenv("FACE_FRAME_SCALE", "0.25"))
FACE_RECOGNITION_COOLDOWN_SECONDS = float(os.getenv("FACE_RECOGNITION_COOLDOWN_SECONDS", "2.0"))
FACE_API_EMPLOYEE_REFRESH_SECONDS = float(os.getenv("FACE_API_EMPLOYEE_REFRESH_SECONDS", "15.0"))
ENCODE_FILE_PATH = os.path.join(PROJECT_ROOT, "EncodeFile.p")
IMAGES_DIR = os.path.join(PROJECT_ROOT, "Images")
RESOURCES_DIR = os.path.join(PROJECT_ROOT, "Resources")
