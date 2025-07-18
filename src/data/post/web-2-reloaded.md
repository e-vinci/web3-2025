---
publishDate: 2023-01-02T00:00:00Z
title: Web 2 reloaded - backend
excerpt: Sint sit cillum pariatur eiusmod nulla pariatur ipsum. Sit laborum anim qui mollit tempor pariatur nisi minim dolor.
tags:
  - markdown
  - blog
  - Astro
---

## Objectifs

Nous allons créer une application backend moderne avec TypeScript, Express et Prisma. Cette application sera une API REST qui permettra de gérer une collection de photos de moustaches.

Slides disponibles ici: [Web 2 Reloaded](/public/slides/web2-reloaded-theory.pdf)

## Guide pas à pas : Backend TypeScript + Express + Prisma

### 1. Initialisation du projet

Commencez par créer un nouveau dossier pour votre projet backend :

```bash
mkdir mustaches-backend
cd mustaches-backend
```

Initialisez un nouveau projet Node.js :

```bash
npm init -y
```

### 2. Installation des dépendances

Installez les dépendances principales :

```bash
npm install express prisma @prisma/client
npm install -D typescript @types/node @types/express ts-node nodemon
```

### 3. Configuration TypeScript

Créez un fichier `tsconfig.json` :

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Configuration de Prisma

Initialisez Prisma :

```bash
npx prisma init --datasource-provider sqlite
```

Ceci créera un dossier `prisma` avec un fichier `schema.prisma` et un fichier `.env`.

Modifiez le fichier `prisma/schema.prisma` :

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Mustache {
  id   Int    @id @default(autoincrement())
  name String
  url  String?

  @@map("mustaches")
}
```

### 5. Configuration de la base de données

Le fichier `.env` devrait contenir :

```env
DATABASE_URL="file:./dev.db"
```

Créez et appliquez la migration :

```bash
npx prisma migrate dev --name init
```

Générez le client Prisma :

```bash
npx prisma generate
```

### 6. Structure des dossiers

Créez la structure de dossiers suivante :

```
src/
  ├── routes/
  ├── controllers/
  ├── services/
  └── types/
```

### 7. Configuration Express

Créez le fichier `src/app.ts` :

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());

// Routes de base
app.get('/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Le serveur fonctionne correctement',
  });
});

// Route pour récupérer la liste des moustaches
app.get('/mustaches', async (req, res) => {
  try {
    const mustaches = await prisma.mustache.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    res.status(200).json({
      success: true,
      data: mustaches,
      count: mustaches.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des moustaches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

export default app;
```

Créez le fichier `src/server.ts` :

```typescript
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/healthcheck`);
  console.log(`👨 Moustaches: http://localhost:${PORT}/mustaches`);
});
```

### 8. Scripts npm

Modifiez le fichier `package.json` pour ajouter les scripts :

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  }
}
```

### 9. Données de test

