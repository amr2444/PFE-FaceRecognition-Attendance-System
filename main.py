# main.py

import os
import pickle
import cv2
import face_recognition
import numpy as np
import cvzone
import psycopg2
from psycopg2 import sql, OperationalError, errors
from datetime import datetime, date, time, timedelta

# --- Fonctions PostgreSQL ---

def connect_to_postgres():
    """
    Établit une connexion à PostgreSQL et la retourne.
    """
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="postgres",   # ou le nom de votre base
            user="postgres",
            password="admin"
        )
        return conn
    except OperationalError as e:
        print(f"❌ Erreur de connexion à PostgreSQL : {e}")
        return None

def get_employee_data(conn, emp_id):
    """
    Récupère les infos de l'employé à partir de son employee_id.
    Retourne un dictionnaire ou {} si aucun enregistrement.
    """
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    employee_id,
                    nom,
                    role,
                    departement,
                    date_embauche,
                    email,
                    genre,
                    adresse,
                    statut
                FROM employee
                WHERE employee_id = %s
            """, (emp_id,))
            row = cur.fetchone()
            if not row:
                return {}
            cols = [desc[0] for desc in cur.description]
            return dict(zip(cols, row))
    except Exception as e:
        print(f"❌ Erreur lors de la récupération de l'employé : {e}")
        return {}

def get_employee_image(conn, emp_id):
    """
    Récupère l'image (BYTEA) stockée dans la table `employeeimages`.
    """
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT image
                  FROM employeeimages
                 WHERE emp_id = %s
            """, (str(emp_id),))
            row = cur.fetchone()
            return row[0] if row else None
    except Exception as e:
        print(f"❌ Erreur lors de la récupération de l'image : {e}")
        return None

def insert_entree_recente(conn, emp_id, portail="Porte Principale"):
    """
    Insère une ligne dans `entree_recente` pour l'employé emp_id.
    On vérifie d'abord que l'employé existe pour éviter la violation de FK.
    """
    # Vérifier que l'employé existe
    info = get_employee_data(conn, emp_id)
    if not info:
        print(f"⚠️ Employee ID {emp_id} introuvable en base. Skip entree_recente.")
        return

    maintenant = datetime.now()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO entree_recente (
                    employee_employee_id,
                    heure,
                    portail,
                    date
                ) VALUES (%s, %s, %s, %s)
            """, (
                emp_id,
                maintenant.time(),
                portail,
                maintenant.date()
            ))
        conn.commit()
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion dans entree_recente : {e}")
        conn.rollback()

def check_presence_jour_exists(conn, emp_id):
    """
    Vérifie si une ligne PresenceJour existe déjà aujourd'hui pour emp_id.
    """
    today = date.today()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT presence_jour_id
                  FROM presence_jour
                 WHERE employee_employee_id = %s
                   AND date_trunc('day', creation_date) = %s::timestamp
            """, (emp_id, today))
            return cur.fetchone() is not None
    except Exception as e:
        print(f"❌ Erreur lors de la vérification de presence_jour : {e}")
        return False

def insert_presence_jour(conn, emp_id):
    """
    Insère une nouvelle ligne dans presence_jour pour emp_id.
    - first_in = heure actuelle
    - break_time = NULL
    - last_out = NULL
    - total_heures = 0 (numeric)
    - statut = 'PRESENT'
    - note = ''
    - shift = ''
    """
    maintenant = datetime.now().time()
    # Vérifier que l'employé existe
    info = get_employee_data(conn, emp_id)
    if not info:
        print(f"⚠️ Employee ID {emp_id} introuvable en base. Skip presence_jour insert.")
        return

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO presence_jour (
                    employee_employee_id,
                    first_in,
                    break_time,
                    last_out,
                    total_heures,
                    statut,
                    note,
                    shift
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                emp_id,
                maintenant,
                None,
                None,
                0,              # total_heures = 0 (numeric)
                "PRESENT",
                "",
                ""
            ))
        conn.commit()
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion dans presence_jour : {e}")
        conn.rollback()

def update_presence_jour(conn, emp_id):
    """
    Met à jour la ligne presence_jour existante pour emp_id aujourd'hui :
      - last_out = heure actuelle
      - total_heures = (last_out - first_in - break_time) en heures (numeric)
    """
    maintenant_time = datetime.now().time()
    today = date.today()
    try:
        with conn.cursor() as cur:
            # 1) Récupérer l’enregistrement existant
            cur.execute("""
                SELECT presence_jour_id, first_in, break_time
                  FROM presence_jour
                 WHERE employee_employee_id = %s
                   AND date_trunc('day', creation_date) = %s::timestamp
            """, (emp_id, today))
            row = cur.fetchone()
            if not row:
                # Si aucune ligne, on en crée une nouvelle
                insert_presence_jour(conn, emp_id)
                return

            presence_id, first_in, break_time = row

            # 2) Calcul de la durée
            dt_first = datetime.combine(today, first_in)
            dt_last = datetime.combine(today, maintenant_time)
            dur = dt_last - dt_first
            if break_time:
                dur -= timedelta(
                    hours=break_time.hour,
                    minutes=break_time.minute,
                    seconds=break_time.second
                )
            # Convertir en heures (float)
            total_hours = dur.total_seconds() / 3600.0

            # 3) Mise à jour
            cur.execute("""
                UPDATE presence_jour
                   SET last_out = %s,
                       total_heures = %s
                 WHERE presence_jour_id = %s
            """, (
                maintenant_time,
                total_hours,       # passe un numeric
                presence_id
            ))
        conn.commit()
    except Exception as e:
        print(f"❌ Erreur lors de la mise à jour de presence_jour : {e}")
        conn.rollback()


