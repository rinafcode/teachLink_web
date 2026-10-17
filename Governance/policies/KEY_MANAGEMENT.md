# Key Management Policy

## Purpose

This policy defines the lifecycle of the cryptographic keys the project uses:
how keys are generated, stored, used, rotated, and revoked. Sound key
management keeps the blast radius of a leaked key small and makes it possible
to state what a key was for and when it was retired.

## Scope

This policy applies to every key and key-like secret used by the project:
repository and release signing keys, SSH deploy keys, CI/CD signing keys,
TLS/HTTPS certificates (covered by the
[Certificate Management Policy](CERTIFICATE_MANAGEMENT.md)), Web3 wallet keys
used for deploys, and encryption keys that protect stored data. Passwords and
API tokens are governed by the Access Review Policy; this policy covers
material whose compromise is a cryptographic event.

## Key Lifecycle

Every key is generated with an approved algorithm and a length appropriate to
its purpose, and is created on hardware or software that the project controls.
Each key has a documented purpose, a named owner, a creation date, and a
retirement condition before it is first used. A key is used only for the single
purpose it was created for; reusing one key across services or environments is
not allowed. When a key is no longer needed it is retired rather than left in
place.

## Storage and Access

Private key material is never committed to the repository, pasted into an issue
or pull request, or stored in plaintext. Keys live in a secrets manager or on a
hardware token, are encrypted at rest, and are readable only by the smallest
set of people and automations that need them. Every read of a private key is
logged, and access to keys is re-checked whenever the people or automations
holding it change.

## Rotation and Revocation

Keys are rotated on the cadence their type requires and immediately when a
holder leaves, when a key may have been exposed, or when an algorithm is
deprecated. Rotation issues a new key, moves every consumer to it, and then
destroys the old key. Revocation is the faster path used during an incident: it
removes the key from every system that accepted it and records the reason,
after which a replacement is issued under the normal lifecycle.

## Ownership and Review

The maintainers own this policy and review it every six months, or sooner after
a key-related incident. The review checks that the key inventory matches the
keys actually deployed and that every key still has a live owner. Changes are
proposed as a pull request that touches only the `Governance/` folder.

## Success

This policy succeeds when every key has a named owner and a single purpose,
when private key material is never exposed in the repository, when rotation and
revocation happen on time, and when the project can account for every key it
has ever issued.
