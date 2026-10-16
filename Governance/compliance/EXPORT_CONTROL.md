# Export Control Policy

## Purpose

This policy explains how TeachLink Web handles export control laws, which
restrict transferring certain technology, software, or services across borders
or to certain parties. It helps the project and its contributors stay within the
law without hindering open collaboration. This document is a governance
statement, not legal advice; maintainers consult qualified counsel before
relying on it for a legal decision.

## Scope

This policy applies to the software, documentation, and any encryption or other
controlled technology published by the project, and to maintainers and
contributors who handle project releases, distribution, and contracts. It
applies alongside the sanctions compliance policy in this folder
([SANCTIONS.md](SANCTIONS.md)).

## Applicable Restrictions

The project aims to understand and respect the restrictions that may apply:

- Laws such as the US Export Administration Regulations and the equivalent rules
  of the EU and other jurisdictions where maintainers or infrastructure are
  located.
- Controls on cryptography and security software: the project's use of standard
  encryption in a web application, and any publicly available open-source source
  code, is generally treated as eligible for broad release, but this is
  confirmed with counsel when the code changes materially.
- Controls on destinations, end users, and end uses (for example embargoed
  regions and military end uses).
- A classification note for the project is kept by the maintainers, stating what
  was assessed, by whom, and when, and is reviewed whenever new cryptographic
  functionality or a new distribution channel is added.

## Screening Process

Screening is risk-based and proportionate:

- Open publication of source code on a public repository is not individually
  screened; the project does not collect enough information to do so.
- Before entering a contract, accepting a sponsorship, or providing private
  services or support, a maintainer screens the counterparty against the lists
  named in the sanctions compliance policy and records the result.
- Before a release or change that adds or modifies cryptographic features, a
  maintainer checks the classification note and asks counsel when unsure.
- Maintainers who suspect that a transfer, contribution, or request would breach
  export controls stop and raise it with the lead maintainers before proceeding.

## Exception Handling

When a restriction applies or may apply:

- The lead maintainers decide how to proceed, usually after consulting counsel:
  for example restricting a service for a party, applying for a licence, or
  changing a release.
- An exception to the usual practice (for example proceeding while a
  classification is pending) needs written approval from two maintainers and
  counsel's advice, and is recorded with its reason and expiry.
- No exception permits a transfer that is prohibited by law.
- Possible violations are reported privately to the lead maintainers, who
  investigate, contain the issue, assess any duty to disclose to authorities,
  and record the outcome. People who report in good faith are protected from
  retaliation under the [Code of Conduct](../CODE_OF_CONDUCT.md).

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- The classification note and screening records are reviewed at least once a
  year and at every change in cryptographic functionality.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when the project can show what it assessed and when, when
screening happens before private transfers, and when concerns are raised early
and resolved on the advice of counsel.
