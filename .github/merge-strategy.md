# Merge Strategy Policy

This document defines the merge strategy and conventions for the TeachLink Web repository.

## GitHub Repository Settings

Configure merge settings under: **Settings → General → Pull Requests**

### Merge Method

**Primary merge method: Squash and merge**

- ✅ **Allow squash merging**
- ❌ **Allow merge commits** (disabled)
- ❌ **Allow rebase merging** (disabled)

### Rationale for Squash Merge

- **Cleaner history**: Each PR becomes a single commit in the target branch
- **Easier bisecting**: Commits are atomic and self-contained
- **Consistent messages**: PR title/description become the commit message
- **Reduced noise**: WIP commits, typo fixes, and rebases are hidden

### Update Strategy

- ✅ **Automatically delete head branches** after merge
- ✅ **Allow auto-merge** (optional, with admin approval)

## Commit Message Conventions

### PR Title Format

PR titles should follow conventional commits format:

```
<type>(<scope>): <subject>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples:**
- `feat(auth): add OAuth2 login support`
- `fix(profile): resolve avatar upload failure`
- `refactor(api): consolidate user endpoints`

### Squashed Commit Message

When squashing, GitHub uses the PR title as the commit message. Ensure:
- PR title is descriptive and follows the format above
- PR description provides context (this becomes the commit body)
- Include issue reference in PR description (e.g., `Closes #123`)

## Merge Workflow

### For Feature Branches

1. **From `develop` to `main`**
   - Squash merge
   - Requires PR approval (1-2 reviewers)
   - Requires CI checks to pass
   - Must be up-to-date with `main`

2. **From feature branch to `develop`**
   - Squash merge
   - Requires PR approval (1 reviewer)
   - Requires CI checks to pass
   - Must be up-to-date with `develop`

### For Hotfix Branches

1. **Hotfix workflow**
   - Create branch from `main`: `hotfix/<description>`
   - After fix, squash merge to `main`
   - Then squash merge to `develop` to propagate fix

### For Release Branches

1. **Release workflow**
   - Create branch from `develop`: `release/<version>`
   - After testing, squash merge to `main`
   - Then squash merge back to `develop`

## Exceptions

### When to Use Merge Commits

In rare cases, merge commits may be justified:
- **Feature flags**: When merging a large feature that should be toggled on/off
- **Historical preservation**: When commit history is valuable for review
- **Team decision**: Maintainers may approve merge commits for specific PRs

To allow a merge commit (temporarily):
1. Comment on the PR requesting merge commit method
2. Maintainer changes merge method in GitHub UI
3. After merge, restore default to squash merge

### Security Fixes

For urgent security fixes:
- Maintainer may bypass normal PR process
- Direct push to protected branch with admin override
- Document in PR with `fix(security):` prefix

## Branch Cleanup

- **Auto-delete**: Head branches are automatically deleted after merge
- **Manual cleanup**: Delete stale feature branches older than 30 days
- **Protected branches**: Never delete `main` or `develop`

## Integration with Branch Protection

This merge strategy works with the branch protection rules defined in `.github/branch-protection.md`:

- Squash merge + branch up-to-date = clean linear history
- Required approvals + CI checks = quality assurance
- Issue reference + conversation resolution = traceability

## Verification

To verify merge settings are correct:

```bash
# Check recent commits on main - should be one per PR
git log --oneline main | head -20

# Verify no merge commits
git log --merges main
# Should return empty (no output)
```

## Enforcement

- **GitHub settings**: Configure merge method in repository settings
- **PR template**: Reminds contributors of commit message format
- **Pre-commit hooks**: Validate commit message format (optional, can be added)
- **CI**: No automated enforcement of merge method (enforced by GitHub settings)
