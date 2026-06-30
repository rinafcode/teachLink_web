# Bugfix Requirements Document

## Introduction

The `getTranslation` function in `src/locales/translationManager.ts` replaces `{{key}}` placeholders using the regex `/\{\{(\w+)\}\}/g`. The `\w+` pattern only matches word characters (`[a-zA-Z0-9_]`), which excludes the dot character. As a result, nested interpolation keys like `{{user.name}}` are never matched and their placeholders are left verbatim in the output string. Additionally, when a param key referenced in a template is absent from the provided params object, the placeholder is silently left in the output with no developer notification, making debugging difficult.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a translation template contains a dot-separated placeholder such as `{{user.name}}` AND params contains a nested object `{ user: { name: 'Alice' } }` THEN the system leaves `{{user.name}}` unreplaced in the returned string

1.2 WHEN a translation template contains a placeholder whose key is not present in the provided params object THEN the system silently leaves the placeholder in the returned string without any warning

### Expected Behavior (Correct)

2.1 WHEN a translation template contains a dot-separated placeholder such as `{{user.name}}` AND params contains a matching nested object `{ user: { name: 'Alice' } }` THEN the system SHALL resolve the value by traversing the nested object and return the string with `{{user.name}}` replaced by `Alice`

2.2 WHEN a translation template contains a placeholder whose key is not present in the provided params object THEN the system SHALL emit a `console.warn` (or equivalent logger warning) identifying the missing key AND leave the original placeholder visible in the returned string

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a translation template contains a flat (non-nested) placeholder such as `{{name}}` AND params contains the matching key `{ name: 'Alice' }` THEN the system SHALL CONTINUE TO replace the placeholder and return the correct interpolated string

3.2 WHEN params is undefined or not provided THEN the system SHALL CONTINUE TO return the raw translation string without modification

3.3 WHEN a translation template contains multiple placeholders of any kind THEN the system SHALL CONTINUE TO replace all of them in a single pass

3.4 WHEN the translation key path does not exist in the translations object THEN the system SHALL CONTINUE TO return the original key string unchanged

---

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type { template: string, params: Record<string, any> }
  OUTPUT: boolean

  // Returns true when the placeholder contains a dot (nested key)
  RETURN template CONTAINS pattern /\{\{[\w]+\.[\w.]+\}\}/
     OR  (template CONTAINS pattern /\{\{[\w.]+\}\}/ AND referenced key NOT IN params)
END FUNCTION
```

### Fix Checking Property

```pascal
// Property: Fix Checking — Nested Key Resolution
FOR ALL X WHERE isBugCondition(X) AND X is nested key case DO
  result ← getTranslation'(translations, key, X.params)
  ASSERT result does NOT contain the original placeholder
  ASSERT result contains the resolved nested value
END FOR

// Property: Fix Checking — Missing Key Warning
FOR ALL X WHERE isBugCondition(X) AND X is missing key case DO
  result ← getTranslation'(translations, key, X.params)
  ASSERT console.warn was called with a message referencing the missing key
  ASSERT result contains the original placeholder (visible to developer)
END FOR
```

### Preservation Checking Property

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT getTranslation(translations, key, X.params) = getTranslation'(translations, key, X.params)
END FOR
```
