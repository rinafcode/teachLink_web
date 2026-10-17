# Certificate Management Policy

## Purpose

This policy defines how the project issues, renews, owns, and monitors the
certificates that secure its services. Certificates are easy to forget and
expensive when they lapse, so the policy makes issuance, renewal, and expiry
monitoring explicit rather than relying on memory.

## Scope

This policy applies to every certificate the project relies on: public TLS
certificates for websites and APIs, internal service certificates, code-signing
certificates, and any client certificate used to authenticate to a service. The
private keys behind these certificates are managed under the
[Key Management Policy](KEY_MANAGEMENT.md).

## Issuance and Renewal

A certificate is issued only from an approved certificate authority and only
for a name the project owns. Every issuance records the host or service it
covers, the owner, the issuing authority, and the expiry date in the
certificate inventory. Renewal starts early enough to leave room for failure:
automated renewal is preferred, and where renewal is manual the request is
opened well before the expiry date. A renewed certificate is deployed to every
place the old one was used so that no service keeps serving an expired chain.

## Certificate Ownership

Each certificate has exactly one accountable owner, recorded in the inventory
alongside the service it protects. The owner is responsible for renewing it,
for replacing it if the private key is exposed, and for removing it when the
service is retired. An unowned certificate is treated as a defect and is either
reassigned or retired.

## Expiry Monitoring

Expiry is monitored automatically for every certificate in the inventory.
Alerts fire at fixed thresholds before the expiry date so that renewal can
complete without urgency, and a certificate that reaches its expiry date
without a renewal is treated as an incident. Monitoring covers certificates
that are not yet deployed as well as those in production, and the inventory is
reconciled against what is actually served at least once a quarter.

## Ownership and Review

The maintainers own this policy and review it every six months. The review
checks that the inventory is complete, that every certificate has an owner, and
that renewal and monitoring still run. Changes are proposed as a pull request
that touches only the `Governance/` folder.

## Success

This policy succeeds when no project service is ever served an expired
certificate, when every certificate has an owner and an entry in the
inventory, and when renewals are routine rather than emergencies.
