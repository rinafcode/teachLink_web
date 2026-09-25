# WCAG Compliance

This document specifies the success criteria, testing tools, and exemption process for WCAG compliance.

## Success Criteria in Scope

We are committed to meeting the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** success criteria. All web content and applications must satisfy these criteria.

## Testing Tools

- **Automated Testing:** We use tools such as axe, Lighthouse, and WAVE for automated accessibility testing in our CI/CD pipeline.
- **Manual Testing:** Manual testing is performed using screen readers (JAWS, NVDA, VoiceOver) and keyboard-only navigation.

## Exemption Process

In rare cases where a specific WCAG success criterion cannot be met, a formal exemption request must be submitted. The request must include:

1.  A detailed explanation of why the criterion cannot be met.
2.  The impact on users with disabilities.
3.  A plan for providing an alternative means of access.

Exemption requests will be reviewed by the accessibility team and must be approved before the non-compliant feature is released.

## Regression Tests

Where applicable, regression tests will be added to ensure that previously fixed WCAG compliance issues do not reoccur.
