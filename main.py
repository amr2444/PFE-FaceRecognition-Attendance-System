import os

import cv2
import cvzone
import time

from python_app.backend_client import BackendClient, BackendClientError
from python_app.config import DEFAULT_PORTAL, FACE_API_EMPLOYEE_REFRESH_SECONDS, FACE_RECOGNITION_COOLDOWN_SECONDS, RESOURCES_DIR
from python_app.logging_utils import get_logger
from python_app.reco_runtime import (
    decode_photo_data_url,
    draw_employee_details,
    draw_face_box,
    load_known_encodings,
    load_mode_images,
    locate_best_match,
    open_camera,
)


LOGGER = get_logger("face_reco.main")


def main():
    backend_client = BackendClient()
    try:
        encode_list_known, employee_ids = load_known_encodings()
        capture = open_camera()
    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        LOGGER.error("Erreur de demarrage: %s", exc)
        return 1

    background_path = os.path.join(RESOURCES_DIR, "background.png")
    img_background = cv2.imread(background_path)
    img_mode_list = load_mode_images()

    if img_background is None:
        LOGGER.error("Image de fond introuvable: %s", background_path)
        capture.release()
        return 1

    if not img_mode_list or any(image is None for image in img_mode_list):
        LOGGER.error("Une ou plusieurs images de mode sont introuvables dans %s", RESOURCES_DIR)
        capture.release()
        return 1

    mode_type = 0
    counter = 0
    current_id = None
    employee_info = {}
    employee_image = None
    last_recognition_at = 0.0
    last_employee_refresh_at = 0.0

    while True:
        success, img = capture.read()
        if not success:
            LOGGER.error("Lecture camera impossible.")
            break

        ui_background = img_background.copy()
        ui_background[162:642, 55:695] = img
        current_mode_image = img_mode_list[mode_type]
        if current_mode_image is not None:
            ui_background[44:677, 808:1222] = current_mode_image

        recognized = False
        match = locate_best_match(img, encode_list_known, employee_ids)

        if match is not None:
            recognized = True
            current_id = match.employee_id
            ui_background = draw_face_box(ui_background, match.face_location)

            if counter == 0:
                if time.monotonic() - last_recognition_at < FACE_RECOGNITION_COOLDOWN_SECONDS:
                    cv2.imshow("Face Attendance", ui_background)
                    if cv2.waitKey(10) & 0xFF == ord("q"):
                        break
                    continue

                mode_type = 1
                cvzone.putTextRect(ui_background, "Loading", (275, 400))
                cv2.imshow("Face Attendance", ui_background)
                cv2.waitKey(10)
                counter = 1

                try:
                    backend_client.register_recognition(current_id, DEFAULT_PORTAL)
                    last_recognition_at = time.monotonic()
                except BackendClientError as exc:
                    LOGGER.error("Erreur API reconnaissance pour employee_id=%s: %s", current_id, exc)
                    mode_type = 4
                    counter = 0
                    break
        else:
            if img is not None:
                mode_type = 4
                counter = 0
                cvzone.putTextRect(ui_background, "Not Recognized", (275, 400))
                cv2.imshow("Face Attendance", ui_background)
                if cv2.waitKey(200) & 0xFF == ord("q"):
                    break
                continue

        if counter != 0 and recognized:
            if counter == 1:
                try:
                    if current_id is None:
                        employee_info = {}
                        employee_image = None
                    else:
                        if time.monotonic() - last_employee_refresh_at >= FACE_API_EMPLOYEE_REFRESH_SECONDS or not employee_info:
                            employee_info = backend_client.get_employee(current_id)
                            employee_image = decode_photo_data_url(employee_info.get("photo")) if employee_info else None
                            last_employee_refresh_at = time.monotonic()
                except BackendClientError as exc:
                    LOGGER.error("Erreur API employe pour employee_id=%s: %s", current_id, exc)
                    employee_info = {}
                    employee_image = None

            if 10 < counter < 20:
                mode_type = 2

            current_mode_image = img_mode_list[mode_type]
            if current_mode_image is not None:
                ui_background[44:677, 808:1222] = current_mode_image

            if counter <= 10 and employee_info:
                draw_employee_details(ui_background, employee_info, employee_image)

            counter += 1
            if counter >= 20:
                counter = 0
                mode_type = 0
                employee_info = {}
                employee_image = None

        cv2.imshow("Face Attendance", ui_background)
        if cv2.waitKey(10) & 0xFF == ord("q"):
            break

    capture.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
