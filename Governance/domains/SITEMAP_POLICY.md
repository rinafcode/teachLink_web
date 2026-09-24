# Sitemap and Robots Policy

## Purpose

This policy defines how the TeachLink Web sitemap and robots directives are
maintained so that search engines can crawl the site effectively while the
project keeps control over which content is indexed.

## Scope

This policy covers the sitemap(s) published by TeachLink Web and the robots
directives that govern crawler access.

## Sitemap Update Rule

- Sitemaps must reflect the current public structure of the site.
- New public pages that are discoverable by search engines must be added to the
  sitemap as part of the change that introduces them.
- Removed or redirected pages must be dropped from the sitemap promptly, ideally
  within one release cycle of the change.
- Sitemap entries must use canonical URLs and must not reference pages that
  redirect, that have been removed, or that are blocked by robots rules.
- The sitemap must be regenerated and validated automatically in CI.

## Robots Directives

- Robots directives must be intentional and reviewed. They should block only what
  the project does not want indexed or crawled.
- Public, end-user content must generally be left crawlable; directives that hide
  it require a documented reason.
- Environment-specific directives (for example staging or preview environments)
  must not leak into production.
- The robots file must be served correctly over HTTPS and must not reveal
  internal paths beyond what is necessary.

## Review Cadence

- The sitemap and robots directives are reviewed on a regular cadence to confirm
  they remain aligned with the site's actual structure.
- Review happens sooner whenever a significant content structure change or
  re-platforming effort is planned.

## Ownership

- The team responsible for site infrastructure and discovery owns this policy.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This policy succeeds when the sitemap accurately reflects the public site,
robots directives are minimal and justified, and the two are reviewed regularly.