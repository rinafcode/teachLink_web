# TeachLink — Web

The web client for **TeachLink**, a platform where technocrats and learners **share, analyze, and monetize knowledge**.

- **Knowledge sharers & analysts** publish tutorials, threads, and analyses and earn from their contributions.
- **Learners/students** earn by completing tasks, competitions, quizzes, and learning games.
- Reputation is gamified, and rewards settle on-chain through the platform's Stellar/Soroban layer.

This repository is the **Next.js frontend**. It is one of four repositories that make up the platform:

| Repo | Role | Stack |
| --- | --- | --- |
| **[teachLink_web](https://github.com/rinafcode/teachLink_web)** (this repo) | Web client | Next.js 15 (App Router), React 18, Tailwind |
| [teachLink_backend](https://github.com/rinafcode/teachLink_backend) | Core API | NestJS, PostgreSQL, Redis/BullMQ |
| [teachLink_contract](https://github.com/rinafcode/teachLink_contract) | On-chain rewards/escrow | Rust, Soroban (Stellar) |
| [teachLink_mobile](https://github.com/rinafcode/teachLink_mobile) | Mobile app | Expo, React Native |

> The web app is an API client of `teachLink_backend` (via `NEXT_PUBLIC_API_URL`). On-chain actions (rewards, tipping, escrow) are mediated by the backend and the Soroban contract; the frontend does not talk to the chain directly.

---

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, `next-themes` |
| Content | TipTap / Monaco editor, React Markdown |
| Data / realtime | REST (backend API), GraphQL & WebSocket subscriptions |
| i18n | `i18next` / `react-i18next` |
| Testing | Jest + React Testing Library, Playwright (E2E) |
| Tooling | ESLint, Prettier, pnpm |

---

## Getting started

**Prerequisites:** Node.js ≥ 20 and [pnpm](https://pnpm.io) ≥ 10 (the repo pins `pnpm@10.33.2` via `packageManager`).

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local — at minimum set NEXT_PUBLIC_API_URL to your teachLink_backend URL

# 3. Run the dev server
pnpm dev            # http://localhost:3000
```

### Common scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm test` | Unit tests (Jest) |
| `pnpm test:e2e` | End-to-end tests (Playwright) |
| `pnpm lint` / `pnpm lint:fix` | Lint |
| `pnpm type-check` | TypeScript check |
| `pnpm format` | Prettier |

### Key environment variables

Set these in `.env.local` (see `.env.example` for the full list):

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the TeachLink backend API |
| `NEXT_PUBLIC_AUTH_REFRESH_ENDPOINT` | Token-refresh endpoint |
| `NEXT_PUBLIC_GRAPHQL_WS_URL` / `NEXT_PUBLIC_COLLAB_WS_URL` | GraphQL / collaboration WebSocket URLs |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_IMGIX_DOMAIN` | Image/CDN hosts |
| `NEXT_PUBLIC_FEATURE_TIPPING`, `NEXT_PUBLIC_FEATURE_OFFLINE_MODE`, `NEXT_PUBLIC_FEATURE_DAO_GOVERNANCE`, … | Feature flags |

---

## Project structure

```
src/
  app/           Next.js App Router routes, layouts, and pages
  components/    Reusable UI components
  features/      Feature-scoped modules
  hooks/         React hooks
  services/      API clients and integrations
  store/         Client state
  lib/ utils/    Helpers and utilities
  schemas/       Zod / validation schemas
  locales/       i18n translation resources
  middleware.ts  Next.js middleware
__tests__/       Test suites
docs/            Project documentation (see below)
```

## Documentation

Guides and references live in [`docs/`](docs/) — including accessibility, deployment,
offline mode, redirect management, GraphQL subscriptions, security, and runbooks.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the workflow notes in
[`docs/BRANCH_AND_PR_GUIDE.md`](docs/BRANCH_AND_PR_GUIDE.md).

## License

See the repository's license file.