# --- Initialisation centrale ---

connection = connect_to_postgres()
if not connection:
    exit(1)

# 1) Ouvrir la caméra et charger l'UI (background + modes)
cap = cv2.VideoCapture(0)
cap.set(3, 640)
cap.set(4, 480)
imgBackground = cv2.imread('Resources/background.png')
modePath = 'Resources/Modes'
imgModeList = [cv2.imread(os.path.join(modePath, f)) for f in os.listdir(modePath)]

# 2) Charger les encodages pré-générés (EncodeFile.p)
with open('EncodeFile.p', 'rb') as f:
    encodeListKnown, employeeIds = pickle.load(f)

modeType = 0     # 0=accueil, 1=loading, 2=transition, 3=profil détaillé, 4=not recognized
counter = 0
current_id = None
employee_info = {}
imgEmployee = None

# --- Boucle principale de reconnaissance ---

while True:
    success, img = cap.read()
    if not success:
        break

    # 1) Préparation pour reconnaissance
    imgS = cv2.resize(img, (0, 0), fx=0.25, fy=0.25)
    imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)
    faceLocs = face_recognition.face_locations(imgS)
    encodes  = face_recognition.face_encodings(imgS, faceLocs)

    # 2) Coller le flux dans le background, puis l’UI du mode courant
    imgBackground[162:162+480, 55:55+640] = img
    imgBackground[44:44+633, 808:808+414] = imgModeList[modeType]

    recognized = False

    if faceLocs:
        # Pour chaque visage détecté, comparer aux encodages connus
        for encodeFace, faceLoc in zip(encodes, faceLocs):
            matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
            faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
            matchIdx = np.argmin(faceDis)

            if matches[matchIdx]:
                recognized = True
                current_id = employeeIds[matchIdx]
                # Récupérer la bbox à taille réelle
                y1, x2, y2, x1 = [v * 4 for v in faceLoc]
                bbox = (55 + x1, 162 + y1, x2 - x1, y2 - y1)
                imgBackground = cvzone.cornerRect(imgBackground, bbox, rt=0)

                if counter == 0:
                    # Mode “Loading”
                    modeType = 1
                    cvzone.putTextRect(imgBackground, "Loading", (275, 400))
                    cv2.imshow("Face Attendance", imgBackground)
                    cv2.waitKey(10)
                    counter = 1

                    # — Insérer l’entrée dans `entree_recente` si l’employé existe
                    insert_entree_recente(connection, current_id)

                    # — Gérer `presence_jour` (insert ou update)
                    if not check_presence_jour_exists(connection, current_id):
                        insert_presence_jour(connection, current_id)
                    else:
                        update_presence_jour(connection, current_id)

                break

        if not recognized:
            # Aucun match → afficher “Not Recognized”
            modeType = 4
            counter = 0
            cvzone.putTextRect(imgBackground, "Not Recognized", (275, 400))
            cv2.imshow("Face Attendance", imgBackground)
            if cv2.waitKey(200) & 0xFF == ord('q'):
                break
            continue

    else:
        # Pas de visage détecté → retour mode accueil
        modeType = 0
        counter = 0

    # 3) Si on affiche le profil (counter != 0 ET recognized == True)
    if counter != 0 and recognized:
        if counter == 1:
            # À la première frame du profil, charger infos + image
            employee_info = get_employee_data(connection, current_id)
            blob = get_employee_image(connection, current_id)
            if blob:
                arr = np.frombuffer(blob, dtype=np.uint8)
                imgEmployee = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        # Entre frames 11 et 19, on change en modeType = 2 (transition)
        if 10 < counter < 20:
            modeType = 2

        imgBackground[44:44+633, 808:808+414] = imgModeList[modeType]

        # Sur les 10 premières frames, afficher les infos
        if counter <= 10 and employee_info:
            # ID
            cv2.putText(
                imgBackground,
                f"  {employee_info['employee_id']}",
                (1006, 493),
                cv2.FONT_HERSHEY_COMPLEX, 0.5,
                (255, 255, 255), 1
            )

            # Nom (centré sur 414 px)
            (w_nom, _), _ = cv2.getTextSize(
                employee_info['nom'],
                cv2.FONT_HERSHEY_COMPLEX, 1, 1
            )
            offset_nom = (414 - w_nom) // 2
            cv2.putText(
                imgBackground,
                employee_info['nom'],
                (808 + offset_nom, 445),
                cv2.FONT_HERSHEY_COMPLEX, 1,
                (0, 0, 0), 1
            )

            # Rôle
            cv2.putText(
                imgBackground,
                f"{employee_info['role']}",
                (861, 125),
                cv2.FONT_HERSHEY_COMPLEX, 0.8,
                (255, 255, 255), 1
            )

            # Département
            cv2.putText(
                imgBackground,
                f" {employee_info['departement']}",
                (1006, 550),
                cv2.FONT_HERSHEY_COMPLEX, 0.6,
                (255, 255, 255), 1
            )



            # Afficher l'image (216×216)
            if imgEmployee is not None:
                img_resized = cv2.resize(imgEmployee, (216, 216))
                imgBackground[175:175+216, 909:909+216] = img_resized

        counter += 1
        if counter >= 20:
            # Retour au mode accueil
            counter = 0
            modeType = 0
            employee_info = {}
            imgEmployee = None

    # 4) Affichage final et sortie sur 'q'
    cv2.imshow("Face Attendance", imgBackground)
    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

# Nettoyage
cap.release()
cv2.destroyAllWindows()
connection.close()
