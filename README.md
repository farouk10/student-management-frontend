# Gestionnaire d'Étudiants — Frontend Angular

**Résumé**  
Interface utilisateur Angular pour la gestion d'étudiants avec dashboard administrateur et vue utilisateur. Fonctionnalités : authentification JWT, CRUD complet avec upload de photos, notifications temps réel via Socket.IO, recherche et pagination.

---

## Table des matières
- Technos
- Fonctionnalités
- Prérequis
- Installation
- Configuration
- Lancer l'application
- Structure du projet
- Services principaux
- Intercepteurs
- Socket.IO Client  
- Tests
- Build pour production
- Dépannage 
- Contribuer
- Licence

---

## Technos
- **Angular** (TypeScript)
- **Bootstrap** pour le styling
- **Socket.IO Client** pour les notifications temps réel
- **RxJS** pour la gestion des observables
- **Angular Router** pour la navigation
- **HttpClient** pour les appels API

---

## Fonctionnalités
- ✅ Authentification JWT (login/register)
- ✅ Dashboard administrateur avec statistiques
- ✅ CRUD complet des étudiants
- ✅ Upload et affichage de photos d'étudiants
- ✅ Recherche et pagination
- ✅ Notifications en temps réel (Socket.IO)
- ✅ Affichage des utilisateurs en ligne
- ✅ Audit des actions (logs automatiques)
- ✅ Protection des routes selon les rôles (admin/user)
- ✅ Interface responsive

---

## Prérequis
- Node.js (version LTS recommandée)
- npm ou yarn
- Angular CLI : `npm install -g @angular/cli`
- Backend API en cours d'exécution (voir [student-management-rest-api](https://github.com/farouk10/student-management-rest-api))

---

## Installation

```bash
# Cloner le repository
git clone https://github.com/farouk10/student-management-frontend.git
cd student-management-frontend

# Installer les dépendances
npm install
```

---

## Configuration

### Variables d'environnement

Modifier `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000', // URL de votre backend
  socketUrl: 'http://localhost:3000'   // URL Socket.IO
};
```

Pour la production, modifier `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://votre-api.com',
  socketUrl: 'https://votre-api.com'
};
```

---

## Lancer l'application

```bash
# Mode développement
ng serve

# L'application sera accessible sur http://localhost:4200
```

Pour spécifier un autre port :
```bash
ng serve --port 4300
```

Pour autoriser l'accès depuis d'autres machines du réseau :
```bash
ng serve --host 0.0.0.0
```

---

## Structure du projet

```
src/
├── app/
│   ├── components/           # Composants Angular
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── student-list/
│   │   ├── student-form/
│   │   └── logs/
│   ├── services/             # Services
│   │   ├── auth.service.ts
│   │   ├── student.service.ts
│   │   ├── socket.service.ts
│   │   └── log.service.ts
│   ├── interceptors/         # Intercepteurs HTTP
│   │   ├── auth.interceptor.ts
│   │   └── log.interceptor.ts
│   ├── guards/               # Guards de route
│   │   ├── auth.guard.ts
│   │   └── admin.guard.ts
│   ├── models/               # Interfaces TypeScript
│   └── app-routing.module.ts
├── environments/             # Configuration environnement
└── assets/                   # Images, styles
```

---

## Services principaux

### AuthService
Gère l'authentification (login, register, token JWT).

```typescript
login(email: string, password: string)
register(userData)
logout()
getToken()
isAuthenticated()
```

### StudentService
Gère les opérations CRUD des étudiants.

```typescript
getStudents(page, limit, search)
getStudentById(id)
createStudent(student)
createStudentWithPhoto(formData)
updateStudent(id, student)
updateStudentWithPhoto(id, formData)
deleteStudent(id)
```

### SocketService
Gère la connexion Socket.IO et les événements temps réel.

```typescript
connect(token)
disconnect()
onOnlineUsers()
onEtudiantCreated()
onEtudiantUpdated()
onEtudiantDeleted()
```

---

## Intercepteurs

### AuthInterceptor
Ajoute automatiquement le token JWT dans les en-têtes de toutes les requêtes HTTP.

### LogInterceptor
Enregistre automatiquement les actions CREATE/UPDATE/DELETE en envoyant un log au backend.

---

## Socket.IO Client

Le client Socket.IO se connecte au backend avec le token JWT :

```typescript
this.socket = io(environment.socketUrl, {
  auth: {
    token: `Bearer ${token}`
  }
});
```

**Événements reçus :**
- `onlineUsers` : Liste des utilisateurs connectés
- `etudiantCreated` : Nouvel étudiant créé
- `etudiantUpdated` : Étudiant mis à jour
- `etudiantDeleted` : Étudiant supprimé
- `newChatMessage` : Nouveau message (si chat implémenté)

---

## Tests

### Tests unitaires

```bash
# Lancer les tests avec Karma
ng test
```

### Tests end-to-end

```bash
# Lancer les tests e2e (si configurés)
ng e2e
```

---

## Build pour production

```bash
# Créer un build optimisé
ng build --configuration production

# Les fichiers seront dans dist/
```

Pour déployer :
1. Copier le contenu de `dist/` sur votre serveur web
2. Configurer le serveur pour rediriger toutes les routes vers `index.html`
3. S'assurer que `environment.prod.ts` pointe vers la bonne URL API

---

## Dépannage

### Erreur CORS
Vérifier que le backend autorise l'origine du frontend dans `ALLOWED_ORIGINS`.

### Token expiré
Le token JWT expire après un certain temps. Implémenter un refresh token ou redemander à l'utilisateur de se reconnecter.

### Photos ne s'affichent pas
- Vérifier que l'URL de base dans `environment.ts` est correcte
- S'assurer que le backend sert bien les fichiers statiques sur `/uploads`
- Exemple d'URL : `http://localhost:3000/uploads/photo-123456.jpg`

### Socket.IO ne se connecte pas
- Vérifier que `socketUrl` dans environment.ts est correct
- Vérifier que le token est valide
- Ouvrir la console du navigateur pour voir les erreurs Socket.IO

---

## Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

---

## Licence

Ce projet est distribué sous la licence [MIT](./LICENSE).


---

## Auteur

**Farouk Talha**  
- GitHub : [@farouk10](https://github.com/farouk10)
- Repo Backend : [student-management-rest-api](https://github.com/farouk10/student-management-rest-api)

---

## API Backend requise

Cette application frontend nécessite le backend suivant :  
👉 [student-management-api](https://github.com/farouk10/student-management-api)

Assurez-vous que l'API est démarrée avant de lancer le frontend.
