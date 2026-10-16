# Sanctions Compliance Policy

## Purpose

This policy sets out how TeachLink Web complies with economic and trade
sanctions: the screening that is required, how dealings with a prohibited party
are handled, and how doubts are escalated. It protects the project, its
maintainers, and its funders from inadvertently breaching sanctions law. This
document is a governance statement, not legal advice; maintainers consult
qualified counsel before relying on it for a legal decision.

## Scope

This policy applies to financial and contractual dealings of the project:
receiving donations or sponsorship, paying vendors or contributors, entering
agreements, hosting events, and granting paid or privileged access to services.
It does not restrict participation in the public open-source repository, which
follows the [Code of Conduct](../CODE_OF_CONDUCT.md) and legal advice on open
publication, and it complements the export control policy in this folder
([EXPORT_CONTROL.md](EXPORT_CONTROL.md)).

## Screening Requirement

Before a financial or contractual relationship starts:

- A maintainer, usually the [Treasurer role](../roles/TREASURER.md), screens the
  individual or organisation, and any known beneficial owners, against the
  consolidated sanctions lists of the jurisdictions that apply to the project,
  such as those of the US Treasury (OFAC), the UN, the EU, and the UK.
- Screening is repeated at least once a year for recurring relationships, and
  whenever the lists change in a way that may affect an existing partner.
- Results and the lists checked are recorded with the date and the person who
  screened them; a match, a partial match, or an inability to complete screening
  is recorded as such.
- The project does not rely on a counterparty's own assurances alone for
  relationships of significant value.

## Prohibited Parties Handling

If a party is on a sanctions list, or the dealing would involve a sanctioned
country or party:

- The relationship is not started, or is paused at once if already under way.
  Funds are not accepted or sent, and no services are provided.
- If funds have been received from a prohibited party, they are not used or
  returned without legal advice, as returning them can also be prohibited; the
  funds are held and counsel is consulted.
- The party is told only as much as is necessary and legally permitted. The
  matter is kept confidential and not discussed in public channels.
- Contributors do not circumvent sanctions on behalf of anyone, for example by
  routing payments through intermediaries.
- Ordinary open-source participation, such as reading the public code or filing
  issues, is not blocked by this policy unless counsel advises that the law
  requires it.

## Escalation

Anyone who suspects a sanctions issue acts promptly:

- Raise it privately with the treasurer or the lead maintainers; do not
  investigate on your own or tip off the party.
- The lead maintainers decide on the response, consult counsel, and decide
  whether authorities or banks must be notified.
- Decisions and their reasons are recorded, and the screening process is
  reviewed afterwards for gaps.
- Retaliation against someone who raises a concern in good faith is a conduct
  matter under the [Code of Conduct reporting](../COC_REPORTING.md).
- This policy is reviewed once a year and after any sanctions incident.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- The treasurer keeps the screening log and reports on screenings and matches to
  the maintainers each year.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when screening is done and recorded before relationships
begin, when prohibited dealings are stopped and escalated early, and when the
project never has to explain a breach it could have prevented.
