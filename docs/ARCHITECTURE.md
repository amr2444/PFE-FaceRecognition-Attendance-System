# Architecture

## Vue d'ensemble

Le projet suit une architecture simple en trois couches:

1. `FrontEnd/`
   Dashboard d'administration en HTML/CSS/JavaScript.
2. `BackEnd/`
   API REST Spring Boot avec la logique metier.
3. `main.py` + `EncodeGenerator.py`
   Application Python pour la reconnaissance faciale et la synchronisation des photos.

## Flux principal

### Dashboard admin

Le frontend appelle directement l'API REST du backend:
- gestion des employes via `/employes`
- gestion des presences via `/presences`
- statistiques du dashboard via `/employes/count`, `/employes/count-by-statut/all` et `/presences/statuts/today`

### Reconnaissance faciale

Le flux de reconnaissance est le suivant:

1. `EncodeGenerator.py` lit les images locales dans `Images/`
2. il verifie l'existence de l'employe via l'API
3. il pousse la photo vers `/face-recognition/employees/{employeeId}/photo`
4. il genere `EncodeFile.p`
5. `main.py` charge `EncodeFile.p`
6. lors d'une reconnaissance, `main.py` appelle `/face-recognition/events`
7. le backend met a jour `PresenceJour` et `EntreeRecente`

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

## Stockage

- H2 pour la demo locale et le seed
- les photos employees sont actuellement stockees en base sous forme de `String`
- les encodages faciaux sont stockes localement dans `EncodeFile.p`

## Limites connues

- l'authentification frontend est une couche de demonstration uniquement
- la photo employee n'est pas encore fortement validee cote backend
- la partie reconnaissance temps reel depend toujours des libs locales OpenCV/dlib
