# Local setup — TalentRank AI

The project repository is [Ahmed-Asif1/tensorslow-aicon2k26](https://github.com/Ahmed-Asif1/tensorslow-aicon2k26). Start with the [README](README.md) for features and repository structure.

## Prerequisites

- Node.js **22 or later**, as required by the root package manifest.
- npm and Git.
- Docker with Compose for the included MongoDB Atlas Local service.
- Provider access for live AI evaluation. Live scouting additionally requires Apify configuration.

## 1. Install dependencies

From the cloned repository root:

```bash
npm ci
```

This uses the committed lockfile. It installs dependencies and may run package installation scripts.

## 2. Configure the web environment

If `apps/web/.env.local` does not already exist, copy [.env.example](.env.example):

```powershell
# PowerShell
Copy-Item .env.example apps/web/.env.local
```

```bash
# Bash
cp .env.example apps/web/.env.local
```

Edit your local copy privately:

- Set `MONGODB_URI` and `MONGODB_DB` if you are not using the local defaults.
- Use `http://localhost:3000` for the local `BETTER_AUTH_URL`.
- Configure `GOOGLE_GENERATIVE_AI_API_KEY` for direct Gemini features. Optional provider routes do not necessarily cover every feature.
- Leave `APIFY_API_TOKEN` empty to use bundled scout samples, or configure your own credential for live scouting.
- Use a unique `BETTER_AUTH_SECRET` for any shared or deployed instance. The built-in development fallback is not a production secret.

Never commit this file or copy credential values into issues, logs, or documentation. The [environment schema](apps/web/src/lib/env.ts) and [model registry](apps/web/src/lib/ai/models.ts) define current behavior.

## 3. Start the database

```bash
docker compose up -d
docker compose ps
```

The Compose service exposes MongoDB on port 27017 and stores its data in named Docker volumes.

For the default local database, run from the repository root:

```bash
npm run db:indexes
npm run db:seed
```

Index creation and seeding modify the selected database. Seeding is optional and supplies demo data.

The index and seed scripts do not automatically load the web app's `.env.local`. For a custom database, explicitly load that file instead:

```bash
cd apps/web
node --env-file=.env.local --import tsx src/scripts/create-indexes.ts
node --env-file=.env.local --import tsx src/scripts/seed.ts
cd ../..
```

Check that your local configuration selects the intended database before running these commands.

## 4. Start the app

From the repository root:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Use demo access, configure job criteria, and import candidate text or a resume. Candidate details provide profile chat and a comparison entry point.

Live URL retrieval and AI calls depend on external services. URL import may generate a fallback profile, and scouting may use bundled samples. These fallbacks demonstrate the workflow; they do not verify the identity or experience of a real candidate.

## 5. Verify changes

```bash
npm run typecheck
npm run lint
npm run test
npm run evals
npm run build
```

These are commands to run, not a promise of passing results. The README records the earlier credential-cleanup checks; current results appear in [GitHub Actions](https://github.com/Ahmed-Asif1/tensorslow-aicon2k26/actions).

## Stop and resume

Stop the development server with **Ctrl+C**. To stop the local database:

```bash
docker compose down
```

This leaves the named database volumes intact. To resume, run `docker compose up -d` and `npm run dev` from the repository root.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| MongoDB connection fails | Confirm the container is healthy, port 27017 is available, and the selected URI is correct. |
| AI evaluation fails or hits quota | Check provider access and quota privately; use a model supported by that provider. |
| Live scouting is unavailable | Check Apify configuration; an empty credential uses bundled samples. |
| URL import does not retrieve real content | Import supplied resume text or a PDF and inspect the extracted content. |
| Custom database scripts use the wrong database | Use the explicit `--env-file` commands above. |

## Publishing and deployment

Contribute through GitHub feature branches and pull requests into `main`; see [CONTRIBUTING.md](CONTRIBUTING.md). Local design references in `claude-ui/` and `claude-landing-ui/` stay ignored.

For deployment, use `apps/web` as the web workspace and configure the hosted database, application origins, unique authentication secret, and required providers in the hosting environment. Review database network access and verify authentication, imports, scoring, and chat in that environment. Local tests alone do not establish production readiness.

## Team and license

Built by **Team TensorSlow** for **AICON Hackathon 2026**:

- **Muhammad Ahmed** — Architecture, Core Engine & Full-Stack Lead
- **Mahad Ehtesham Hashmi** — LinkedIn Scraping, Extraction & Data Pipelines
- **Abdullah Anwar** — Deployment, Features, Better Auth & Database
- **Muhammad Yahya Shahzad** — UI/UX Design System & Frontend Architecture
- **Muhammad Hassan** — Vector Embeddings, RAG & Semantic Search

Licensed under [MIT](LICENSE). Full credits and profile links are in the [README](README.md).
