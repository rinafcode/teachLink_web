# Contributing to TeachLink Frontend

Thanks for contributing to TeachLink.

## Branching & workflow
- **Do not push directly** to protected branches (`main`, `develop`).
- Create a feature branch from `develop` (preferred) or `main`:
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `chore/<short-description>`

## Assignment required
Before opening a PR, ensure the issue is assigned to you.

## Pull request requirements (quality gates)
Your PR will be blocked from merging unless it meets the following:

1. **CI must pass**
   - Required checks: `type-check`, `lint`, `build`, `test` (GitHub Actions: **Frontend CI**)

2. **Approvals required**
   - Minimum **1–2 approvals** (as configured in branch protection rules).

3. **Branch must be up to date**
   - Update your branch with the target branch before merge (no stale merge).

4. **Conversations resolved**
   - All review conversations must be resolved before merge.

5. **Issue must be referenced**
   - PR description must reference a GitHub issue and include one of:
     - `Close #<issue-number>` / `Closes #<issue-number>` / `Fixes #<issue-number>`

## Local checks (run before pushing)
- `npm run type-check`
- `npm run lint`
- `npm run test`
- `npm run build`

## PR description format
Use the PR template (auto-applied). Ensure it includes:
- Summary of changes
- Testing notes
- `Close #<issue-number>`

## Code standards
- Keep changes small and focused.
- No console errors.
- Use `lucide-react` icons for UI.
- Keep components accessible and responsive.

## Security
Do not commit secrets. Use `.env.local` for local environment variables.
