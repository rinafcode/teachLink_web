# Inclusive Language Guide

## Purpose

This guide helps contributors write and speak in a way that welcomes everyone to
TeachLink Web. It lists preferred terms, terms to avoid, and how the guide is
applied, so inclusive wording is a shared habit rather than a matter of personal
taste. It supports, and does not replace, the [Code of
Conduct](../CODE_OF_CONDUCT.md).

## Scope

This guide applies to everything contributors write for the project: code
(identifiers, comments, commit messages), documentation, issue and pull request
text, UI copy, release notes, and discussion in project channels. Localised
content follows the [I18N Governance](../domains/I18N_GOVERNANCE.md) for
language-specific choices.

## Preferred Terms

Choose precise, neutral words:

- **allowlist / denylist** for lists of permitted or blocked items.
- **primary / replica** (or **leader / follower**) for roles in a system.
- **main** for the default branch, as this repository does.
- **placeholder value**, **sample data**, or **stub** instead of terms that
  stereotype.
- **people**, **everyone**, **folks**, or **team** instead of gendered group
  terms such as "guys".
- **they** for a single person whose pronouns are not known; use the pronouns a
  person tells you.
- **stop** or **end** instead of violent metaphors such as "kill" where a calmer
  verb is just as clear, and **confidence check** instead of "sanity check".
- Plain, literal wording rather than idioms that may not translate. Many
  contributors and learners read English as an additional language.

## Terms to Avoid

Avoid language that excludes, stereotypes, or harms:

- master/slave, whitelist/blacklist, and similar terms that carry racial
  connotations.
- Ableist terms used as insults or metaphors (for example "crazy", "lame",
  "blind to", "crippled").
- Gendered defaults ("he", "manpower", "man-hours") when the person or group is
  unspecified.
- Terms that assume background or ability, such as "obviously", "simply",
  "just", and "everyone knows", which make learners feel behind.
- Slurs, jokes at the expense of a group, and sexual or violent humour in any
  project space.
- External names we cannot change (a vendor API field, a standard's keyword) are
  not renamed in third-party code; wrap them where practical and say why the
  original is used.

## How It Is Enforced

The aim is education first:

- Reviewers raise a wording concern as a normal review comment, with a suggested
  alternative and, where helpful, a link to this guide. The author is expected
  to address it as they would any review note.
- Existing terms are updated gradually: a pull request that touches a line is a
  good moment to improve its wording, and dedicated renaming pull requests are
  welcome when they stay small and avoid breaking public APIs (follow the
  [Deprecation policy](../policies/DEPRECATION.md)).
- A repeated disregard of the guide, or deliberate use of exclusionary language,
  is a conduct matter handled through [Code of Conduct
  reporting](../COC_REPORTING.md) and the [Moderation
  policy](../policies/MODERATION.md).
- Disagreements about a term are resolved by asking whether it could exclude or
  hurt someone and whether a clear alternative exists; a maintainer decides and
  records the outcome if the discussion cannot settle it.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- Anyone may propose additions to the preferred and avoided terms by pull
  request with a short rationale.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This guide succeeds when contributors reach for inclusive wording by habit, when
reviewers can point to a shared reference instead of personal opinion, and when
no one is made to feel unwelcome by the project's words.
