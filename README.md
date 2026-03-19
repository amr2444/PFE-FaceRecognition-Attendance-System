<h1 align="center">CASE Attendance</h1>

<p align="center">
  <strong>An attendance supervision platform built for real-time HR operations and face recognition workflows.</strong>
</p>

<p align="center">
  Tableau de bord RH, API securisee, moteur de reconnaissance faciale et logique metier centralisee dans une seule plateforme.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-Spring%20Boot-1f2937?style=for-the-badge&logo=springboot&logoColor=6ee7b7" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Security-JWT-2563eb?style=for-the-badge" alt="JWT">
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%7C%20H2-334155?style=for-the-badge&logo=postgresql&logoColor=93c5fd" alt="Database">
  <img src="https://img.shields.io/badge/Migrations-Flyway-b45309?style=for-the-badge" alt="Flyway">
  <img src="https://img.shields.io/badge/Frontend-Vanilla%20JS-0f172a?style=for-the-badge&logo=javascript&logoColor=facc15" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/Python-OpenCV%20%2B%20face__recognition-111827?style=for-the-badge&logo=python&logoColor=fbbf24" alt="Python recognition">
</p>

> CASE Attendance n'est pas un simple dashboard scolaire.
> C'est une plateforme complete de gestion de presence reliee a un moteur de reconnaissance faciale, concue pour superviser les pointages, les pauses, les reprises et les sorties depuis une interface d'administration moderne, avec un backend source de verite et un client Python temps reel.

## Vue rapide

Le projet assemble trois briques qui travaillent ensemble:
- un backend `Spring Boot` pour les regles metier, la securite JWT, les migrations Flyway et l'API REST
- un frontend `HTML/CSS/JavaScript` pour le pilotage RH et operationnel
- un client `Python + OpenCV + face_recognition` pour la capture webcam, la synchronisation des photos et l'enregistrement des evenements de pointage

Pourquoi le projet est interessant:
- il traite un vrai cas d'usage metier: pointage, pauses, reprise, sortie, absences, supervision
- il montre une integration multi-stack complete: Java, web frontend et Python vision
- il a ete durci progressivement vers un niveau plus production-grade:
  - authentification JWT et roles
  - profils `dev/test/prod`
  - migrations Flyway
  - erreurs API normalisees
  - CI GitHub
  - documentation technique et deploiement

## Capacites principales

- gestion CRUD des employes avec photo et statuts
- gestion des presences avec pagination, filtres, export CSV/Excel et vue par employe
- dashboard admin branche sur des donnees backend
- reconnaissance faciale connectee a l'API pour enregistrer les evenements de presence
- cycle de presence plus realiste: `CHECK_IN`, `BREAK_START`, `BREAK_END`, `CHECK_OUT`
- anti double scan cote backend et cooldown cote client Python
- seed local optionnel pour accelerer les demos en developpement

## Apercu systeme

```text
                     +------------------------------+
                     |  FrontEnd admin dashboard    |
                     |  HTML / CSS / JavaScript     |
                     +---------------+--------------+
                                     |
                                     | REST API + JWT
                                     v
 +--------------------+   +------------------------------+   +----------------------+
 | Python reco client |-->| Spring Boot API              |-->| PostgreSQL / H2      |
 | OpenCV / webcam    |   | security, business logic,    |   | Flyway schema        |
 | face_recognition   |   | face-recognition workflow    |   | employees, presence  |
 +--------------------+   +------------------------------+   +----------------------+
           |
           +--> local encodings (`EncodeFile.p`) + camera feed
```

Documentation detaillee:
- architecture: `docs/ARCHITECTURE.md`
- API: `docs/API.md`
- deployment: `docs/DEPLOYMENT.md`

## Stack technique

### Backend
- Java 17
- Spring Boot
- Spring Security JWT
- Spring Data JPA
- H2 en local / PostgreSQL en prod
- Flyway pour les migrations
- Swagger / OpenAPI
- JUnit + MockMvc + Mockito

### Frontend
- HTML / CSS / JavaScript natif
- Chart.js
- dashboard admin statique sans bundler

### Python recognition
- Python 3.10 recommande
- OpenCV
- face_recognition / dlib
- client HTTP backend maison avec retry, timeout et logs

## Structure du repository

