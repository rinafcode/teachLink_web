# Branch protection (repository settings)

These are **GitHub repository settings** (not enforced by code). Configure them under:
**Settings → Branches → Branch protection rules**.

## Protected branches
Create rules for:
- `main`
- `develop`

## Required settings
Enable the following options:

### блок direct pushes
- ✅ **Restrict who can push to matching branches** (recommended)
- ✅ **Do not allow force pushes**
- ✅ **Do not allow deletions**

### Require PRs
- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: at least **1** (or **2** if desired)
- ✅ **Dismiss stale approvals when new commits are pushed**
- ✅ **Require conversation resolution before merging**

### Require checks
- ✅ **Require status checks to pass before merging**
- ✅ Select required checks from `Frontend CI`:
  - `type-check`
  - `lint`
  - `build`
  - `test`

### Keep branch up to date
- ✅ **Require branches to be up to date before merging**

## PR must reference an issue
GitHub does not have a single built-in "require issue link" toggle for all repos.
Recommended options:

1. **Process enforcement (lightweight)**
   - Use `.github/pull_request_template.md` and require `Closes #<issue>` in the PR.

2. **Stronger enforcement (recommended)**
   - Add a dedicated GitHub Action that fails if the PR body does not contain `Closes #<number>`.
   - If you want this, we can add a small workflow using `actions/github-script`.

## Notes
- Repository admins can optionally be included or excluded from these requirements.
- Configure the same rule set for both `main` and `develop` to avoid bypass paths.
