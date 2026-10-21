# TalentRank AI

[![CI](https://github.com/Ahmed-Asif1/tensorslow-aicon2k26/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahmed-Asif1/tensorslow-aicon2k26/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Candidate evaluation and talent intelligence built by **Team TensorSlow** for the **AICON Hackathon 2026**. TalentRank AI brings candidate imports, role-specific scoring, side-by-side comparison, and profile-grounded chat into one workspace.

[Setup guide](SETUP_GUIDE.md) · [Architecture](EXPLAIN.md) · [Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

## Features

- **Role criteria:** Expand a job description into requirements, a weighted scoring rubric, and screening questions.
- **Candidate imports:** Paste profile text, upload a PDF resume, or submit a LinkedIn URL.
- **Ranked dashboard:** Search and filter candidates, inspect match scores, and re-evaluate profiles against an active rubric.
- **Candidate comparison:** Compare two candidates side by side at `/compare`.
- **Profile details and chat:** Review extracted strengths, gaps, and background, then ask questions grounded in profile context.
- **Talent scout:** Discover candidates through Apify when configured. Without an Apify credential, the scout uses bundled sample profiles; it still needs the database and evaluation pipeline.
- **Demo access and team page:** Explore the application through its demo flow and meet the team at `/about`.

AI-generated scores and recommendations require human review. They are not guarantees of accuracy or freedom from bias. URL import can produce a generated fallback profile when live retrieval fails; fallback results must not be treated as verified candidate facts. Use supplied resumes or pasted source text when evaluating actual candidates.

## Quick start

Requirements: **Node.js 22 or later**, npm, Git, and Docker with Compose for the included MongoDB Atlas Local service. Live AI features require configured provider access.

Run from the repository root:

```bash
git clone https://github.com/Ahmed-Asif1/tensorslow-aicon2k26.git
cd tensorslow-aicon2k26
npm ci
```

Copy the environment template using the command for your shell:

```powershell
# PowerShell
Copy-Item .env.example apps/web/.env.local
```

```bash
# Bash
cp .env.example apps/web/.env.local
```

Skip the copy if your local configuration already exists. Configure it privately using the [setup guide](SETUP_GUIDE.md), then start the local database and app:

```bash
docker compose up -d
npm run db:indexes
npm run db:seed
npm run dev
```

The database commands above use the local defaults unless you supply environment variables. For a custom database, follow the explicit environment-loading commands in the setup guide. Seeding writes demo records to the selected database.

Open [localhost:3000](http://localhost:3000), enter the demo, set role criteria, and import a candidate.

## Configuration

Keep local values in `apps/web/.env.local`, which Git ignores. The [.env.example](.env.example) template and [server environment schema](apps/web/src/lib/env.ts) describe the configuration.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI`, `MONGODB_DB` | Database connection and database name |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Authentication secret and application origin; use a unique secret outside local development |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Direct Gemini access for live AI features |
| `GOOGLE_GENERATIVE_AI_API_KEY_B` | Optional secondary Gemini credential |
| `AI_GATEWAY_API_KEY`, `OPENROUTER_API_KEY` | Optional provider routes; support varies by feature |
| `CHAT_MODEL_ID` | Chat model override; availability depends on the configured provider |
| `APIFY_API_TOKEN` | Optional live scouting; leave empty to use the sample-profile path |
| `NEXT_PUBLIC_APP_URL` | Public application URL |

Production builds, hosting, and live integrations require their own verification. Configure the production database, authentication origin, provider access, and network controls before deployment. Never put private credentials in a `NEXT_PUBLIC_*` variable or commit a live environment file.

## Development and checks

These scripts are defined in the root [package.json](package.json):

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the web development server |
| `npm run typecheck` | Check TypeScript |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest |
| `npm run evals` | Run the extraction evaluation script |
| `npm run build` | Build the web application |
| `npm run test:e2e` | Run Playwright tests |

The credential-cleanup validation recorded on **21 October 2026** passed **60 unit tests across eight suites** and a TypeScript check. Those tests ran with environment-file loading and network requests disabled. This is a historical result, not a claim that every current CI gate, live integration, or production deployment has passed. See [GitHub Actions](https://github.com/Ahmed-Asif1/tensorslow-aicon2k26/actions) for current runs.

## Repository layout

```text
apps/web/
  src/app/             Routes, dashboard, comparison, and API handlers
  src/components/      Shared UI and chat components
  src/lib/             Authentication, database, AI, scouting, and tests
  src/scripts/         Database setup, seed, and evaluation scripts
apps/api/              Optional Python sidecar scaffold
docker-compose.yml     Local MongoDB Atlas service
```

The main application uses Next.js, React, TypeScript, Tailwind CSS, the AI SDK, Better Auth, and MongoDB. Exact dependency versions are recorded in the workspace manifests and lockfile.

`claude-ui/` and `claude-landing-ui/` are ignored local design-reference folders. They are not application dependencies and are excluded from the current tracked source. Earlier commits may still contain them.

## GitHub workflow

Use feature branches and pull requests into `main`, following [CONTRIBUTING.md](CONTRIBUTING.md). Review the staged diff and exclude private configuration before committing. The repository's configured review and CI requirements govern merging.

For setup help, see [SETUP_GUIDE.md](SETUP_GUIDE.md). Report reproducible bugs through [GitHub Issues](https://github.com/Ahmed-Asif1/tensorslow-aicon2k26/issues); follow [SECURITY.md](SECURITY.md) for private vulnerability reports.

## 👥 Team & Credits

**TalentRank AI** is developed and submitted for the **AICON Hackathon 2026** by:

### 🏆 Team **TensorSlow**
* **Muhammad Ahmed** — **Architecture, Core Engine & Full-Stack Lead**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/muhammad-ahmed-asif-5b0842318)
* **Mahad Ehtesham Hashmi** — **LinkedIn Scraping, Extraction & Data Pipelines**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/mahad-hashmi/)
* **Abdullah Anwar** — **Deployment, Features, Better Auth & Database**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/abdullah-anwar-cs/)
* **Muhammad Yahya Shahzad** — **UI/UX Design System & Frontend Architecture**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/myahyashahzad/)
* **Muhammad Hassan** — **Vector Embeddings, RAG & Semantic Search**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/muhammad-hassan-035a78375)

- **GitHub Repository:** [Ahmed-Asif1/tensorslow-aicon2k26](https://github.com/Ahmed-Asif1/tensorslow-aicon2k26)
- **Interactive About Page:** Accessible from the top navigation menu at [`/about`](http://localhost:3000/about)
- **License:** [MIT](LICENSE)
