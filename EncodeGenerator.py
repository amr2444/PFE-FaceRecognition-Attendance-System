# encode_generator.py

import cv2
import face_recognition
import pickle
import os
import psycopg2
from psycopg2 import OperationalError, sql

# --- Fonction pour se connecter à PostgreSQL ---
def connect_to_postgres():
    try:
        connection = psycopg2.connect(
            host="localhost",
            database="postgres",    # ou votre nom de base
            user="postgres",
            password="admin"
        )
        return connection
    except OperationalError as e:
        print(f"Erreur de connexion à PostgreSQL : {e}")
        return None

# --- Création (si besoin) de la table EmployeeImages ---
def create_employee_images_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS EmployeeImages (
                emp_id VARCHAR(50) PRIMARY KEY,
                image BYTEA
            )
        """)
        conn.commit()

# --- Parcours du dossier Images/ ---
folderPath = 'Images'
pathList = os.listdir(folderPath)
print("Fichiers trouvés dans Images/ :", pathList)

imgList = []
employeeIds = []

for filename in pathList:
    # 1. Charger l’image pour encodage
    img = cv2.imread(os.path.join(folderPath, filename))
    if img is None:
        print(f"Impossible de charger {filename}. Je passe au suivant.")
        continue
    imgList.append(img)

    # 2. Extraire l’ID d’employé depuis le nom de fichier (exemple : "E123.jpg" -> "E123")
    emp_id = os.path.splitext(filename)[0]
    employeeIds.append(emp_id)

    # 3. Redimensionner l’image à 216x216 pixels avant d’insérer en base
    resized_img = cv2.resize(img, (216, 216))

    # 4. Convertir l’image redimensionnée en bytes (JPEG)
    success, buffer = cv2.imencode('.jpg', resized_img)
    if not success:
        print(f"❌ Échec de l'encodage de '{filename}' en JPEG, je passe.")
        continue
    img_bytes = buffer.tobytes()

    # 5. Insérer ou mettre à jour dans PostgreSQL
    conn = connect_to_postgres()
    if conn:
        try:
            # Crée la table si elle n’existe pas (une seule fois, mais on peut le faire à chaque insertion)
            create_employee_images_table(conn)

            with conn.cursor() as cur:
                # ON CONFLICT pour gérer la mise à jour des images existantes
                query = sql.SQL("""
                    INSERT INTO EmployeeImages (emp_id, image)
                    VALUES (%s, %s)
                    ON CONFLICT (emp_id) DO UPDATE
                      SET image = EXCLUDED.image
                """)
                cur.execute(query, (emp_id, psycopg2.Binary(img_bytes)))
            conn.commit()
            print(f"✅ Image redimensionnée et insérée/mise à jour pour '{filename}'.")
        except Exception as e:
            print(f"❌ Erreur lors de l’insertion de '{filename}' : {e}")
        finally:
            conn.close()

print("IDs employés extraits :", employeeIds)

# --- Fonction pour obtenir les encodages faciaux ---
def findEncodings(imagesList):
    encodeList = []
    for img in imagesList:
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        enc = face_recognition.face_encodings(rgb_img)
        if enc:
            encodeList.append(enc[0])
        else:
            print("⚠️ Aucune face détectée sur une image, je passe.")
    return encodeList

print("Encodage des visages démarré...")
encodeListKnown = findEncodings(imgList)
encodeListKnownWithIds = [encodeListKnown, employeeIds]
print("Encodage terminé.")

# --- Sauvegarde dans le fichier pickle ---
with open("EncodeFile.p", 'wb') as f:
    pickle.dump(encodeListKnownWithIds, f)
print("✅ EncodeFile.p généré.")
