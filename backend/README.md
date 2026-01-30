# Backend API - Réservations de Chambres

API backend pour gérer les réservations de chambres pour le mariage, avec MongoDB comme base de données.

## 🚀 Installation

1. **Installer les dépendances** :
```bash
npm install
```

2. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
```

Puis éditez `.env` avec vos valeurs :
- `MONGODB_URI` : Votre connection string MongoDB Atlas (doit inclure le nom de la base: `mongodb+srv://.../wedding-db`)
- `MONGODB_DB_NAME` : (Optionnel) Nom de la base de données (défaut: `wedding-db`)
- `PORT` : Port du serveur (défaut: 3000)
- `FRONTEND_URL` : URL de votre frontend (pour CORS)
- `NOTION_WEBHOOK_URL` : (Optionnel) URL du webhook Notion
- `NOTION_WEBHOOK_RESERVATION_URL` : (Optionnel) URL du webhook Notion pour les réservations de chambres

3. **Initialiser le stock de chambres** :
```bash
npm run init-stock
```

## 📡 Démarrage

**Mode développement** (avec auto-reload) :
```bash
npm run dev
```

**Mode production** :
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 🔌 Endpoints API

### GET `/api/reservations`
Récupère toutes les réservations.

**Query params** (optionnel) :
- `roomType` : Filtrer par type (`moul-yam`, `tenti-tzfoni`, `tenti-zougi`)

**Réponse** :
```json
{
  "success": true,
  "reservations": [...],
  "total": 5
}
```

### POST `/api/reservations`
Crée une nouvelle réservation.

**Body** :
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "personnes": 2,
  "message": "Message optionnel",
  "roomType": "moul-yam"
}
```

**Réponse** :
```json
{
  "success": true,
  "reservation": {...},
  "available": 0
}
```

### GET `/api/reservations/availability`
Récupère toutes les disponibilités.

**Réponse** :
```json
{
  "success": true,
  "availability": {
    "moul-yam": {
      "roomName": "MOUL YAM (Vue sur Mer)",
      "total": 1,
      "reserved": 0,
      "available": 1
    },
    ...
  }
}
```

### GET `/api/reservations/availability/:roomType`
Récupère la disponibilité d'un type spécifique.

**Réponse** :
```json
{
  "success": true,
  "roomType": "moul-yam",
  "roomName": "MOUL YAM (Vue sur Mer)",
  "total": 1,
  "reserved": 0,
  "available": 1
}
```

### DELETE `/api/reservations/:id`
Supprime une réservation (admin).

**Réponse** :
```json
{
  "success": true,
  "message": "Réservation supprimée avec succès",
  "available": 1
}
```

## 🗄️ Structure MongoDB

### Collection `reservations`
- `nom`, `prenom`, `personnes`, `message`
- `roomType`, `roomName`
- `timestamp`, `dateFormatted`
- `createdAt`, `updatedAt` (automatiques)

### Collection `roomStock`
- `roomType` (unique)
- `roomName`
- `totalStock`

## 🔧 Scripts

- `npm start` : Démarre le serveur
- `npm run dev` : Mode développement avec nodemon
- `npm run init-stock` : Initialise le stock de chambres dans MongoDB
- `npm run migrate-db` : Migre les données de la base "test" vers "wedding-db"
- `npm run generate-email-floral` : Génère `images/fond-floral-reservation-email.png` (bandeau floral) et `images/logo-email.png` (logo PNG pour Gmail). À lancer une fois après `npm install`.

## 🗃️ Configuration de la Base de Données

Le système utilise automatiquement la base de données `wedding-db` par défaut. Si vous avez des données dans plusieurs bases (par exemple "test" et "wedding-db"), voici comment résoudre le problème :

### Vérifier votre URI MongoDB

Votre `MONGODB_URI` doit inclure le nom de la base de données :
```
mongodb+srv://user:password@cluster.mongodb.net/wedding-db?retryWrites=true&w=majority
                                                          ^^^^^^^^^^
```

### Migrer les données

Si vous avez des réservations dans la base "test" que vous voulez conserver :

```bash
npm run migrate-db
```

Ce script va :
1. Lister toutes les bases de données disponibles
2. Copier les données de "test" vers "wedding-db"
3. Éviter les doublons

### Supprimer l'ancienne base

Après migration, vous pouvez supprimer la base "test" via MongoDB Compass ou le shell MongoDB :
```javascript
use test
db.dropDatabase()
```

## 📝 Notes

- Les disponibilités sont calculées dynamiquement en comptant les réservations
- L'envoi à Notion se fait en arrière-plan et n'affecte pas la réponse API
- CORS est configuré pour autoriser les requêtes depuis le frontend