Créez un fichier `prisma/seed.ts` pour ajouter des données de test :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Supprimer les données existantes
  await prisma.mustache.deleteMany();

  // Créer des données de test
  const mustaches = await prisma.mustache.createMany({
    data: [
      { name: 'La Française', url: 'https://example.com/francaise.jpg' },
      { name: 'La Guidon', url: 'https://example.com/guidon.jpg' },
      { name: 'La Pencil', url: 'https://example.com/pencil.jpg' },
      { name: 'La Horseshoe', url: 'https://example.com/horseshoe.jpg' },
      { name: 'La Walrus', url: 'https://example.com/walrus.jpg' },
    ],
  });

  console.log(`✅ ${mustaches.count} moustaches créées`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Ajoutez le script de seed dans `package.json` :

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Installez ts-node globalement si nécessaire et exécutez le seed :

```bash
npm install -D ts-node
npx prisma db seed
```

### 10. Démarrage et test

Démarrez le serveur en mode développement :

```bash
npm run dev
```

Testez vos routes :

1. **Health check** : `GET http://localhost:3000/healthcheck`

   - Devrait retourner un status 200 avec un message de confirmation

2. **Liste des moustaches** : `GET http://localhost:3000/mustaches`
   - Devrait retourner la liste des moustaches avec leur ID et nom

### 11. Test avec curl ou un client REST

Vous pouvez tester les routes avec curl :

```bash
# Test du health check
curl http://localhost:3000/healthcheck

# Test de la liste des moustaches
curl http://localhost:3000/mustaches
```

### 12. Prochaines étapes

Votre API backend est maintenant fonctionnelle ! Vous pouvez l'étendre en ajoutant :

- Authentification et autorisation
- Validation des données avec Joi ou Zod
- Logging avec Winston
- Tests avec Jest
- Documentation avec Swagger
- Gestion des erreurs plus sophistiquée
- CORS pour les requêtes cross-origin
- Rate limiting
- Compression des réponses

### Structure finale du projet

```
mustaches-backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app.ts
│   └── server.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

Félicitations ! Vous avez maintenant une API backend moderne avec TypeScript, Express et Prisma qui fonctionne parfaitement.

## <a name="Headings"></a>Architecture et bonnes pratiques

### Organisation du code

Pour un projet plus important, il est recommandé d'organiser le code de la manière suivante :

```
src/
├── controllers/     # Logique des contrôleurs
├── services/        # Logique métier
├── routes/          # Définition des routes
├── middleware/      # Middleware personnalisés
├── types/           # Types TypeScript
├── utils/           # Utilitaires
├── config/          # Configuration
└── __tests__/       # Tests
```

### Exemple d'architecture avancée

**src/controllers/mustacheController.ts**

```typescript
import { Request, Response } from 'express';
import { MustacheService } from '../services/mustacheService';

export class MustacheController {
  private mustacheService: MustacheService;

  constructor() {
    this.mustacheService = new MustacheService();
  }

  async getAllMustaches(req: Request, res: Response) {
    try {
      const mustaches = await this.mustacheService.findAll();
      res.json({
        success: true,
        data: mustaches,
        count: mustaches.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des moustaches',
      });
    }
  }

  async getMustacheById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const mustache = await this.mustacheService.findById(parseInt(id));

      if (!mustache) {
        return res.status(404).json({
          success: false,
          message: 'Moustache non trouvée',
        });
      }

      res.json({
        success: true,
        data: mustache,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la moustache',
      });
    }
  }
}
```

### Gestion des erreurs et validation

Il est important d'ajouter une gestion d'erreurs robuste et une validation des données :

```typescript
import { z } from 'zod';

// Schéma de validation pour une moustache
const MustacheSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  url: z.string().url('URL invalide').optional(),
});

// Middleware de validation
export const validateMustache = (req: Request, res: Response, next: NextFunction) => {
  try {
    MustacheSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: error.errors,
    });
  }
};
```

## Sécurité et déploiement

### Sécurité de base

Ajoutez ces packages pour améliorer la sécurité :

```bash
npm install helmet cors morgan compression dotenv
npm install -D @types/cors @types/morgan @types/compression
```

Configuration sécurisée dans `app.ts` :

```typescript
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

// Sécurité
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());
```

### Variables d'environnement

Créez un fichier `.env.example` :

```env
# Base de données
DATABASE_URL="file:./dev.db"

# Serveur
PORT=3000
NODE_ENV=development

# Sécurité
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
JWT_SECRET="your-secret-key"

# Logging
LOG_LEVEL=info
```

### Déploiement

Pour le déploiement, ajoutez ces scripts dans `package.json` :

```json
{
  "scripts": {
    "prebuild": "npm run db:generate",
    "build": "tsc",
    "start": "node dist/server.js",
    "deploy": "npm run build && npm run db:migrate"
  }
}
```

## Tests et qualité du code

### Configuration des tests avec Jest

```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest
```

Créez `jest.config.js` :

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
```

Exemple de test pour l'API :

