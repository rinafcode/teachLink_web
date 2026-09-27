# Developer Certificate of Origin (DCO) Policy

## Purpose

TeachLink uses the Developer Certificate of Origin (DCO) to record that every contribution is submitted by someone who has the right to contribute it. The DCO is a lightweight attestation made on each commit; it is not a copyright assignment.

This policy applies to source code, tests, documentation, configuration, design assets, and other material submitted to this repository.

## Required sign-off

Every commit in a pull request must include a `Signed-off-by` trailer using the contributor's real name or a consistent public identity and a reachable email address:

```text
Signed-off-by: Full Name <email@example.com>
```

Add the trailer when committing:

```bash
git commit -s -m "type(scope): describe the change"
```

To sign off an existing commit while preserving its message:

```bash
git commit --amend --signoff --no-edit
```

For multiple commits, use an interactive rebase to amend and sign off each commit, then update the pull-request branch safely:

```bash
git rebase --signoff HEAD~<commit-count>
git push --force-with-lease
```

Do not copy another person's sign-off or add a sign-off on their behalf. Co-authored commits must still be signed off by the person submitting the commit.

## Certification

By adding the sign-off, the contributor certifies the Developer Certificate of Origin 1.1:

> By making a contribution to this project, I certify that:
>
> (a) The contribution was created in whole or in part by me and I have the right to submit it under the open source license indicated in the repository; or
>
> (b) The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate open source license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same open source license (unless I am permitted to submit under a different license); or
>
> (c) The contribution was provided directly to me by another person who certified (a), (b), or (c), and I have not modified it; and
>
> (d) I understand and agree that this project and the contribution are public and that a record of the contribution, including all personal information I submit with it, is maintained indefinitely and may be redistributed consistent with this project or the open source license(s) involved.

The canonical text is available at <https://developercertificate.org/>.

## Verification

Pull-request authors should verify sign-offs before requesting review:

```bash
git log --format='%h %s%n%(trailers:key=Signed-off-by)' origin/main..HEAD
```

Maintainers verify that:

1. every commit contains at least one syntactically valid `Signed-off-by: Name <email>` trailer;
2. the sign-off belongs to the contributor responsible for that commit;
3. the commit history shown by GitHub matches the branch being reviewed; and
4. new commits added after approval are also signed off.

An automated DCO status check may enforce these requirements. A passing check does not prevent maintainers from requesting clarification when authorship or licensing is unclear.

## Missing or invalid sign-off

A missing or invalid sign-off blocks merge but is normally remediable:

1. The reviewer or DCO check identifies the affected commit(s).
2. The contributor amends or rebases the commits to add valid sign-offs.
3. The contributor updates the branch with `git push --force-with-lease`.
4. Required checks and reviews run again against the updated commit SHA.

Maintainers must not merge first and add a sign-off later. A comment such as "I agree to the DCO" is not a substitute for a commit trailer unless an exceptional remediation is explicitly approved and documented by the maintainers.

If a contributor cannot certify the DCO, the affected material must be removed or replaced with material that can be certified. Suspected copyright or provenance problems should be escalated to the maintainers and handled under the repository's licensing and security processes.

## Exceptions

Commits created entirely by approved automation (for example, an authorized dependency-update bot or GitHub-generated merge commit) may be exempt when no individual contributor can add a trailer. Human-authored changes delivered through automation remain subject to this policy.

Any exception must be narrow, documented in the pull request, and approved by a maintainer.
