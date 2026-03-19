import os


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API_BASE_URL = os.getenv("FACE_API_BASE_URL", "http://localhost:8080")
API_EMAIL = os.getenv("FACE_API_EMAIL", "")
API_PASSWORD = os.getenv("FACE_API_PASSWORD", "")
API_TIMEOUT_SECONDS = int(os.getenv("FACE_API_TIMEOUT_SECONDS", "15"))
DEFAULT_PORTAL = os.getenv("FACE_DEFAULT_PORTAL", "Porte Principale")
CAMERA_INDEX = int(os.getenv("FACE_CAMERA_INDEX", "0"))
ENCODE_FILE_PATH = os.path.join(PROJECT_ROOT, "EncodeFile.p")
IMAGES_DIR = os.path.join(PROJECT_ROOT, "Images")
RESOURCES_DIR = os.path.join(PROJECT_ROOT, "Resources")
