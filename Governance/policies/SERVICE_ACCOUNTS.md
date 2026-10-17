# Service Account Policy

## Purpose

This policy defines how service accounts are created, used, reviewed, and
retired in the TeachLink Web project, so that automation holds only the access
it needs and no service account outlives its purpose. A service account is any
non-human identity that authenticates to a project resource, including CI jobs,
deploy bots, and integration users.

## Scope

This policy applies to every non-human identity the project uses: accounts on
the GitHub organization, accounts in hosting, package, analytics, and
monitoring services, cloud identities, and the API tokens those automations
hold. Human contributors are covered by the access rules in the
[Access Review Policy](ACCESS_REVIEW.md).

## Creating Service Accounts

A service account is created only when no human or shared identity can meet the
need. Every request records five things before the account exists:

- the purpose the account serves and the resource it calls;
- the exact scopes or roles it is granted;
- the owner accountable for the account;
- the review date at which it is next assessed;
- the plan for its retirement.

A maintainer creates the account, records it in the project's maintainer
records, and names it so the owning team is obvious from the name alone.

## Least Privilege

A service account receives the smallest set of permissions that lets it do its
job, and never administrative rights when a scoped role will do. Permissions
are granted per resource rather than organization-wide, are read-only unless a
write is genuinely required, and are re-checked whenever the automation that
uses the account changes. Shared credentials between two automations are not
allowed because they make revocation and audit impossible.

## Review and Decommission

Every service account is reviewed on the schedule set by the
[Access Review Policy](ACCESS_REVIEW.md). The review confirms the account is
still needed, still least-privileged, and still has a live owner. An account is
decommissioned when its automation is removed, its owner leaves without a
replacement, or its review is missed twice. Decommissioning revokes the
credentials, removes the account from every resource, and records the date in
the project's maintainer records.

## Ownership and Review

The maintainers own this policy and review it every six months, or sooner when
an incident or a tooling change shows it is out of date. Changes are proposed
as a pull request that touches only the `Governance/` folder.

## Success

This policy succeeds when every service account has a named owner, holds only
the permissions it needs, is reviewed on schedule, and can be attributed to a
known automation at any time.
