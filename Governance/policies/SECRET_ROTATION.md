# Secret Rotation Policy

## Purpose

This policy defines how often each kind of secret used by the project is
rotated, who is responsible for rotating it, and how rotation is verified. A
secret that is never rotated keeps the blast radius of a leak open forever, so
rotation is treated as routine maintenance rather than an emergency task.

## Scope

This policy applies to every credential the project holds that is not a
cryptographic key: CI/CD secrets, deploy tokens, API tokens, database
credentials, webhook secrets, and third-party integration keys. Key material
such as signing keys and certificates is covered by the key and certificate
policies; a secret whose exposure is reported through the security process is
handled under the
[Vulnerability Disclosure Process](../processes/VULN_DISCLOSURE.md).

## Rotation Cadence

Each secret type has a maximum age, and a secret is rotated before it reaches
it:

- **High-impact secrets** that grant deploy, production database, or payment
  access are rotated at least every 90 days.
- **Standard API tokens and integration keys** are rotated at least every 180
  days.
- **Low-impact, read-only credentials** are rotated at least every 365 days.
- **Every secret** is rotated immediately when a holder leaves, when a secret
  may have leaked, or when a provider reports exposure.

Rotation replaces the old secret everywhere it is used before the old one is
revoked, so that no automation is left broken by the change.

## Responsible Owners

Every secret has a named owner recorded in the secret inventory. The owner
performs or schedules the rotation, updates every consumer, and records the
rotation date. Where a provider supports automatic rotation, the owner enables
it and monitors it rather than rotating by hand.

## Verification

After each rotation the owner confirms that every consumer still authenticates,
that the old secret no longer works, and that the rotation is recorded in the
inventory. At least once a quarter the inventory is reconciled against the
secrets actually deployed, and any secret past its maximum age is treated as an
incident until it is rotated.

## Ownership and Review

The maintainers own this policy and review it every six months, or sooner after
a secret-related incident. Changes are proposed as a pull request that touches
only the `Governance/` folder.

## Success

This policy succeeds when no secret is older than its maximum age, when every
secret has an owner and a recorded rotation date, and when a leaked secret can
be revoked and replaced without breaking the project.
