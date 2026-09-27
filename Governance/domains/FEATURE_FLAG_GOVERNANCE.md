# Feature Flag Governance Policy

## Purpose

This policy defines how feature flags in TeachLink Web are named, owned, retired,
and reviewed. It keeps the flag surface small and accountable: every flag has a
name that says what it gates, an owning team, a removal deadline, and a periodic
review that actually removes the ones that are done.

## Scope

This policy covers every toggle that changes behaviour at runtime or build time
in the web client, including:

- Build-time environment flags registered in the `FLAGS` map in
  `src/lib/featureFlags.ts` and read through `isEnabled()` / `getAllFlags()`.
- Runtime flags stored in `src/lib/feature-flags/store.ts` and managed through
  the admin API under `src/app/api/admin/feature-flags/`.
- Percentage and canary rollouts, including the tip canary in
  `src/lib/featureFlags/tipCanary.ts` (see
  [TIP_CANARY_RELEASE.md](../../docs/TIP_CANARY_RELEASE.md)).
- Kill switches used to disable a feature during an incident, which are covered by
  the [Hotfix Process](../processes/HOTFIX.md) as well as this policy.

It does **not** cover fixed configuration that is not a toggle (for example
`NEXT_PUBLIC_API_URL`), and it does not cover flags owned by `teachLink_backend`
or `teachLink_contract`; those are governed in their own repositories.

## Flag Naming

### Runtime flags

- A runtime flag id is `flag_` followed by a lowercase `snake_case` description of
  the behaviour it controls. The `flag_` prefix is reserved for flags and must not
  be used for other identifiers.
- Good: `flag_new_dashboard`, `flag_ai_tutor`, `flag_video_speed`.
- Bad: `NewDashboard` (no prefix, wrong casing), `new-dashboard` (hyphens),
  `dashboardFlag` (suffix instead of prefix), `flag_v2_dashboard` (version in the
  name), `flag_temp_2` (meaningless), `flag_johns_experiment` (person in the name).
- Do not encode rollback state in the id. A flag keeps the same id from creation to
  deletion; its rollout state lives in `enabled`, `strategy`, `percentage`, and
  `rules`, not in the name.
- `name` is the human-readable label shown in the admin UI; it is a display string,
  not an identifier, and changes to it do not change the id.

### Build-time environment flags

- The key in the `FLAGS` map is `SCREAMING_SNAKE_CASE`, and the environment
  variable it points at is `NEXT_PUBLIC_FEATURE_<KEY>`. The existing entries follow
  this exactly.
- Good: `OFFLINE_MODE` → `NEXT_PUBLIC_FEATURE_OFFLINE_MODE`;
  `DAO_GOVERNANCE` → `NEXT_PUBLIC_FEATURE_DAO_GOVERNANCE`.
- Bad: `NEXT_PUBLIC_FLAG_OFFLINE_MODE` (wrong prefix family),
  `NEXT_PUBLIC_FEATURE_offlineMode` (wrong casing),
  `NEXT_PUBLIC_FEATURE_OFFLINE` (name drifts from the key it is registered under).
- Use the `NEXT_PUBLIC_` prefix only when the value must reach the browser. A
  server-only flag must not be named `NEXT_PUBLIC_*`, because that prefix exposes
  the value to every client.
- `isEnabled()` treats an unset variable as enabled. A flag that must default to
  **off** when unset (typically a kill switch) belongs in the runtime store, not in
  the env map, or it must be explicitly checked before it is relied on.

### Percentage and canary variables

- Rollout percentages use the `<SCOPE>_CANARY_PERCENT` suffix, with the public
  mirror `NEXT_PUBLIC_<SCOPE>_CANARY_PERCENT` where the browser needs it, as
  `TIP_RECEIVING_CANARY_PERCENT` does. The value is an integer from 0 to 100, and
  `0` means "off".

### Tags

- `tags` are lowercase, short, and drawn from the vocabulary already in use rather
  than invented per flag: the current set includes `ui`, `dashboard`, `ai`, `beta`,
  `video`, and `ux`.
- A flag must carry a lifecycle tag (`beta`, `rollout`, `experiment`) and at least
  one area tag so the monthly review can group and search flags.

## Ownership

- Every flag has exactly one owning team: the team that ships it and is
  accountable for retiring it. Ownership is declared on the issue and pull request
  that introduces the flag, and recorded by naming the owning team in the flag's
  `description`.