```text
.
|-- BackEnd/                  API Spring Boot
|   |-- src/main/java/
|   |-- src/main/resources/
|   |-- src/test/java/
|   `-- pom.xml
|-- FrontEnd/                 dashboard admin statique
|-- python_app/               config, client backend, runtime reco, logging
|-- docs/                     architecture, API, deployment
|-- main.py                   application de reconnaissance faciale temps reel
|-- EncodeGenerator.py        generation des encodages + sync photos backend
|-- requirements.txt
`-- .env.example
```

## Cas d'usage metier

### Dashboard admin
- visualiser les employes actifs, absents et en conge
- suivre les presences du jour
- surveiller les dernieres entrees reconnues
- gerer les comptes et les parametres de plateforme

### Gestion de presence
- creer et corriger une presence manuellement
- filtrer par employe, statut, shift
- exporter les donnees pour usage RH ou administratif
- consulter la trajectoire hebdomadaire d'un employe

### Reconnaissance faciale
- charger les photos employees depuis `Images/`
- synchroniser les photos vers le backend
- generer `EncodeFile.p`
- reconnaitre un visage depuis la webcam
- pousser l'evenement vers l'API
- mettre a jour automatiquement la presence du jour

## Lancement rapide

### 1. Backend

Prerequis:
- Java 17+
- Maven Wrapper fourni

```powershell
cd BackEnd
./mvnw.cmd spring-boot:run
```

API disponible ensuite sur `http://localhost:8080`.

Profils disponibles:
- `dev`: H2 fichier local, outils de debug autorises par configuration, seed local optionnel
- `test`: H2 memoire, Flyway, aucun seed, utilise pour les tests
- `prod`: PostgreSQL, `ddl-auto=validate`, secret JWT obligatoire, seed desactive

Exemples:

```powershell
cd BackEnd
./mvnw.cmd spring-boot:run
./mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
```

### 2. Frontend

Servir le dossier `FrontEnd` avec un serveur statique local:

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
- environnement virtuel local

```powershell
py -3.10 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python EncodeGenerator.py
python main.py
```

Notes:
- `requirements.txt` epingle `setuptools<81` pour rester compatible avec `face_recognition_models`
- sur Windows, `dlib` peut necessiter les Build Tools C++

## Variables d'environnement

### Backend

Variables principales:
- `SPRING_PROFILES_DEFAULT=dev|test|prod`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `APP_JWT_SECRET`
- `APP_BOOTSTRAP_ADMIN_ENABLED=true|false`
- `APP_BOOTSTRAP_RECOGNITION_CLIENT_ENABLED=true|false`
- `APP_LOCAL_H2_SEED_ENABLED=true|false`

Exemple production:

```powershell
$env:SPRING_PROFILES_DEFAULT="prod"
$env:DB_URL="jdbc:postgresql://db-host:5432/facerecognition"
$env:DB_USERNAME="facerecognition"
$env:DB_PASSWORD="change-me"
$env:APP_JWT_SECRET="replace-with-a-long-random-secret"
$env:APP_BOOTSTRAP_ADMIN_ENABLED="false"
$env:APP_BOOTSTRAP_RECOGNITION_CLIENT_ENABLED="false"
$env:APP_LOCAL_H2_SEED_ENABLED="false"
```

### Python recognition client

Variables supportees via `.env` ou environnement machine:
- `FACE_API_BASE_URL`
- `FACE_API_EMAIL`
- `FACE_API_PASSWORD`
- `FACE_API_TIMEOUT_SECONDS`
- `FACE_API_RETRY_COUNT`
- `FACE_API_RETRY_BACKOFF_SECONDS`
- `FACE_DEFAULT_PORTAL`
- `FACE_CAMERA_INDEX`
- `FACE_FRAME_SCALE`
- `FACE_RECOGNITION_COOLDOWN_SECONDS`
- `FACE_API_EMPLOYEE_REFRESH_SECONDS`
- `FACE_LOG_LEVEL`

Exemple:

```env
FACE_API_BASE_URL=http://localhost:8080
FACE_API_EMAIL=reco-client@example.com
FACE_API_PASSWORD=change-me
FACE_API_TIMEOUT_SECONDS=15
FACE_API_RETRY_COUNT=2
FACE_API_RETRY_BACKOFF_SECONDS=1.5
FACE_DEFAULT_PORTAL=Porte Principale
FACE_CAMERA_INDEX=0
FACE_FRAME_SCALE=0.25
FACE_RECOGNITION_COOLDOWN_SECONDS=2
FACE_API_EMPLOYEE_REFRESH_SECONDS=15
FACE_LOG_LEVEL=INFO
```