```typescript
// src/__tests__/mustache.test.ts
import request from 'supertest';
import app from '../app';

describe('Mustache API', () => {
  it('should return health check', async () => {
    const response = await request(app).get('/healthcheck').expect(200);

    expect(response.body.status).toBe('OK');
  });

  it('should return list of mustaches', async () => {
    const response = await request(app).get('/mustaches').expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

Cette architecture vous donne une base solide pour développer une API backend moderne et maintenable avec TypeScript, Express et Prisma.

## Heading two

Aute officia nulla deserunt do deserunt cillum velit magna. Officia veniam culpa anim minim dolore labore pariatur voluptate id ad est duis quis velit dolor pariatur enim. Incididunt enim excepteur do veniam consequat culpa do voluptate dolor fugiat ad adipisicing sit. Labore officia est adipisicing dolore proident eiusmod exercitation deserunt ullamco anim do occaecat velit. Elit dolor consectetur proident sunt aliquip est do tempor quis aliqua culpa aute. Duis in tempor exercitation pariatur et adipisicing mollit irure tempor ut enim esse commodo laboris proident. Do excepteur laborum anim esse aliquip eu sit id Lorem incididunt elit irure ea nulla dolor et. Nulla amet fugiat qui minim deserunt enim eu cupidatat aute officia do velit ea reprehenderit.

### Heading three

Voluptate cupidatat cillum elit quis ipsum eu voluptate fugiat consectetur enim. Quis ut voluptate culpa ex anim aute consectetur dolore proident voluptate exercitation eiusmod. Esse in do anim magna minim culpa sint. Adipisicing ipsum consectetur proident ullamco magna sit amet aliqua aute fugiat laborum exercitation duis et.

#### Heading four

Commodo fugiat aliqua minim quis pariatur mollit id tempor. Non occaecat minim esse enim aliqua adipisicing nostrud duis consequat eu adipisicing qui. Minim aliquip sit excepteur ipsum consequat laborum pariatur excepteur. Veniam fugiat et amet ad elit anim laborum duis mollit occaecat et et ipsum et reprehenderit. Occaecat aliquip dolore adipisicing sint labore occaecat officia fugiat. Quis adipisicing exercitation exercitation eu amet est laboris sunt nostrud ipsum reprehenderit ullamco. Enim sint ut consectetur id anim aute voluptate exercitation mollit dolore magna magna est Lorem. Ut adipisicing adipisicing aliqua ullamco voluptate labore nisi tempor esse magna incididunt.

##### Heading five

Veniam enim esse amet veniam deserunt laboris amet enim consequat. Minim nostrud deserunt cillum consectetur commodo eu enim nostrud ullamco occaecat excepteur. Aliquip et ut est commodo enim dolor amet sint excepteur. Amet ad laboris laborum deserunt sint sunt aliqua commodo ex duis deserunt enim est ex labore ut. Duis incididunt velit adipisicing non incididunt adipisicing adipisicing. Ad irure duis nisi tempor eu dolor fugiat magna et consequat tempor eu ex dolore. Mollit esse nisi qui culpa ut nisi ex proident culpa cupidatat cillum culpa occaecat anim. Ut officia sit ea nisi ea excepteur nostrud ipsum et nulla.

###### Heading six

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

[[Top]](#top)

## <a name="Paragraphs"></a>Paragraphs

Incididunt ex adipisicing ea ullamco consectetur in voluptate proident fugiat tempor deserunt reprehenderit ullamco id dolore laborum. Do laboris laboris minim incididunt qui consectetur exercitation adipisicing dolore et magna consequat magna anim sunt. Officia fugiat Lorem sunt pariatur incididunt Lorem reprehenderit proident irure. Dolore ipsum aliqua mollit ad officia fugiat sit eu aliquip cupidatat ipsum duis laborum laborum fugiat esse. Voluptate anim ex dolore deserunt ea ex eiusmod irure. Occaecat excepteur aliqua exercitation aliquip dolor esse eu eu.

Officia dolore laborum aute incididunt commodo nisi velit est est elit et dolore elit exercitation. Enim aliquip magna id ipsum aliquip consectetur ad nulla quis. Incididunt pariatur dolor consectetur cillum enim velit cupidatat laborum quis ex.

Officia irure in non voluptate adipisicing sit amet tempor duis dolore deserunt enim ut. Reprehenderit incididunt in ad anim et deserunt deserunt Lorem laborum quis. Enim aute anim labore proident laboris voluptate elit excepteur in. Ex labore nulla velit officia ullamco Lorem Lorem id do. Dolore ullamco ipsum magna dolor pariatur voluptate ipsum id occaecat ipsum. Dolore tempor quis duis commodo quis quis enim.

[[Top]](#top)

## <a name="Blockquotes"></a>Blockquotes

Ad nisi laborum aute cupidatat magna deserunt eu id laboris id. Aliquip nulla cupidatat sint ex Lorem mollit laborum dolor amet est ut esse aute. Nostrud ex consequat id incididunt proident ipsum minim duis aliqua ut ex et ad quis. Laborum sint esse cillum anim nulla cillum consectetur aliqua sit. Nisi excepteur cillum labore amet excepteur commodo enim occaecat consequat ipsum proident exercitation duis id in.

> Ipsum et cupidatat mollit exercitation enim duis sunt irure aliqua reprehenderit mollit. Pariatur Lorem pariatur laboris do culpa do elit irure. Eiusmod amet nulla voluptate velit culpa et aliqua ad reprehenderit sit ut.

Labore ea magna Lorem consequat aliquip consectetur cillum duis dolore. Et veniam dolor qui incididunt minim amet laboris sit. Dolore ad esse commodo et dolore amet est velit ut nisi ea. Excepteur ea nulla commodo dolore anim dolore adipisicing eiusmod labore id enim esse quis mollit deserunt est. Minim ea culpa voluptate nostrud commodo proident in duis aliquip minim.

> Qui est sit et reprehenderit aute est esse enim aliqua id aliquip ea anim. Pariatur sint reprehenderit mollit velit voluptate enim consectetur sint enim. Quis exercitation proident elit non id qui culpa dolore esse aliquip consequat.

Ipsum excepteur cupidatat sunt minim ad eiusmod tempor sit.

> Deserunt excepteur adipisicing culpa pariatur cillum laboris ullamco nisi fugiat cillum officia. In cupidatat nulla aliquip tempor ad Lorem Lorem quis voluptate officia consectetur pariatur ex in est duis. Mollit id esse est elit exercitation voluptate nostrud nisi laborum magna dolore dolore tempor in est consectetur.

Adipisicing voluptate ipsum culpa voluptate id aute laboris labore esse fugiat veniam ullamco occaecat do ut. Tempor et esse reprehenderit veniam proident ipsum irure sit ullamco et labore ea excepteur nulla labore ut. Ex aute minim quis tempor in eu id id irure ea nostrud dolor esse.

[[Top]](#top)

## <a name="Lists"></a>Lists

### Ordered List

1. Longan
2. Lychee
3. Excepteur ad cupidatat do elit laborum amet cillum reprehenderit consequat quis.
   Deserunt officia esse aliquip consectetur duis ut labore laborum commodo aliquip aliquip velit pariatur dolore.
4. Marionberry
5. Melon
   - Cantaloupe
   - Honeydew
   - Watermelon
6. Miracle fruit
7. Mulberry

### Unordered List

- Olive
- Orange
  - Blood orange
  - Clementine
- Papaya
- Ut aute ipsum occaecat nisi culpa Lorem id occaecat cupidatat id id magna laboris ad duis. Fugiat cillum dolore veniam nostrud proident sint consectetur eiusmod irure adipisicing.
- Passionfruit

[[Top]](#top)

## <a name="Horizontal"></a>Horizontal rule

In dolore velit aliquip labore mollit minim tempor veniam eu veniam ad in sint aliquip mollit mollit. Ex occaecat non deserunt elit laborum sunt tempor sint consequat culpa culpa qui sit. Irure ad commodo eu voluptate mollit cillum cupidatat veniam proident amet minim reprehenderit.

---

In laboris eiusmod reprehenderit aliquip sit proident occaecat. Non sit labore anim elit veniam Lorem minim commodo eiusmod irure do minim nisi. Dolor amet cillum excepteur consequat sint non sint.

[[Top]](#top)

## <a name="Table"></a>Table

Duis sunt ut pariatur reprehenderit mollit mollit magna dolore in pariatur nulla commodo sit dolor ad fugiat. Laboris amet ea occaecat duis eu enim exercitation deserunt ea laborum occaecat reprehenderit. Et incididunt dolor commodo consequat mollit nisi proident non pariatur in et incididunt id. Eu ut et Lorem ea ex magna minim ipsum ipsum do.

| Table Heading 1 | Table Heading 2 | Center align | Right align | Table Heading 5 |
| :-------------- | :-------------- | :----------: | ----------: | :-------------- |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |

Minim id consequat adipisicing cupidatat laborum culpa veniam non consectetur et duis pariatur reprehenderit eu ex consectetur. Sunt nisi qui eiusmod ut cillum laborum Lorem officia aliquip laboris ullamco nostrud laboris non irure laboris. Cillum dolore labore Lorem deserunt mollit voluptate esse incididunt ex dolor.

[[Top]](#top)

## <a name="Code"></a>Code

### Inline code

Ad amet irure est magna id mollit Lorem in do duis enim. Excepteur velit nisi magna ea pariatur pariatur ullamco fugiat deserunt sint non sint. Duis duis est `code in text` velit velit aute culpa ex quis pariatur pariatur laborum aute pariatur duis tempor sunt ad. Irure magna voluptate dolore consectetur consectetur irure esse. Anim magna `<strong>in culpa qui officia</strong>` dolor eiusmod esse amet aute cupidatat aliqua do id voluptate cupidatat reprehenderit amet labore deserunt.

### Highlighted

Et fugiat ad nisi amet magna labore do cillum fugiat occaecat cillum Lorem proident. In sint dolor ullamco ad do adipisicing amet id excepteur Lorem aliquip sit irure veniam laborum duis cillum. Aliqua occaecat minim cillum deserunt magna sunt laboris do do irure ea nostrud consequat ut voluptate ex.

```go
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hi there, I love %s!", r.URL.Path[1:])
}

