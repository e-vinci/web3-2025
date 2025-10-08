# Web 3 course repo

This repository contains the material and exercises for the Web3 course of Haute Ecole Leonard de Vinci.

It is based on [Astrowind template](https://astro.build/themes/details/astrowind/),and available online at https://e-vinci.github.io/web3-2025

## Slides

Slides can be edited in .md like the rest of the course, with a small frontmatter.

Things to know:

- Triple "-" (---) means "next slide"
- Small front matter on top

Generate a pptx (options for pdf, html exists too):

```bash
npx @marp-team/marp-cli@latest src/slides/lesson-1-theory.md --pptx --o src/slides/lesson-1-theory.pptx
```

If you want to generate all the slidedecks, you can use this command (---parallel 1 might not be needed on your machine)

```bash
npx @marp-team/marp-cli@latest --input-dir src/slides/  --pptx --parallel 1
```

## Project structure

Inside **AstroWind** template, you'll see the following folders and files:

```
/
├── public/
│   ├── _headers
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── favicons/
│   │   ├── images/
│   │   └── styles/
│   │       └── tailwind.css
│   ├── components/
│   │   ├── blog/
│   │   ├── common/
│   │   ├── ui/
│   │   ├── widgets/
│   │   │   ├── Header.astro
│   │   │   └── ...
│   │   ├── CustomStyles.astro
│   │   ├── Favicons.astro
│   │   └── Logo.astro
│   ├── content/
│   │   ├── post/
│   │   │   ├── post-slug-1.md
│   │   │   ├── post-slug-2.mdx
│   │   │   └── ...
│   │   └-- config.ts
│   ├── layouts/
│   │   ├── Layout.astro
│   │   ├── MarkdownLayout.astro
│   │   └── PageLayout.astro
│   ├── pages/
│   │   ├── [...blog]/
│   │   │   ├── [category]/
│   │   │   ├── [tag]/
│   │   │   ├── [...page].astro
│   │   │   └── index.astro
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├-- rss.xml.ts
│   │   └── ...
│   ├── utils/
│   ├── config.yaml
│   └── navigation.js
├── package.json
├── astro.config.ts
└── ...
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory if they do not require any transformation or in the `assets/` directory if they are imported directly.

## Course Lessons

Course lessons are found at `src/data/post/course-lessons`.
All .md files under `src/data/post` are automatically available as blog posts thanks to:

- the various pages components under `src/pages/[...blog]`
- The `postCollection` defined in `src/content/config.ts`

The course lessons are :

- Lesson 1 : Refresh
- Lesson 2 : Deploy and persistence (Prisma, Postgresql, Render)
- Lesson 3 : Navigation ( Router, Tanstack query, Component lib)
- Lesson 4 : Advanced State
- Lesson 5 : GraphQL
- Lesson 6 : Unhappy path ( Auth, UAM, Error management, Validation)
- Lesson 7 : Async ( Long running tasks, Websockets, Pubsub)

## Development Setup

### Local Environment Setup

After cloning the repository, run the following command to set up your local development environment:

```bash
npm run prepare
```

This command will:

- Install git hooks for code quality enforcement
- Set up pre-commit hooks for linting and formatting
- Configure any necessary development tools

### Development Container

This project includes a dev container configuration with pre-installed tools:

- Node.js, npm, and eslint
- TypeScript compiler (tsc)
- GitHub CLI (gh)
- Git (built from source)

When using the dev container, the environment setup is handled automatically.

## Commands

All commands are run from the root of the project, from a terminal:

| Command             | Action                                             |
| :------------------ | :------------------------------------------------- |
| `npm install`       | Installs dependencies                              |
| `npm run dev`       | Starts local dev server at `localhost:4321`        |
| `npm run build`     | Build your production site to `./dist/`            |
| `npm run preview`   | Preview your build locally, before deploying       |
| `npm run check`     | Check your project for errors                      |
| `npm run fix`       | Run Eslint and format codes with Prettier          |
| `npm run astro ...` | Run CLI commands like `astro add`, `astro preview` |

<br>

## Configuration

Astro configuration file: `./astro.config.ts`
Secondary configuration file: `./src/config.yaml`

### Customize Design

To customize Font families, Colors or more Elements refer to the following files:

- `src/components/CustomStyles.astro`
- `src/assets/styles/tailwind.css`

## Deploy

### Deploy to production (manual)

You can create an optimized production build with:

```shell
npm run build
```

Now, your website is ready to be deployed. All generated files are located at
`dist` folder, which you can deploy the folder to any hosting service you
prefer.

<br>

# License

**AstroWind** is licensed under the MIT license — see the [LICENSE](./LICENSE.md) file for details.
