# GDPR Compliance Overview

## Purpose

This document provides a versioned reference for General Data Protection Regulation (GDPR) compliance within the TeachLink Web project. It outlines the obligations that apply to the project, the handling of data-subject rights, and the responsible owner for maintaining this document.

## Scope

This overview applies to all personal data processed by the TeachLink Web application, including data collected from educators, learners, and administrators. It covers data stored in application databases, logs, and any third-party services integrated with the platform.

## Applicable GDPR Obligations

1. **Lawfulness, fairness, and transparency**
   - Personal data must be processed lawfully, fairly, and in a transparent manner.
   - Privacy notices must be provided to data subjects at the point of collection.

2. **Purpose limitation**
   - Data must be collected for specified, explicit, and legitimate purposes.
   - Further processing incompatible with the original purpose is prohibited.

3. **Data minimisation**
   - Only personal data adequate, relevant, and limited to what is necessary for the stated purpose may be processed.

4. **Accuracy**
   - Personal data must be accurate and, where necessary, kept up to date.
   - Inaccurate data must be erased or rectified without undue delay.

5. **Storage limitation**
   - Data must not be kept longer than necessary for the purposes for which it is processed.
   - Retention schedules must be defined and enforced.

6. **Integrity and confidentiality**
   - Appropriate technical and organisational measures must be implemented to ensure security of personal data.
   - Encryption in transit and at rest is required for sensitive data.

7. **Accountability**
   - The project must be able to demonstrate compliance with GDPR principles.
   - Records of processing activities must be maintained.

## Data-Subject Rights Handling

The TeachLink Web platform must facilitate the following rights for data subjects:

1. **Right to be informed**
   - Provide clear privacy notices detailing data collection and usage.

2. **Right of access**
   - Data subjects may request a copy of their personal data.
   - Requests must be fulfilled within one month.

3. **Right to rectification**
   - Data subjects may request correction of inaccurate data.
   - Corrections must be reflected in all systems.

4. **Right to erasure ("right to be forgotten")**
   - Data subjects may request deletion of their personal data.
   - Deletion must be cascaded across all storage systems where legally permitted.

5. **Right to restrict processing**
   - Data subjects may request temporary suspension of processing.
   - Restricted data must be flagged and excluded from active processing.

6. **Right to data portability**
   - Data subjects may request their data in a structured, commonly used, machine-readable format.
   - Exports must be provided in JSON or CSV format.

7. **Right to object**
   - Data subjects may object to processing based on legitimate interests or direct marketing.
   - Objections must be honoured unless compelling legitimate grounds exist.

8. **Rights related to automated decision-making and profiling**
   - Data subjects have the right not to be subject to decisions based solely on automated processing.
   - Human intervention must be available on request.

## Responsible Owner

The **Governance Committee** is the responsible owner for this document and for ensuring GDPR compliance across the TeachLink Web project. Specific responsibilities include:

- Maintaining and updating this overview as needed.
- Reviewing data processing activities for compliance.
- Approving changes to data handling procedures.
- Acting as the contact point for data-subject requests and regulatory inquiries.

## Regression Testing

Where applicable, the following tests must be maintained to verify GDPR compliance features:

- **Data export tests**: Verify that data-subject requests for portability return complete and accurate data in JSON format.
- **Data deletion tests**: Verify that erasure requests remove data from all storage layers.
- **Access request tests**: Verify that data-subject access requests return all stored personal data.
- **Consent tests**: Verify that consent flags are respected and withdrawal is honoured.

## Change Log

| Date       | Version | Author              | Description                                                                 |
|------------|---------|---------------------|--------------------------------------------------------------------------------------|
| 2026-06-28 | 1.0.0   | Governance Committee   | Initial GDPR compliance overview added to close governance gap in the Governance/compliance folder.       |
