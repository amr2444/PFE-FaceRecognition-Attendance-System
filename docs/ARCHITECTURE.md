# Architecture

## Vue d'ensemble

Le projet suit une architecture en trois briques fonctionnelles reliees par HTTP et par des contrats API explicites:

1. `FrontEnd/`
   Dashboard d'administration en HTML/CSS/JavaScript.
2. `BackEnd/`
   API REST Spring Boot avec logique metier, securite JWT, validation, migrations et persistance.
3. `main.py` + `EncodeGenerator.py`
   Client Python pour la reconnaissance faciale, la synchronisation des photos et les appels temps reel vers l'API.

## Principes d'architecture

- le backend est la source de verite metier
- le frontend et le client Python consomment l'API, pas la base directement
- le schema de base vient de Flyway, pas d'Hibernate auto-create
- les erreurs API suivent un format stable avec `code`, `message`, `status`, `path`
- la logique de pointage est concentree cote backend pour rester coherente entre UI admin et reconnaissance

## Flux principal

### Dashboard admin

Le frontend appelle directement l'API REST du backend:
- gestion des employes via `/employes`
- gestion des presences via `/presences`
- statistiques du dashboard via `/employes/count`, `/employes/count-by-statut/all` et `/presences/statuts/today`
- activite recente via `/face-recognition/recent-entries`

### Reconnaissance faciale

Le flux de reconnaissance est le suivant:

1. `EncodeGenerator.py` lit les images locales dans `Images/`
2. il verifie l'existence de l'employe via l'API
3. il pousse la photo vers `/face-recognition/employees/{employeeId}/photo`
4. il genere `EncodeFile.p`
5. `main.py` charge `EncodeFile.p`
6. lors d'une reconnaissance, `main.py` appelle `/face-recognition/events`
7. le backend met a jour `PresenceJour` et `EntreeRecente`

## Flux de securite

### Frontend admin

1. login via `POST /auth/login`
2. reception d'un JWT
3. stockage du token cote navigateur
4. appels REST proteges avec header `Authorization: Bearer ...`

### Client Python

1. login via `POST /auth/login`
2. memorisation du token
3. re-auth automatique si `401`
4. retry/backoff sur erreurs reseau temporaires

## Responsabilites backend

### `EmployeeService`

- creation, modification, suppression et recherche d'employes
- comptage par statut
- persistance de la photo employee

### `PresenceJourService`

- CRUD de presence
- pagination, filtres et export
- statistiques des statuts de presence du jour

### `FaceRecognitionService`

- liste des employes actifs exposes a la reconnaissance
- controle du cycle de pointage: check-in, pause, reprise, check-out
- protection anti double scan tres rapproches
- mise a jour de la photo employee
- creation d'entrees recentes
- exposition des entrees recentes pour le dashboard

## Couches backend

- `controller`: expose les contrats REST
- `service`: applique les regles metier et validations metier
- `repository`: encapsule l'acces JPA
- `mapper`: conversion DTO <-> entites
- `security`: JWT, roles, filtres, handlers `401/403`

## Stockage

- H2 pour la demo locale et le seed
- PostgreSQL pour le profil `prod`
- Flyway comme source de verite du schema backend
- les photos employees sont actuellement stockees en base sous forme de `String`
- les encodages faciaux sont stockes localement dans `EncodeFile.p`

## Observabilite et qualite

- logs backend Spring pour les operations metier critiques
- logs Python cote reconnaissance pour erreurs reseau et synchronisation
- tests backend unitaires + integration
- CI GitHub pour tests backend et verifications Python

## Profils d'execution

- `dev`: environnement local avec H2 fichier et outils de debug controles par configuration
- `test`: environnement automatise avec H2 memoire et migrations Flyway
- `prod`: backend sur PostgreSQL, seed local desactive, secret JWT obligatoire

## Limites connues

- le frontend est plus mature qu'au debut mais reste une application statique sans framework ni tests UI automatiques
- la photo employee n'est pas encore fortement validee cote backend sur le contenu image lui-meme
- la partie reconnaissance temps reel depend toujours des libs locales OpenCV/dlib et des conditions materielle/camera
