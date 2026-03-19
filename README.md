# FaceRecognition Attendance System

Application de gestion des employes, des presences et de la reconnaissance faciale.

Le projet est organise en trois briques:
- un backend Spring Boot pour l'API metier
- un frontend HTML/CSS/JavaScript pour le dashboard d'administration
- une application Python/OpenCV/face_recognition pour la capture webcam et l'integration temps reel

## Apercu

Fonctionnalites principales:
- gestion CRUD des employes
- gestion des presences du jour avec pagination, filtres et export CSV/Excel
- dashboard de supervision avec statistiques branchees sur l'API
- reconnaissance faciale connectee au backend pour enregistrer les evenements de pointage
- seed H2 local pour demarrer rapidement une demo

## Architecture

```text
Camera + Python app
    |
    | GET /face-recognition/employees
    | POST /face-recognition/employees/{id}/photo
    | POST /face-recognition/events
    v
Spring Boot API
    |
    +--> Employee / PresenceJour / EntreeRecente
    +--> H2 local pour la demo
    +--> endpoints REST consommes aussi par le dashboard
    v
Frontend admin
```

Architecture detaillee: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Structure du repo

```text
.
|-- BackEnd/       API Spring Boot
|-- FrontEnd/      dashboard admin HTML/CSS/JS
|-- python_app/    client backend et config Python
|-- main.py        application webcam / reconnaissance
|-- EncodeGenerator.py
|-- requirements.txt
|-- .env.example
```

## Lancement rapide

### 1. Backend

Prerequis:
- Java 17+
- Maven Wrapper fourni

Commandes:

```powershell
cd BackEnd
./mvnw.cmd spring-boot:run
```

API attendue sur `http://localhost:8080`.

Profils disponibles:
- `dev` par defaut: H2 fichier local, Swagger actif, console H2 active si exposee par la config de securite
- `test`: H2 memoire, Flyway, aucun seed, utilise par `./mvnw.cmd test`
- `prod`: PostgreSQL + `ddl-auto=validate`, sans seed local ni surfaces de debug exposees

Exemples:

```powershell
cd BackEnd
./mvnw.cmd spring-boot:run
./mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
```

Variables backend importantes:
- `SPRING_PROFILES_DEFAULT=dev|prod|test`
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` pour `prod`
- `APP_JWT_SECRET` obligatoire hors `dev` et `test`
- `APP_BOOTSTRAP_ADMIN_ENABLED=true|false`
- `APP_LOCAL_H2_SEED_ENABLED=true|false`

Base de donnees et migrations:
- Flyway est la source de verite du schema dans `BackEnd/src/main/resources/db/migration`
- Hibernate est regle en `validate` pour verifier le schema sans le modifier
- les evolutions de schema doivent etre ajoutees dans de nouvelles migrations `V2`, `V3`, etc.

### 2. Frontend

Servir le dossier `FrontEnd` avec un serveur statique local, par exemple:

```powershell
cd FrontEnd
python -m http.server 5500
```

Puis ouvrir:
- `http://localhost:5500/login.html`
- `http://localhost:5500/index.html`

### 3. Python face recognition

Prerequis recommandes:
- Python 3.10
- environnement virtuel dans le projet

Installation:

```powershell
py -3.10 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Important:
- `requirements.txt` epingle `setuptools<81` pour rester compatible avec `face_recognition_models`
- sur Windows, `dlib` peut necessiter les Build Tools C++

Synchronisation des photos et generation des encodages:

```powershell
python EncodeGenerator.py
```

Lancement de la reconnaissance:

```powershell
python main.py
```

## Authentification

Le backend expose maintenant une authentification JWT:
- `POST /auth/login` retourne un token Bearer
- les endpoints sensibles sont proteges par roles cote Spring Security
- le client Python utilise aussi ce flux via `FACE_API_EMAIL` et `FACE_API_PASSWORD`

Etat actuel du frontend admin:
- il consomme l'auth backend JWT
- le token est stocke en `localStorage` ou `sessionStorage` selon l'option de session
- cela reste acceptable pour une demo avancee, mais un niveau production plus strict prefererait un cookie `HttpOnly`

## Endpoints majeurs

La documentation synthetique est ici: [docs/API.md](docs/API.md)

Endpoints principaux:
- `GET /employes/`
- `GET /employes/count`
- `GET /employes/count-by-statut/all`
- `GET /presences/`
- `GET /presences/statuts/today`
- `GET /presences/export`
- `GET /face-recognition/employees`
- `POST /face-recognition/employees/{employeeId}/photo`
- `POST /face-recognition/events`

## Captures

Captures attendues pour une presentation GitHub solide:
- ecran de connexion
- dashboard
- gestion des employes
- gestion des presences
- flux de reconnaissance faciale

Emplacement recommande: [docs/screenshots/README.md](docs/screenshots/README.md)

## Tests

Backend:

```powershell
cd BackEnd
./mvnw.cmd test
```

Avec profil explicite:

```powershell
cd BackEnd
./mvnw.cmd test -Dspring.profiles.active=test
```

Python:

```powershell
python -m py_compile "main.py" "EncodeGenerator.py" "python_app\\config.py" "python_app\\backend_client.py"
```

## Axes d'amelioration restants

- remplacer le stockage du token front par un mecanisme plus robuste cote navigateur
- ajouter plus de tests d'integration REST
- durcir la validation des photos employees cote backend
- rendre la reconnaissance plus conservative avant d'ecrire un pointage
