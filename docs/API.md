# API Reference

## Error format

Toutes les erreurs API renvoient maintenant une structure stable:

```json
{
  "timestamp": "2026-03-19T00:00:00Z",
  "status": 400,
  "code": "REQUEST_VALIDATION_FAILED",
  "error": "Bad Request",
  "message": "Request validation failed",
  "path": "/auth/login",
  "validationErrors": {
    "email": "Email must be valid"
  }
}
```

Codes d'erreur principaux:
- `AUTHENTICATION_REQUIRED`: endpoint protege sans token valide
- `ACCESS_DENIED`: token valide mais role insuffisant
- `BAD_CREDENTIALS`: email ou mot de passe incorrect
- `REQUEST_VALIDATION_FAILED`: DTO, query params ou path params invalides
- `REQUEST_BODY_INVALID`: JSON invalide ou mal forme
- `RESOURCE_NOT_FOUND`: ressource absente
- `DUPLICATE_RESOURCE`: conflit d'unicite metier
- `BUSINESS_RULE_VIOLATION`: regle metier non respectee
- `INTERNAL_SERVER_ERROR`: erreur serveur non geree

## Employee

### `GET /employes/`

Liste paginee des employes.

Parametres utiles:
- `page`
- `size`
- `searchByNom`
- `searchByDepartement`
- `searchByStatus`
- `sortBy`
- `direction`

### `POST /employes/`

Cree un employe.

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`

### `GET /employes/{id}`

Retourne un employe par identifiant.

Erreurs frequentes:
- `RESOURCE_NOT_FOUND`

### `PUT /employes/{id}`

Met a jour un employe.

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`

### `DELETE /employes/{id}`

Supprime un employe.

Erreurs frequentes:
- `RESOURCE_NOT_FOUND`

### `GET /employes/count`

Retourne le nombre total d'employes.

### `GET /employes/count-by-statut/all`

Retourne les compteurs agreges par statut:
- `ACTIF`
- `EN_CONGE`
- `INACTIF`

## Presence

### `GET /presences/`

Liste paginee des presences.

Parametres utiles:
- `page`
- `size`
- `searchByNom`
- `searchByStatus`
- `searchByShift`
- `sortBy`
- `direction`

### `POST /presences/`

Cree une presence.

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`
- `BUSINESS_RULE_VIOLATION`

### `GET /presences/{id}`

Retourne une presence.

### `PUT /presences/{id}`

Met a jour une presence.

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`
- `BUSINESS_RULE_VIOLATION`

### `DELETE /presences/{id}`

Supprime une presence.

### `GET /presences/statuts/today`

Retourne les compteurs du jour par statut:
- `PRESENT`
- `EN_PAUSE`
- `TERMINE`
- `ABSENT`

### `GET /presences/export`

Exporte les presences.

Parametres utiles:
- `format=csv|excel`
- `searchByNom`
- `searchByStatus`
- `searchByShift`
- `page`
- `size`
- `exportAll`

Regle importante:
- si `exportAll=false`, `page` et `size` sont obligatoires

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`
- `BUSINESS_RULE_VIOLATION`

## Face Recognition

### `GET /face-recognition/employees`

Retourne la liste des employes actifs utilisables par le client Python.

Champs importants:
- `employeeId`
- `nom`
- `role`
- `departement`
- `statut`
- `photo`

### `POST /face-recognition/employees/{employeeId}/photo`

Met a jour la photo d'un employe.

Payload:

```json
{
  "photo": "data:image/jpeg;base64,..."
}
```

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`

### `POST /face-recognition/events`

Enregistre un evenement de reconnaissance faciale.

Payload:

```json
{
  "employeeId": 3,
  "portail": "Porte Principale",
  "eventType": "AUTO"
}
```

`eventType` accepte:
- `AUTO`
- `CHECK_IN`
- `BREAK_START`
- `BREAK_END`
- `CHECK_OUT`

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`
- `BUSINESS_RULE_VIOLATION`

Reponse type:

```json
{
  "employeeId": 3,
  "employeeName": "Ali",
  "presenceJourId": 12,
  "action": "CHECK_IN",
  "statut": "PRESENT",
  "firstIn": "08:12:31",
  "breakTime": null,
  "resumeTime": null,
  "lastOut": null,
  "totalHeures": "PT0S"
}
```

## Auth

### `POST /auth/login`

Authentifie un utilisateur et retourne un token Bearer.

Exemple:

```json
{
  "email": "admin@example.com",
  "password": "change-me"
}
```

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`
- `REQUEST_BODY_INVALID`
- `BAD_CREDENTIALS`

### `POST /auth/change-password`

Change le mot de passe de l'utilisateur authentifie.

Exemple:

```json
{
  "currentPassword": "old-password",
  "newPassword": "N3wP@ssword!"
}
```

Erreurs frequentes:
- `AUTHENTICATION_REQUIRED`
- `REQUEST_VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`
- `BUSINESS_RULE_VIOLATION`

### `POST /users/`

Cree un utilisateur applicatif.

Exemple:

```json
{
  "name": "Recognition Client",
  "email": "reco-client@example.com",
  "password": "ChangeMe123!",
  "role": "RECOGNITION_CLIENT",
  "active": true
}
```

Erreurs frequentes:
- `REQUEST_VALIDATION_FAILED`
- `DUPLICATE_RESOURCE`
