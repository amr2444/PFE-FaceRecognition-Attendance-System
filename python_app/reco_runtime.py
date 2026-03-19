import base64
import binascii
import os
import pickle
from dataclasses import dataclass

import cv2
import cvzone
import face_recognition
import numpy as np

from python_app.config import CAMERA_INDEX, ENCODE_FILE_PATH, FACE_FRAME_SCALE, RESOURCES_DIR


@dataclass
class RecognitionMatch:
    employee_id: int
    face_location: tuple[int, int, int, int]


def load_mode_images():
    mode_path = os.path.join(RESOURCES_DIR, "Modes")
    return [cv2.imread(os.path.join(mode_path, file_name)) for file_name in os.listdir(mode_path)]


def load_known_encodings():
    if not os.path.exists(ENCODE_FILE_PATH):
        raise FileNotFoundError(
            "EncodeFile.p introuvable. Lance d'abord EncodeGenerator.py pour generer les encodages."
        )

    with open(ENCODE_FILE_PATH, "rb") as file_obj:
        encode_list_known, employee_ids = pickle.load(file_obj)

    if not encode_list_known or not employee_ids:
        raise ValueError("EncodeFile.p est vide ou invalide.")

    return encode_list_known, employee_ids


def open_camera():
    capture = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)
    if not capture.isOpened():
        capture = cv2.VideoCapture(CAMERA_INDEX)

    capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not capture.isOpened():
        raise RuntimeError("Impossible d'ouvrir la camera configuree.")

    return capture


def decode_photo_data_url(photo_data_url):
    if not photo_data_url or "," not in photo_data_url:
        return None

    try:
        encoded_data = photo_data_url.split(",", 1)[1]
        image_bytes = base64.b64decode(encoded_data)
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        return cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    except (ValueError, TypeError, binascii.Error):
        return None


def draw_employee_details(img_background, employee_info, employee_image):
    cv2.putText(img_background, f"  {employee_info['employeeId']}", (1006, 493), cv2.FONT_HERSHEY_COMPLEX, 0.5, (255, 255, 255), 1)

    employee_name = employee_info.get("nom", "Inconnu")
    (name_width, _), _ = cv2.getTextSize(employee_name, cv2.FONT_HERSHEY_COMPLEX, 1, 1)
    offset_nom = (414 - name_width) // 2
    cv2.putText(img_background, employee_name, (808 + offset_nom, 445), cv2.FONT_HERSHEY_COMPLEX, 1, (0, 0, 0), 1)
    cv2.putText(img_background, employee_info.get("role", "-"), (861, 125), cv2.FONT_HERSHEY_COMPLEX, 0.8, (255, 255, 255), 1)
    cv2.putText(img_background, employee_info.get("departement", "-"), (1006, 550), cv2.FONT_HERSHEY_COMPLEX, 0.6, (255, 255, 255), 1)

    if employee_image is not None:
        resized_image = cv2.resize(employee_image, (216, 216))
        img_background[175:391, 909:1125] = resized_image


def locate_best_match(frame, encode_list_known, employee_ids):
    scale = FACE_FRAME_SCALE
    img_small = cv2.resize(frame, (0, 0), fx=scale, fy=scale)
    img_small = cv2.cvtColor(img_small, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(img_small)
    encodings = face_recognition.face_encodings(img_small, face_locations)

    for encode_face, face_location in zip(encodings, face_locations):
        matches = face_recognition.compare_faces(encode_list_known, encode_face)
        face_distances = face_recognition.face_distance(encode_list_known, encode_face)
        match_index = int(np.argmin(face_distances))
        if matches[match_index]:
            multiplier = int(round(1 / scale))
            scaled_location = tuple(value * multiplier for value in face_location)
            return RecognitionMatch(employee_id=employee_ids[match_index], face_location=scaled_location)

    return None


def draw_face_box(background, face_location):
    y1, x2, y2, x1 = face_location
    bbox = (55 + x1, 162 + y1, x2 - x1, y2 - y1)
    return cvzone.cornerRect(background, bbox, rt=0)
