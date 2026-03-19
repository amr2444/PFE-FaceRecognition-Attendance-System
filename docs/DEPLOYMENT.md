# Deployment Guide

## Goals

Ce document decrit une mise en service simple et reproductible du projet selon trois contextes:
- `dev`: developpement local avec H2 fichier
- `test`: execution de tests automatiques avec H2 memoire
- `prod`: deploiement backend sur PostgreSQL avec Flyway

## Runtime matrix

| Context | Profile | Database | Seed | Swagger/H2 console |
| --- | --- | --- | --- | --- |
| Local dev | `dev` | H2 file | optional | enabled by config |
| Automated tests | `test` | H2 memory | disabled | disabled |
| Production | `prod` | PostgreSQL | disabled | disabled |

## Required environment variables

### Backend

- `SPRING_PROFILES_DEFAULT=dev|prod|test`
- `APP_JWT_SECRET=<long-random-secret>`
- `DB_URL=jdbc:postgresql://host:5432/database`
- `DB_USERNAME=<db-user>`
- `DB_PASSWORD=<db-password>`
- `APP_BOOTSTRAP_ADMIN_ENABLED=false`
- `APP_BOOTSTRAP_RECOGNITION_CLIENT_ENABLED=false`
- `APP_LOCAL_H2_SEED_ENABLED=false`

Notes:
- `APP_JWT_SECRET` est obligatoire hors `dev` et `test`
- en production, utiliser un secret long et stable, stocke dans un secret manager ou dans les variables d'environnement de l'hebergeur
- `ddl-auto` reste en `validate`; le schema doit venir de Flyway

### Python recognition client

- `FACE_API_BASE_URL=http://localhost:8080`
- `FACE_API_EMAIL=<recognition-client-email>`
- `FACE_API_PASSWORD=<recognition-client-password>`
- `FACE_API_TIMEOUT_SECONDS=15`
- `FACE_API_RETRY_COUNT=2`
- `FACE_API_RETRY_BACKOFF_SECONDS=1.5`
- `FACE_DEFAULT_PORTAL=Porte Principale`
- `FACE_CAMERA_INDEX=0`
- `FACE_FRAME_SCALE=0.25`
- `FACE_RECOGNITION_COOLDOWN_SECONDS=2`
- `FACE_API_EMPLOYEE_REFRESH_SECONDS=15`
- `FACE_LOG_LEVEL=INFO`

## Local development

### Backend

```powershell
cd BackEnd
./mvnw.cmd spring-boot:run
```

### Frontend

```powershell
cd FrontEnd
python -m http.server 5500
```

### Python

```powershell
py -3.10 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python EncodeGenerator.py
python main.py
```

## Production backend deployment

### 1. Prepare PostgreSQL

- creer une base dediee
- creer un utilisateur dedie avec droits limites a cette base
- verifier la connectivite reseau entre le serveur applicatif et PostgreSQL

### 2. Configure environment variables

Exemple minimal:

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

### 3. Build artifact

```powershell
cd BackEnd
./mvnw.cmd clean package
```

Jar genere:
- `BackEnd/target/dream-case-api-0.0.1-SNAPSHOT.jar`

### 4. Start application

```powershell
java -jar BackEnd/target/dream-case-api-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Au demarrage:
- Flyway applique les migrations manquantes
- Hibernate valide le schema
- l'application echoue si `APP_JWT_SECRET` est absent en `prod`

### 5. Smoke checks

- verifier `GET /actuator/health`
- verifier `POST /auth/login`
- verifier qu'un endpoint protege refuse un acces sans token
- verifier Swagger et H2 console non exposes en prod

## Frontend deployment notes

- le frontend est statique; il peut etre servi par Nginx, Apache, un serveur web interne, ou un simple serveur HTTP
- il doit pointer vers l'URL publique du backend
- le stockage actuel du token reste base sur le navigateur; pour une prod plus stricte, migrer vers un cookie `HttpOnly`

## Recognition client deployment notes

- utiliser un compte `RECOGNITION_CLIENT` dedie
- stocker `FACE_API_EMAIL` et `FACE_API_PASSWORD` dans l'environnement local de la machine camera
- verifier que la machine camera atteint bien le backend en HTTPS si expose hors local
- verifier que le timeout, le nombre de retries et le cooldown local sont adaptes au reseau et au materiel camera

## Release checklist

- tests backend verts: `./mvnw.cmd clean test`
- CI GitHub verte
- migrations Flyway presentes pour tout changement de schema
- `APP_JWT_SECRET` configure en prod
- seed local desactive en prod
- bootstrap admin desactive en prod sauf procedure exceptionnelle maitrisee
- sauvegarde PostgreSQL et plan de restauration definis

## Known limitations

- frontend sans bundler ni pipeline d'assets
- token admin encore stocke cote navigateur
- dependances Python OpenCV/dlib sensibles a l'environnement local
