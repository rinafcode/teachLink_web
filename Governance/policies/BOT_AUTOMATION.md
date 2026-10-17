# Bot and Automation Policy

## Purpose

This policy defines which automations may act in the project, the permissions
they may hold, and how they are reviewed and audited. Automation is useful
precisely because it acts without a person watching, which is also why it needs
explicit limits.

## Scope

This policy applies to every automated actor on the project's resources:
GitHub Apps, bots, scheduled workflows, dependency updaters, and webhook
integrations. It applies whether the automation is installed by the project or
by a vendor. Human contributors are out of scope; they are covered by the
access rules in the [Access Review Policy](ACCESS_REVIEW.md).

## Allowed Automations

Only automations that serve a defined project need are installed. Each one has
a documented purpose, a named human owner, and an installation that is scoped
to the repositories it needs. Automations may comment, label, and run checks
within their remit; they may not merge, approve, or push directly to a
protected branch, and they may not act on a pull request they opened in a way
that satisfies a required review. An automation that is no longer needed is
removed rather than disabled.

## Permissions

An automation receives the least permission its job requires, granted per
repository and per resource. Write access is given only where the automation
must write, and administrative permission is never granted. Any token an
automation uses is short-lived or scoped, is stored in the provider's secret
store, and follows the secret rotation policy. A vendor automation is treated
as a third-party dependency and is reviewed under the
[Vendor Risk Policy](VENDOR_RISK.md).

## Review and Audit

Every automation is reviewed at least every six months: whether it is still
needed, whether it still holds only the permissions it needs, and whether its
owner is still active. Actions taken by an automation are visible in the
repository's history, and any change to an automation's permissions is recorded
on the change that made it. An automation whose owner is inactive is reassigned
or removed at the next review.

## Ownership and Review

The maintainers own this policy and review it every six months. Changes are
proposed as a pull request that touches only the `Governance/` folder.

## Success

This policy succeeds when every automation has a purpose, an owner, and
least-privilege permissions, when automations cannot satisfy their own required
reviews, and when unused automations are removed rather than left in place.