func main() {
    http.HandleFunc("/", handler)
    http.ListenAndServe(":8080", nil)
}
```

Ex amet id ex aliquip id do laborum excepteur exercitation elit sint commodo occaecat nostrud est. Nostrud pariatur esse veniam laborum non sint magna sit laboris minim in id. Aliqua pariatur pariatur excepteur adipisicing irure culpa consequat commodo et ex id ad.

[[Top]](#top)

## <a name="Inline"></a>Inline elements

Sint ea anim ipsum ad commodo cupidatat do **exercitation** incididunt et minim ad labore sunt. Minim deserunt labore laboris velit nulla incididunt ipsum nulla. Ullamco ad laborum ea qui et anim in laboris exercitation tempor sit officia laborum reprehenderit culpa velit quis. **Consequat commodo** reprehenderit duis [irure](#!) esse esse exercitation minim enim Lorem dolore duis irure. Nisi Lorem reprehenderit ea amet excepteur dolor excepteur magna labore proident voluptate ipsum. Reprehenderit ex esse deserunt aliqua ea officia mollit Lorem nulla magna enim. Et ad ipsum labore enim ipsum **cupidatat consequat**. Commodo non ea cupidatat magna deserunt dolore ipsum velit nulla elit veniam nulla eiusmod proident officia.

![Super wide](https://images.unsplash.com/photo-1710170601257-242514895755?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

_Proident sit veniam in est proident officia adipisicing_ ea tempor cillum non cillum velit deserunt. Voluptate laborum incididunt sit consectetur Lorem irure incididunt voluptate nostrud. Commodo ut eiusmod tempor cupidatat esse enim minim ex anim consequat. Mollit sint culpa qui laboris quis consectetur ad sint esse. Amet anim anim minim ullamco et duis non irure. Sit tempor adipisicing ea laboris `culpa ex duis sint` anim aute reprehenderit id eu ea. Aute [excepteur proident](#!) Lorem minim adipisicing nostrud mollit ad ut voluptate do nulla esse occaecat aliqua sint anim.

![Not so big](https://placehold.co/600x400/000000/FFFFFF/png)

Incididunt in culpa cupidatat mollit cillum qui proident sit. In cillum aliquip incididunt voluptate magna amet cupidatat cillum pariatur sint aliqua est _enim **anim** voluptate_. Magna aliquip proident incididunt id duis pariatur eiusmod incididunt commodo culpa dolore sit. Culpa do nostrud elit ad exercitation anim pariatur non minim nisi **adipisicing sunt _officia_**. Do deserunt magna mollit Lorem commodo ipsum do cupidatat mollit enim ut elit veniam ea voluptate.

Reprehenderit non eu quis in ad elit esse qui aute id [incididunt](#!) dolore cillum. Esse laboris consequat dolor anim exercitation tempor aliqua deserunt velit magna laboris. Culpa culpa minim duis amet mollit do quis amet commodo nulla irure.

[[Top]](#top)

## MDX

```js
---
publishDate: 'Aug 02 2022'
title: 'Markdown elements demo post'
---
import Logo from "~/components/Logo.astro";

## MDX

<Logo />
```

<div style="border:1px dashed;padding: 10px 5px">
  <Logo />
</div>

## Astro Embed

### Youtube

<YouTube id="y9n6HkftavM" />

### Tweet

<Tweet id="https://twitter.com/Steve8708/status/1598713161339015173" />

### Vimeo

<Vimeo id="178430038" />

[[Top]](#top)
