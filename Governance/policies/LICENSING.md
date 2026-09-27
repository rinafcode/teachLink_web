# Licensing Policy

## Purpose

This policy states how TeachLink Web's code and documentation are licensed,
defines the inbound-equals-outbound rule for contributions, and sets out how a
license change is decided. It makes the project's licensing explicit and
predictable instead of leaving it to inference.

## Current State (as of this policy)

As of this document, the repository has **not yet published a license**:

- There is no `LICENSE` file at the repository root.
- `package.json` has no `license` field.
- `README.md` states "See the repository's license file," but no such file
  currently exists.

Until a license is published, the public source is best treated as
**all-rights-reserved**: third parties should not assume rights to use, modify,
or redistribute the code that the project has not explicitly granted. This
policy defines how the project closes that gap.

## The Project License

- The project license is the license published in a `LICENSE` file at the
  repository root, and must be mirrored in the `license` field of
  `package.json` so tooling and dependency audits can read it consistently.
- Accepted licenses are standard, widely recognized open-source licenses with a
  published text; custom or modified license texts are not used.
- The `LICENSE` file is part of the governed repository state and is reviewed
  whenever the project's governance is reviewed.

## Inbound-Equals-Outbound

Contributions must come in under terms no more restrictive than the license the
project grants out:

- By contributing through the repository's normal change process, a contributor
  licenses their contribution under the project license, and the merged code is
  distributed under that same license. No additional license text or CLA is
  required for contributions that are original work.
- Code that is copied or adapted from another source must carry compatible
  licensing. Materially incompatible or viral in-bound code is not accepted;
  the contributor must disclose the provenance and license of any included
  third-party code in the pull request.
- Exceptions to inbound-equals-outbound (for example a one-off, separately
  licensed file) are made deliberately, documented in the pull request, and
  named in the file itself.

## How License Changes Are Decided

A change to the project license — selecting an initial license, changing it, or
adding an exception — is a governance decision, not a routine edit:

- It is proposed in a pull request that changes the `LICENSE` file and/or
  `package.json` **and** documents the reasoning in the `Governance/` folder,
  so the change and its justification travel together.
- The proposal must state the effect on existing contributors and anything
  already distributed under the previous terms.
- The change requires maintainer approval beyond the normal review, and must be
  announced to contributors through the repository's normal communication
  channels before it takes effect.
- The decision is recorded on the pull request, including any disagreement, so
  the rationale remains part of the record.

## Ownership

- Maintainers own this policy and the decision to publish or change the
  project license.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder, alongside the license change they authorize.

## Success

This policy succeeds when the repository carries a published license file that
matches `package.json`, when contributors can contribute without ambiguity about
what terms their work is accepted under, and when any future license change is a
deliberate, documented, announced decision.