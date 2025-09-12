---
marp: true
theme: default
paginate: true
backgroundColor: #fff
color: #333
header: 'Web 2 Reloaded - Concepts Théoriques'
footer: '© 2025 - Formation Backend Moderne'
---

# Web 2 Reloaded

## Concepts Théoriques du Backend Moderne

**TypeScript + Express + Prisma**

---

## Plan de la Présentation

1. **Introduction aux Technologies**
2. **Architecture Backend Moderne**
3. **TypeScript : Typage Statique**
4. **Express.js : Framework Web**
5. **Prisma : ORM Moderne**
6. **Patterns et Bonnes Pratiques**
7. **Sécurité et Production**

---

## Pourquoi ces Technologies ?

### **Problèmes du JavaScript Vanilla**

- Absence de typage → erreurs à l'exécution
- Code difficile à maintenir
- Refactoring risqué
- Documentation insuffisante

### **Solutions Modernes**

- **TypeScript** : Typage statique
- **Express** : Framework mature et flexible
- **Prisma** : ORM type-safe et moderne

---

## TypeScript : Le JavaScript Typé

### **Avantages**

- 🔍 **Détection d'erreurs** à la compilation
- 🧠 **IntelliSense** amélioré dans l'IDE
- 📚 **Auto-documentation** du code
- 🔄 **Refactoring** sécurisé
- 👥 **Collaboration** facilitée en équipe

### **Concepts Clés**

```typescript
// Types primitifs

let nom: string = 'Moustache';
let age: number = 25;
let actif: boolean = true;

// Interfaces

interface Utilisateur {
  id: number;
  nom: string;
  email?: string; // Optionnel
}
```

---

## Express.js : Le Framework Web

### **Philosophie**

- **Minimaliste** : ne fournit que l'essentiel
- **Middleware-centric** : architecture modulaire
- **Flexible** : s'adapte à tous les besoins
- **Mature** : écosystème riche

### **Architecture Middleware**

```typescript
app.use(express.json()); // Parser JSON
app.use(helmet()); // Sécurité
app.use(cors()); // CORS
app.use('/api', routesAPI); // Routes
app.use(errorHandler); // Gestion erreurs
```

---

## Middleware : Le Cœur d'Express

### **Concept**

Fonctions qui s'exécutent **séquentiellement** pour chaque requête

### **Types de Middleware**

- **Application-level** : `app.use()`
- **Router-level** : `router.use()`
- **Error-handling** : `(err, req, res, next) => {}`
- **Built-in** : `express.json()`, `express.static()`
- **Third-party** : `helmet`, `cors`, `morgan`
### **Flux d'une Requête**

```


Request → Middleware 1 → Middleware 2 → Route Handler → Response


```

---

## Prisma : L'ORM Moderne

### **Qu'est-ce qu'un ORM ?**

**Object-Relational Mapping** : Pont entre objets et base de données

### **Avantages de Prisma**

- 🎯 **Type-safe** : Pas d'erreurs de requête
- 🔄 **Schema-first** : Base de données comme source de vérité
- 🚀 **Performance** : Requêtes optimisées
- 🛠️ **Developer Experience** : Outils excellents
- 📱 **Multi-database** : SQLite, PostgreSQL, MySQL, etc.

---

## Prisma Schema : La Source de Vérité

### **Structure**

```prisma


generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  content  String?
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}


```

---
