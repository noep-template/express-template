## Mini Todo API (Express + TypeScript + Prisma)

API Express minimaliste en TypeScript avec Prisma, pouvant utiliser SQLite ou MongoDB au choix. Un script de setup interactif et un Makefile facilitent l’onboarding et les changements de base de données.

### Prérequis

- Node.js >= 18
- Docker (optionnel, recommandé pour MongoDB)
- make (GNU Make)

### Installation

```bash
npm ci
```

### Démarrage

- Dev: `npm run dev`
- Build: `npm run build`
- Start (prod, après build): `npm run start`

### Choisir et initialiser la base de données

- Setup interactif (recommandé):

```bash
make setup
```

- Demande de choisir entre sqlite/mongodb

### Endpoints principaux

- Santé: `GET /api/health`
- Documentation Swagger: `GET /docs`
- Tâches:
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id`
  - `DELETE /api/tasks/:id`

### Licence

MIT
