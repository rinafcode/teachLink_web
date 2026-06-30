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

   - Required checks: `type-check`, `lint`, `build`, `test`, `security-audit` (GitHub Actions: **Branch Protection**)

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

- `pnpm run type-check`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`
- `pnpm audit --audit-level=high`

## Git hooks

### Pre-push (`.husky/pre-push`)

Before a push is sent to the remote, the pre-push hook runs automatically:

1. **Git LFS** — validates LFS-tracked files (`git lfs pre-push`)
2. **Type-check** — `pnpm run type-check` (`tsc --noEmit`)
3. **Tests** — `pnpm run test` (`vitest run`)

If type-check or tests fail, the push is **blocked** and the hook prints which check failed. Fix the reported errors and push again.

The hook ensures `pnpm` is on `PATH` (common install locations and `$PNPM_HOME`). If `pnpm` still cannot be found, the push is blocked with a clear message.

`lint` and `build` are not run by this hook; run them locally or rely on CI before opening a PR.

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

## ESLint Suppressions Policy

To maintain type safety and code quality:
1. **No blanket `/* eslint-disable */` comments**: Do not disable rules project-wide or file-wide to bypass type errors or unused variables.
2. **Intentional suppressions**:
   - For unused variables that are intentionally kept (e.g. function signatures, placeholders), prefix the variable name with an underscore (e.g., `_unusedVar`).
   - For intentional type escapes, use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` accompanied by a comment explaining why `any` is necessary.
   - For legacy files with high debt, add them to the `overrides` section of `eslint.config.js` and `.eslintrc.json` rather than inline comments.

## Security

Do not commit secrets. Use `.env.local` for local environment variables.

### Dependency vulnerability audit

CI runs a `security-audit` job on every pull request to `main` and `develop`. It executes:

```bash
pnpm audit --audit-level=high
```

**Policy:**

- **High** and **critical** severity vulnerabilities **fail** the pipeline and block merge.
- **Low** and **moderate** findings are reported but do not block merge.
- The full JSON audit report is uploaded as a CI artifact (`dependency-audit-report`) on every run.

Run the same check locally before pushing:

```bash
pnpm audit --audit-level=high
```

### Triaging and suppressing accepted risks

If a high or critical CVE cannot be fixed immediately (no patch available, breaking upgrade, or false positive), you may suppress it after maintainer review:

1. Confirm the risk is understood and document the rationale in the PR.
2. Add the CVE or GHSA identifier to `pnpm.auditConfig` in `package.json`:

```json
"pnpm": {
  "auditConfig": {
    "ignoreCves": ["CVE-YYYY-NNNNN"],
    "ignoreGhsas": ["GHSA-xxxx-xxxx-xxxx"]
  }
}
```

3. Open a follow-up issue to remove the suppression when a fix is available.

Suppressions require explicit PR approval — do not add ignored CVEs without maintainer sign-off.

### Automated dependency updates

[Dependabot](https://docs.github.com/en/code-security/dependabot) (`.github/dependabot.yml`) opens weekly PRs for npm dependency updates. Review and merge these promptly to keep the dependency tree current.