# Internationalization (i18n) Governance

This document outlines the governance process for internationalization (i18n) to ensure a consistent and high-quality experience for all users, regardless of their locale.

## String Externalization

All user-facing strings must be externalized from the code. This means they should not be hard-coded, but instead, referenced via a key from a locale-specific resource file.

- **Rule:** No user-facing strings in the codebase.
- **Implementation:** Use a localization library to manage strings.

## Fallback Locale

If a string is not available in the user's selected locale, the system must fall back to a default locale.

- **Policy:** The default fallback locale is `en-US`.
- **Implementation:** The localization library should be configured to automatically fall back to the default locale.

## Review of New Locales

Adding a new locale requires a formal review process.

1.  **Request:** A request to add a new locale must be submitted as an issue.
2.  **Review:** The i18n team will review the request, considering the target audience and the availability of translators.
3.  **Approval:** Once approved, the new locale will be added to the project.
4.  **Translation:** All strings must be translated into the new locale before it can be enabled.

## Regression Testing

All i18n-related changes must be accompanied by regression tests to ensure that existing functionality is not broken. This includes tests for string externalization, locale fallback, and proper rendering of translated content.
