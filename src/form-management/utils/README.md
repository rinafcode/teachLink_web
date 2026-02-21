# Form Management System - Configuration Parser

The Configuration Parser is a core component of the Form Management System that handles parsing, validation, and formatting of JSON form configurations.

## Features

### ✅ Schema Validation
- **Complete JSON Schema Validation**: Validates all FormConfiguration properties using Zod schemas
- **Field Type Validation**: Ensures all field types are valid (text, number, email, password, select, checkbox, radio, textarea, file, date, time, datetime-local)
- **Required Property Validation**: Validates that all required properties are present and non-empty
- **Nested Structure Validation**: Handles complex nested structures like layout configurations, field groups, and wizard steps

### ✅ Custom Validation Rules
- **Field ID Uniqueness**: Ensures all field IDs are unique within a form
- **Dependency Validation**: Validates that field dependencies reference existing fields
- **Circular Dependency Detection**: Detects and prevents circular dependencies between fields
- **Step Field Validation**: Ensures wizard steps only reference existing fields
- **Step Index Validation**: Validates step indices are unique and properly sequenced

### ✅ Pretty Printer
- **Standard JSON Formatting**: Converts FormConfiguration objects to properly formatted JSON
- **Compact JSON Output**: Provides minified JSON output without indentation
- **Custom Formatting Options**: Supports custom indentation, key sorting, and metadata inclusion
- **Function Handling**: Automatically omits function properties during serialization
- **Structure Preservation**: Maintains all configuration structure and properties

### ✅ Error Handling
- **Descriptive Error Messages**: Provides clear, actionable error messages for validation failures
- **Error Categorization**: Categorizes errors by type (schema, dependency, circular, etc.)
- **Field-Level Error Reporting**: Associates errors with specific fields and properties
- **Graceful JSON Parsing**: Handles malformed JSON with appropriate error messages

## Usage

### Basic Usage

```typescript
import { FormConfigurationParser } from './configuration-parser';
import type { FormConfiguration } from '../types/core';

const parser = new FormConfigurationParser();

// Parse JSON string to FormConfiguration
const config = parser.parse(jsonString);

// Validate FormConfiguration object
const validation = parser.validate(config);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}

// Format FormConfiguration to JSON
const jsonOutput = parser.formatToJson(config);
```

### Advanced Formatting

```typescript
// Compact JSON (no indentation)
const compactJson = parser.formatToCompactJson(config);

// Custom formatting options
const customJson = parser.formatToJsonWithOptions(config, {
  indent: 4,           // Use 4-space indentation
  sortKeys: true,      // Sort object keys alphabetically
  includeMetadata: true // Add generation metadata
});
```

### Validation Examples

```typescript
// Valid configuration
const validConfig: FormConfiguration = {
  id: 'contact-form',
  version: '1.0.0',
  title: 'Contact Form',
  fields: [{
    id: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    validation: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Please enter a valid email' }
    ]
  }],
  layout: {
    type: 'single-column',
    spacing: 'normal',
    responsive: { breakpoints: {}, layouts: {} }
  },
  validation: {
    validateOnChange: true,
    validateOnBlur: true,
    showErrorsOnSubmit: true,
    debounceMs: 300,
    customRules: {}
  }
};

const result = parser.validate(validConfig);
// result.isValid === true
```

### Error Handling

```typescript
// Configuration with errors
const invalidConfig = {
  id: '', // Error: empty ID
  fields: [], // Error: no fields
  // Missing required properties
};

const result = parser.validate(invalidConfig);
// result.isValid === false
// result.errors contains detailed error information

result.errors.forEach(error => {
  console.log(`${error.code}: ${error.message}`);
  if (error.field) {
    console.log(`Field: ${error.field}`);
  }
});
```

## Validation Rules

### Schema Validation
- **Form ID**: Must be non-empty string
- **Version**: Must be non-empty string  
- **Title**: Must be non-empty string
- **Fields**: Must have at least one field
- **Field IDs**: Must be non-empty strings
- **Field Types**: Must be valid FieldType values
- **Field Labels**: Must be non-empty strings
- **Validation Rules**: Must have valid type and message

### Custom Validation
- **Unique Field IDs**: No duplicate field IDs allowed
- **Valid Dependencies**: Field dependencies must reference existing fields
- **No Circular Dependencies**: Fields cannot have circular dependency chains
- **Valid Step Fields**: Wizard steps can only reference existing fields
- **Unique Step Indices**: Step indices must be unique within a form

## Error Codes

| Code | Description |
|------|-------------|
| `DUPLICATE_FIELD_IDS` | Duplicate field IDs found |
| `INVALID_FIELD_DEPENDENCY` | Field dependency references non-existent field |
| `CIRCULAR_DEPENDENCY` | Circular dependency detected between fields |
| `INVALID_STEP_FIELD` | Wizard step references non-existent field |
| `DUPLICATE_STEP_INDICES` | Duplicate step indices found |

## Testing

The Configuration Parser includes comprehensive tests covering:

- ✅ Schema validation for all configuration properties
- ✅ Custom validation rules (duplicates, dependencies, circular references)
- ✅ JSON parsing and error handling
- ✅ Pretty printing with various formatting options
- ✅ Round-trip validation (parse → format → parse)
- ✅ Complex configuration scenarios (wizard steps, auto-save, analytics)
- ✅ Property-based testing for comprehensive input coverage

## Examples

See `../examples/configuration-parser-example.ts` for complete usage examples including:
- Basic form configuration
- Multi-step wizard configuration
- Validation demonstrations
- Error handling examples
- Round-trip testing

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 6.1**: Parse Form_Configuration JSON into internal form structure
- **Requirement 6.2**: Validate configuration schema with descriptive errors
- **Requirement 6.3**: Support nested field groups and complex layout definitions  
- **Requirement 6.4**: Format Form_Configuration objects back to valid JSON
- **Requirement 6.5**: Round-trip property (parse → print → parse produces equivalent object)