- The `createdBy` field records the acting actor from the `x-admin-user` header, and
  every change is recorded in `auditLog` with its `actor`, `action`, and
  `timestamp`. Those entries are the audit trail for a flag and are readable through
  `GET /api/admin/feature-flags/audit`.
- Ownership is transferred explicitly, never by silence: the receiving team comments
  on the flag's tracking issue, the `description` is updated to the new team, and the
  change is visible as an `updated` audit entry.
- A flag with no identifiable owner is a governance defect. The monthly review
  assigns it back to the team that last modified it, or to the maintainers if that
  team no longer exists.

Responsibilities are split as follows:

- **Accountable:** the owning team, for the flag's rollout, its deadline, and its
  removal.
- **Responsible:** the author who introduced the flag, for wiring it up, testing
  both states, and opening the cleanup pull request on time.
- **Consulted:** maintainers, plus the security or performance owners when the flag
  guards a security, privacy, or performance-sensitive path.
- **Informed:** contributors, through the review artefact and the tracking issue.

Introducing a new flag *system* or provider is a structural change and requires an
RFC under the [RFC Process](../processes/RFC_PROCESS.md). Registering one flag
inside an existing system does not.

## Cleanup Deadline

Feature flags are temporary. A flag that outlives its purpose is dead code with a
switch attached, so the deadline is part of the flag rather than a follow-up.

- Every flag has a maximum lifetime of **90 days** from `createdAt`.
- A rollout flag (`strategy: 'all'`) has **30 days** from the date it reaches 100%
  of traffic to remove the winning path and the flag.
- The deadline is recorded when the flag is created. The `FeatureFlag` record has no
  deadline field, so it is written on the tracking issue as `createdAt` + the
  applicable window, and the monthly review derives it from `createdAt` in
  `GET /api/admin/feature-flags`.
- Removal is triggered when the rollout is complete and stable, when the experiment
  has produced a decision, when the work is abandoned, or when the deadline passes —
  whichever comes first.

Removing a flag means removing the code that branches on it, not just flipping it
off:

- The consumer code (the hook, provider, or component path) is deleted, and the
  tests that covered the dead branch are removed or updated — for example
  `src/hooks/__tests__/useFeatureFlag.test.tsx`.
- The runtime record is deleted with `DELETE /api/admin/feature-flags/[id]`, which
  writes a `deleted` audit entry. Deleting the record while the branch code remains
  is not cleanup.
- A build-time flag is removed from the `FLAGS` map in `src/lib/featureFlags.ts` and
  from `.env.example`, along with its row in the environment table in `README.md`.
- Cleanup changes are ordinary pull requests and must pass the project's quality
  gates (`type-check`, `lint`, `build`, `test`, `security-audit`).
- When a flag is overdue, the owning team must disable it (`enabled: false` via
  `PUT /api/admin/feature-flags/[id]`) before the removal PR lands, so an unmanaged
  flag cannot keep a risky path live. Removal still follows; disabling is a
  stopgap, not the deadline.

## Review Cadence

- Maintainers review all flags **monthly**, in the first full week of the month, and
  sooner whenever a flag is reported as unmanaged.
- The review reads the current flag list from `GET /api/admin/feature-flags`, which
  is sorted by `updatedAt`, and uses `GET /api/admin/feature-flags/audit?flagId=<id>`
  for the history of anything that looks untouched.
- The review produces one written artefact: a **stale-flag report** published as a
  GitHub issue. It lists every flag past its deadline with its owner, `createdAt`,
  current `enabled` / `strategy` state, and the required action, and it is linked
  from the flags' tracking issues so the findings are not buried in chat.
- Escalation is time-based and recorded on the artefact:

  1. At the deadline, the owning team is notified on the flag's tracking issue.
  2. At 14 days overdue, maintainers disable the flag and note it in the report.
  3. At 30 days overdue, maintainers open the removal pull request themselves if the
     owning team has not; an unresponsive owner does not keep a flag alive.

- This policy is reviewed together with the monthly report and whenever the flag
  system itself changes. Changes to this policy are proposed in a pull request that
  touches only the `Governance/` folder and must be approved before adoption.

## Success

This policy succeeds when every flag has a name that describes what it gates, an
owning team that knows it is theirs, a deadline recorded on the issue, and a
monthly review that removes flags instead of preserving them.
