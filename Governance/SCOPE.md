# TeachLink Web Project Scope Statement

## Purpose

This document defines what TeachLink Web is in scope to do, where the current
boundaries lie, and how those boundaries can change. It gives contributors and
maintainers a single reference for deciding whether a proposed change belongs in
this project, in another one of the platform's repositories, or outside the
project entirely.

## What Is In Scope

TeachLink Web is the web client for the TeachLink platform. In scope are the
user-facing web experience, the frontend engineering that supports it, and the
governance of this repository:

- **Knowledge sharing.** Publishing, editing, and discovering learning content —
  tutorials, threads, analyses, and community posts.
- **Learning activities.** Completing and authoring tasks, competitions, quizzes,
  and learning games, including timed or proctored assessments where surfaced in
  the web client.
- **Reputation and earnings.** Surfacing reputation, rewards, and earnings that
  result from contribution, including presenting on-chain settlement state that
  the platform's backend and Stellar/Soroban contract layer produce.
- **Core platform workflows.** Sign-up and sign-in, email verification,
  social OAuth (Discord, GitHub, Google), profile and settings, notifications,
  search and discovery, and offline-aware read paths.
- **Cross-cutting engineering requirements.** Accessibility (WCAG 2.1 AA),
  internationalization, performance budgets, error tracking, dependency supply
  chain security (the `security-audit` CI gate), and reliable realtime delivery
  via GraphQL/WebSocket subscriptions.
- **Governance documentation.** The `Governance/` folder, which holds the
  documents, roles, policies, and processes that govern how this repository is
  run.

## Current Boundaries

The scope below reflects how the project is structured today.

### Repository boundary

This repository is the **web frontend only**. The TeachLink platform spans four
repositories — `teachLink_web` (this repo), `teachLink_backend` (core API),
`teachLink_contract` (Soroban on-chain rewards/escrow), and `teachLink_mobile`
(the mobile app). Work that belongs to the backend, the contract, or the mobile
app is out of scope here and must be proposed in the owning repository.

### Platform boundary

The web app is an **API client** of `teachLink_backend`, reached through
`NEXT_PUBLIC_API_URL`. Data models, business rules, persistence, and
authorization are owned by the backend; the web client renders and interacts with
them. The frontend does not reimplement backend behavior or bypass the API.

### On-chain boundary

The web client does **not** talk to the Stellar/Soroban chain directly. On-chain
actions (rewards, tipping, escrow) are mediated by the backend and the contract;
the frontend only presents the state and actions the backend exposes. Chain-level
behavior is out of scope for this repository.

### Delivery boundary

The web client ships through the normal release process defined by the project's
release governance, with emergency change handled by the hotfix process in
`Governance/processes/HOTFIX.md`. Production deployment and infrastructure live
in the repository's deployment documentation and are not in scope for feature
work.

## How Scope Changes Are Proposed

- A change that sits clearly inside the boundaries above proceeds through the
  normal issue and pull request process, referencing the issue with a closing
  keyword.
- A change that pushes against a boundary must say so explicitly, name the
  boundary it affects, and explain why moving that boundary serves users. It is
  proposed in a pull request that touches only the `Governance/` folder.
- Wholesale changes of the project's purpose or repository set require a
  maintenance decision and are announced to contributors through the
  repository's normal communication channels; they cannot ride along on feature
  work.
- Small, reversible boundary clarifications can be folded into the change that
  motivates them, as long as the clarification and the motivation are documented
  in the same pull request.

## Ownership and Review

- Maintainers own this scope statement and review it when a boundary question is
  raised or material scope change is proposed.
- Changes to this document are proposed in a pull request that touches only the
  `Governance/` folder and must be approved before adoption.
- In a dispute, the maintainers' reading of this statement governs, and the
  decision and its reasoning are recorded on the issue or pull request.

## Success

This document succeeds when a contributor can determine whether a proposed change
is in scope without asking, when scope changes are deliberate and rarely needed,
and when work that belongs to another repository or layer is routed there instead
of accumulating here.