# Commit Signing Policy

## Purpose

This policy requires that commits which reach a protected branch carry a
verifiable signature, so that the project can attribute a change to a key it
trusts rather than to a name a client typed. Signing does not replace review;
it proves who authored a commit and that it was not altered in transit.

## Scope

This policy applies to every commit on a protected branch (`main` and
`develop`) and to every tag that marks a release. It covers contributions from
maintainers and outside contributors alike. It does not cover the sign-off that
records a contributor's agreement to the
[Developer Certificate of Origin](DCO.md), which is a separate requirement, nor
the review rules in the [Code Review Policy](REVIEW_POLICY.md).

## Signing Requirement

Every commit that lands on a protected branch must be signed with a key that
GitHub recognizes as belonging to the author. Signed commits are created with
`git commit -S` using either a GPG or an SSH signing key registered to the
author's account. A branch merged through the GitHub interface is signed by
GitHub on behalf of the merger, so the merge itself carries a signature even
when the individual commits are unsigned. Rewriting published history to add or
remove signatures is not allowed.

## Verification in CI

A required status check verifies the signatures of every commit in a pull
request before the branch may merge. The check fails when a commit is unsigned,
when its signature cannot be verified against a registered key, or when the
signature is valid but the key is not authorized for that author. Failures name
the offending commit so it can be re-signed. The check is required on `main`
and `develop` and is not bypassable by an approval.

## Key Management

Each contributor registers the signing key or keys they use with their GitHub
account, keeps the private key secure, and removes a key promptly when it is
lost, replaced, or suspected of exposure. A key that is used for signing is
never shared between people. When an author loses a key, commits signed with a
replacement are accepted once the new key is registered; a commit signed with a
revoked key is rejected.

## Ownership and Review

The maintainers own this policy and review it every six months, or sooner if
the checks behave unexpectedly. The review confirms that the required check is
still enabled and that signed-commit verification still matches what the policy
promises. Changes are proposed as a pull request that touches only the
`Governance/` folder.

## Success

This policy succeeds when every commit on a protected branch carries a
verifiable signature, when unsigned commits are caught by CI before merge, and
when authors keep their signing keys registered and current.
