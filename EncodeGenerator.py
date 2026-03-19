import base64
import os
import pickle

import cv2
import face_recognition

from python_app.backend_client import BackendClient, BackendClientError
from python_app.config import ENCODE_FILE_PATH, IMAGES_DIR


def image_to_data_url(image):
    success, buffer = cv2.imencode(".jpg", image)
    if not success:
        raise ValueError("Impossible d'encoder l'image en JPEG.")
    encoded = base64.b64encode(buffer.tobytes()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


def build_encoding(image):
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb_image)
    if not encodings:
        return None
    return encodings[0]


def main():
    if not os.path.isdir(IMAGES_DIR):
        print(f"Dossier Images introuvable: {IMAGES_DIR}")
        return 1

    backend_client = BackendClient()
    file_names = sorted(os.listdir(IMAGES_DIR))
    print("Fichiers trouves dans Images/ :", file_names)

    encode_list_known = []
    employee_ids = []

    for file_name in file_names:
        file_path = os.path.join(IMAGES_DIR, file_name)
        if not os.path.isfile(file_path):
            continue

        employee_id_text, _ = os.path.splitext(file_name)
        if not employee_id_text.isdigit():
            print(f"Nom de fichier ignore (ID invalide) : {file_name}")
            continue

        employee_id = int(employee_id_text)
        image = cv2.imread(file_path)
        if image is None:
            print(f"Impossible de charger {file_name}.")
            continue

        face_encoding = build_encoding(image)
        if face_encoding is None:
            print(f"Aucun visage detecte dans {file_name}.")
            continue

        try:
            backend_client.get_employee(employee_id)
            backend_client.upload_employee_photo(employee_id, image_to_data_url(cv2.resize(image, (216, 216))))
        except (BackendClientError, ValueError) as exc:
            print(f"Synchronisation backend impossible pour {file_name}: {exc}")
            continue

        encode_list_known.append(face_encoding)
        employee_ids.append(employee_id)
        print(f"Image synchronisee et encodage genere pour l'employe {employee_id}.")

    with open(ENCODE_FILE_PATH, "wb") as file_obj:
        pickle.dump([encode_list_known, employee_ids], file_obj)

    print(f"EncodeFile cree avec {len(employee_ids)} employe(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