## Securite

Le backend expose une authentification JWT avec roles.

Roles utilises:
- `ADMIN`
- `VIEWER`
- `RECOGNITION_CLIENT`

Ce qui est en place:
- endpoints sensibles proteges
- reponses d'erreur API homogenes
- Swagger / H2 limites selon le profil
- secret JWT obligatoire hors `dev` / `test`

Point encore perfectible:
- le frontend admin stocke encore le token dans le navigateur; une prod plus stricte prefererait un cookie `HttpOnly`

## Migrations et base de donnees

- Flyway est la source de verite du schema
- Hibernate est regle en `validate`
- toute evolution de schema doit passer par une nouvelle migration `Vx__...sql`

Migrations actuelles:
- `V1__init_schema.sql`
- `V2__add_operational_indexes.sql`

## Qualite et tests

### Backend

```powershell
cd BackEnd
./mvnw.cmd clean test
```

Avec profil explicite:

```powershell
cd BackEnd
./mvnw.cmd test -Dspring.profiles.active=test
```

### Python

```powershell
python -m py_compile "main.py" "EncodeGenerator.py" "python_app\config.py" "python_app\backend_client.py" "python_app\logging_utils.py" "python_app\reco_runtime.py"
```

### CI

Le projet contient une GitHub Action dans `.github/workflows/ci.yml` qui verifie:
- tests backend Maven
- syntaxe Python des scripts critiques

## Documentation API

Reference complete: `docs/API.md`

Exemples rapides:

### Authentification

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"change-me"}'
```

### Lister les employes

```bash
curl http://localhost:8080/employes/?page=0\&size=10 \
  -H "Authorization: Bearer <token>"
```

### Creer une presence

```bash
curl -X POST http://localhost:8080/presences/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 3,
    "firstIn": "08:15",
    "breakTime": "12:30",
    "resumeTime": "13:15",
    "lastOut": "17:45",
    "statut": "TERMINE",
    "shift": "Matin",
    "note": "Presence corrigee manuellement"
  }'
```

### Enregistrer un evenement de reconnaissance

```bash
curl -X POST http://localhost:8080/face-recognition/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 3,
    "portail": "Porte Principale",
    "eventType": "AUTO"
  }'
```

## Procedure de deploiement

Guide complet: `docs/DEPLOYMENT.md`

Resume production:
1. preparer PostgreSQL
2. definir les variables d'environnement backend
3. construire le jar Spring Boot
4. lancer l'application en profil `prod`
5. servir le frontend statiquement
6. deployer le client Python sur la machine camera avec un compte `RECOGNITION_CLIENT`

Commande type:

```powershell
cd BackEnd
./mvnw.cmd clean package
java -jar target/dream-case-api-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

## Architecture du systeme

Architecture detaillee: `docs/ARCHITECTURE.md`

Ce qu'il faut retenir:
- le frontend consomme directement l'API REST
- le client Python ne parle plus a la base, seulement au backend HTTP
- le backend porte les regles metier de presence et de securite
- les photos employees sont stockees cote backend
- les encodages faciaux sont stockes localement dans `EncodeFile.p`

## Limites connues

- le frontend reste une application statique sans bundler ni tests UI automatiques
- le token admin est encore stocke cote navigateur
- la partie OpenCV / dlib reste sensible a l'environnement machine, surtout sous Windows
- `EncodeFile.p` est un stockage local simple, pas un registre distribue
- la reconnaissance reste dependante de la qualite camera, de l'eclairage et des photos synchronisees

## Feuilles de route naturelles pour aller encore plus loin

- passer le frontend vers un mecanisme d'auth plus robuste cote navigateur
- ajouter des tests Python et un peu de couverture frontend
- enrichir les endpoints d'observabilite et de monitoring
- dockeriser l'ensemble backend + frontend + base pour un deploiement encore plus simple

## Captures et demo

Pour une presentation GitHub encore plus forte, ajouter dans `docs/screenshots/`:
- login
- dashboard
- gestion des employes
- gestion des presences
- vue presence par employe
- feuille de presence
- boucle de reconnaissance faciale

## Auteur

EL BELLAOUI Amr
