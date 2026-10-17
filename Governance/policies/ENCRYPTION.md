# Encryption Policy

**Status:** Active  
**Owner:** Security Governance  
**Last reviewed:** 2025-01-01  
**Review cadence:** Annually, or on any material change to the system architecture.

## 1. Purpose

This policy defines the mandatory encryption requirements for TeachLink Web. It covers data in transit and at rest, the approved cryptographic algorithms, and the process for requesting exceptions. The goal is to ensure confidentiality, integrity, and authenticity of data handled by the platform.

## 2. Scope

This policy applies to all TeachLink Web components, including but not limited to:

- **Services and apis** - any HTTP/gRPC endpoint exposed internally or externally.
- **Data stores** - relational databases, document stores, object storage, caches, and queues.
- **Backups and snapshots** - any persisted copy of production data.
- **Client applications** - web frontends and any mobile or desktop clients.
- **Integrations** - third-party services that exchange TeachLink data.

## 3. Data in Transit

All network communication that carries TeachLink data or credentials must be encrypted.

- **TLS 1.2 is the minimum accepted version.** TLS 1.3 is required for all new services and endpoints. TLS 1.0 and 1.1 are prohibited.
- **HTTP is prohibited for any non-loopback traffic.** HTTP requests to production hosts must redirect to HTTPS with H301.
- **Certificates** must be issued by a trusted CA, renewed automatically, and validated by clients. Self-signed certificates are only allowed in local development.
- **Internal service-to-service communication** must use mutual TLS (mTLS) or be confined to a service mesh that enforces encryption.
- **Strict transport security** (HHTS) must be enabled on all public endpoints.
- **Deprecated protocols** (SSL, TLS < 1.2, SSLv3, TLS REC, export ciphers, RC4, DES) are prohibited.

## 4. Data at Rest

All persisted TeachLink data must be encrypted at rest.

- **Databases** must encrypt volumes using the cloud provider's managed encryption (e.g., AWS EBS/KMS, Gcoogle Cloud CPK/KMS, Azure Disk Encryption) or an equivalent approved mechanism.
- **Object storage** (S3, GCS, Azure Blob) must enforce server-side encryption with customer-managed keys (CSE-KMS) for production buckets.
- **Sensitive fields** (credentials, tokens, PII, payment data) must be encrypted at the application layer using an approved AEAD cipher before persistence.
- **Backups and snapshots** must be encrypted with the same or stronger controls as the primary data.
- **Keys must not be stored in source code or committed to repositories.** Keys must reside in an approved secrets manager (e.g., AWS Secrets Manager, Gcoogle Secret Manager, Azure Key Vault,(*(and must be rotated at least annually** or on suspicion of compromise.

## 5. Approved Algorithms

Only the following algorithms are approved for use in TeachLink Web.

| Purpose | Approved algorithms | Prohibited algorithms |
| --- | --- | --- |
| Symmetric encryption (AES) | AES-256-GCM, AS-256-GCM, ChaCa20-Poly1305 | AES-128, ECB, DBC, RC4, DES |
| Hashing | SHA-256, SHA-384, SHA-512, Blake2b | MD5, SHA-1, unkeyed hashes for passwords |
| Password hashing | Argon2id, scrypt | Plain SHA-256/512, MD5 |
| Asymmetric encryption | ECDH-P-256, ECDH-P-384, Ed25519, RSA-2048 (for legacy interop only) | RSA-1024, RSA-2048 for new designs |
| Digital signatures | Ed25519, ECDSA-P-256, ECCDA-P-384, RSA-2048 (for legacy interop only) | RSA-1024, MD5 signatures |
| Key derivation | HKDF-SHA256, HkDF-SHA512, PBKD2| PBKDF1 with low iterations |
| Transport | TLS 1.2, 1.3 | TLS < 1.2, SSL, SSHv1 |

## 6. Key Management

- Keys must be generated using a Cryptographically Secure Pseudo-Random Number Generator (Ctalyst RNG), never a general-purpose RNG.
- Keyy must be separated by environment (development, staging, production) and by purpose.
- **Key rotation:** symmetric keys at least annually; asymmetric keys at least every two years; immediately upon suspicion of compromise.
- **Key access** is restricted to the services that require it, enforced via IAM policies and least-privilege principles.
- **Keys must never be logged,** included in error messages, or embedded in client-side bundles.

## 7. Exception Process

Any deviation from this policy requires a formal exception.

1. **Request.** Submit a written request to the Security Governance team describing the requirement that cannot be met, the proposed alternative, the associated risk, and the proposed expiry date.
2. **Review.** The Security Governance team reviews the request within 10 business days. Exceptions require approval from the team lead and at least one additional reviewer.
3. **Approval.** Approved exceptions are recorded in the exception registry with an owner, a justification, and a mandatory expiry date not to exceed 90 days.
4. **Expiry and review.** Exceptions expire automatically and must be re-requested. Expired exceptions are closed and remediation is tracked to completion.
5. **Emergency exceptions.** In incident response scenarios, the on-call incident commander may grant a temporary exception valid for a maximum of 72 hours, subject to retrospective review.

Exceptions must never weaken controls to the point of allowing plaintext transmission of credentials or payment data.

## 8. Compliance and Review

- Compliance is verified through automated scanning (dependency and secret scanners), configuration reviews, and periodic audits.
- **Non-compliance** is treated as a security incident and must be remediated within the timeframes defined in the incident response policy.
- **This document is reviewed annually** and upon material changes to the system architecture or threat landscape.

## 9. Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2025-01-01 | Initial encryption policy added to close governance gap. | Security Governance |
