# Cookie and Consent Governance

This document outlines the governance process for cookies and user consent to ensure compliance with privacy regulations and to build trust with our users.

## Consent Categories

Cookies and other tracking technologies must be grouped into categories.

- **Strictly Necessary:** Essential for the website to function. Cannot be disabled.
- **Performance:** Used to collect anonymous data about how visitors use the website.
- **Functional:** Used to remember user choices and provide enhanced features.
- **Targeting/Advertising:** Used to deliver personalized advertising.

## Default-Off Rule

All non-essential cookie categories must be off by default.

- **Policy:** Users must explicitly opt-in to non-essential cookie categories.
- **Implementation:** The cookie consent banner must be configured to have non-essential categories disabled by default.

## Consent Record Requirement

A record of user consent must be stored.

- **Policy:** The user's consent choices must be recorded and stored in a secure manner.
- **Implementation:** The consent management platform must be configured to log user consent.

## Regression Testing

All changes related to cookie and consent management must be accompanied by regression tests to ensure that existing functionality is not broken. This includes tests for the cookie consent banner, opt-in/opt-out functionality, and consent recording.
