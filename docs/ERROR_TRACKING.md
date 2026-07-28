# Error Tracking Documentation

## Overview

The teachLink web application uses a comprehensive error tracking system that combines structured logging with external error monitoring services. This ensures all errors are properly captured, categorized, and reported for debugging and monitoring purposes.

## Architecture

### Components

1. **Error Reporting Service** (`src/services/errorReporting.ts`)
   - Client-side error collection and reporting
   - Session tracking with unique session IDs
   - Breadcrumb collection for user action tracing
   - Automatic error classification

2. **Error API Endpoint** (`src/app/api/errors/report/route.ts`)
   - Server-side error reception
   - Integration with external error tracking services
   - Structured logging of all error reports

3. **Structured Logging** (`src/lib/logging/`)
   - Pino-based logging system
   - Automatic redaction of sensitive data
   - Multiple transport support (in-memory, HTTP, aggregation)
   - Context-aware logging with request/correlation IDs

4. **Error Utilities** (`src/utils/errorUtils.ts`)
   - Error classification (network, validation, auth, etc.)
   - User-friendly error messages
   - Retry logic with exponential backoff

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Error Tracking Configuration
# External error tracking service endpoint (e.g., Sentry, DataDog, LogRocket)
ERROR_TRACKING_URL=https://your-error-tracking-service.com/api/errors
ERROR_TRACKING_API_KEY=your_api_key_here
```

### Logging Configuration

```bash
# Log Level (debug | info | warn | error)
LOG_LEVEL=info
NEXT_PUBLIC_LOG_LEVEL=info

# Log Aggregation Endpoint
LOG_AGGREGATION_URL=https://your-log-aggregation-endpoint.com/logs
NEXT_PUBLIC_LOG_AGGREGATION_URL=https://your-log-aggregation-endpoint.com/logs
```

## Usage

### Client-Side Error Reporting

```typescript
import { errorReportingService } from '@/services/errorReporting';

// Report an error with context
try {
  await someAsyncOperation();
} catch (error) {
  await errorReportingService.reportError(error, {
    action: 'user_submit_form',
    userId: 'user-123',
    additionalContext: { formData: data },
  });
}

// Set user context for error tracking
errorReportingService.setUserId('user-123');

// Add breadcrumbs for user actions
errorReportingService.reportUserAction('button_click', {
  buttonId: 'submit-form',
  page: '/editor',
});

// Clear user context on logout
errorReportingService.clearUserId();
```

### Using the Error Handling Hook

```typescript
import { useErrorHandling } from '@/hooks/useErrorHandling';

function MyComponent() {
  const { execute, error, isLoading } = useErrorHandling({
    maxAttempts: 3,
    reportErrors: true,
  });

  const handleSubmit = async () => {
    const result = await execute(() => apiCall());
    if (result) {
      // Success
    }
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Server-Side Error Logging

```typescript
import { createLogger } from '@/lib/logging';

const logger = createLogger('myModule');

// Log errors with context
logger.error('Operation failed', {
  context: { userId, operation: 'data_fetch' },
  error: new Error('Database connection failed'),
});

// Log warnings
logger.warn('Deprecated API usage', {
  context: { endpoint: '/api/v1/old' },
});

// Log info
logger.info('User action completed', {
  context: { action: 'login', userId },
});
```

## Error Classification

The system automatically classifies errors into the following types:

- **NETWORK**: Network connectivity issues
- **VALIDATION**: Input validation errors
- **AUTHENTICATION**: Authentication failures
- **AUTHORIZATION**: Permission errors
- **NOT_FOUND**: Resource not found
- **SERVER**: Server-side errors (5xx)
- **TIMEOUT**: Request timeouts
- **OFFLINE**: Application offline
- **RATE_LIMIT**: API rate limiting
- **UNKNOWN**: Unclassified errors

Each classification includes:
- User-friendly message
- Action suggestion
- Retryability flag
- HTTP status code (if applicable)

## External Service Integration

### Supported Services

The error tracking endpoint supports integration with various external services:

1. **Sentry**
   ```bash
   ERROR_TRACKING_URL=https://sentry.io/api/PROJECT_ID/envelope/
   ERROR_TRACKING_API_KEY=your_sentry_dsn
   ```

2. **DataDog**
   ```bash
   ERROR_TRACKING_URL=https://http-intake.logs.datadoghq.com/api/v2/logs
   ERROR_TRACKING_API_KEY=your_datadog_api_key
   ```

3. **LogRocket**
   ```bash
   ERROR_TRACKING_URL=https://api.logrocket.com/logs
   ERROR_TRACKING_API_KEY=your_logrocket_api_key
   ```

4. **Custom Endpoint**
   ```bash
   ERROR_TRACKING_URL=https://your-custom-endpoint.com/errors
   ERROR_TRACKING_API_KEY=your_api_key
   ```

### Integration Behavior

- Errors are sent asynchronously without blocking the response
- Failed sends are logged but don't affect the application
- Each error report includes:
  - Error details (type, message, stack trace)
  - Session and user information
  - Breadcrumbs (user actions leading to error)
  - Environment and URL information
  - Source identifier (`teachLink-web`)

## Testing Error Tracking

### Manual Testing

```typescript
// Test error reporting
await errorReportingService.reportError(new Error('Test error'), {
  test: true,
});

// Test breadcrumb tracking
errorReportingService.reportUserAction('test_action', { test: true });
```

### Verification

1. Check browser console for error logs
2. Verify logs appear in your log aggregation service
3. Confirm errors appear in external tracking service (if configured)
4. Check server logs for `/api/errors/report` endpoint activity

## Best Practices

### 1. Always Report Errors

```typescript
// Good
try {
  await operation();
} catch (error) {
  await errorReportingService.reportError(error, { context });
}

// Bad - silent failures
try {
  await operation();
} catch (error) {
  console.error(error); // Only console logging
}
```

### 2. Provide Context

```typescript
// Good - rich context
await errorReportingService.reportError(error, {
  action: 'submit_form',
  formId: 'contact-form',
  userId: currentUser.id,
  formData: { email, subject },
});

// Bad - minimal context
await errorReportingService.reportError(error);
```

### 3. Set User Context

```typescript
// On login
errorReportingService.setUserId(user.id);

// On logout
errorReportingService.clearUserId();
```

### 4. Add Breadcrumbs

```typescript
// Track important user actions
errorReportingService.reportUserAction('navigation', {
  from: '/dashboard',
  to: '/editor',
});

errorReportingService.reportUserAction('form_submit', {
  formId: 'contact-form',
  fields: ['email', 'message'],
});
```

### 5. Use Appropriate Log Levels

```typescript
// Debug - detailed information for debugging
logger.debug('Function called', { context: { params } });

// Info - general informational messages
logger.info('User logged in', { context: { userId } });

// Warn - warning messages for potential issues
logger.warn('Deprecated API used', { context: { endpoint } });

// Error - error messages
logger.error('Operation failed', { context, error });
```

## Troubleshooting

### Errors Not Appearing in External Service

1. Verify `ERROR_TRACKING_URL` is set correctly
2. Check `ERROR_TRACKING_API_KEY` is valid
3. Review server logs for send failures
4. Ensure the external service is accessible from your server

### Sensitive Data in Logs

The logging system automatically redacts common sensitive data:
- Passwords
- API keys
- Tokens
- Email addresses
- Phone numbers
- Credit card numbers

If you need additional redaction rules, modify `SENSITIVE_KEYS` in `src/lib/logging/index.ts`.

### High Error Volume

If you're receiving too many error reports:

1. Review error classification to filter expected errors
2. Add error filtering in `sendToExternalService` function
3. Adjust sampling rates in external service configuration
4. Implement error deduplication

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Sensitive Data**: The logging system automatically redacts sensitive data
3. **User Privacy**: Avoid logging PII beyond what's necessary for debugging
4. **Access Control**: Ensure error tracking endpoints are protected
5. **Data Retention**: Configure appropriate data retention policies in external services

## Monitoring and Alerts

Set up monitoring for:

1. Error rate spikes
2. New error types appearing
3. High-frequency errors from specific users
4. External service send failures

Example monitoring queries:
- Error rate by type
- Errors by user ID
- Errors by URL path
- External service send success rate

## Migration from console.error

The application has been migrated from `console.error` to structured logging:

**Before:**
```typescript
console.error('Error occurred:', error);
```

**After:**
```typescript
logger.error('Error occurred', { error, context: { additionalInfo } });
```

All existing `console.error` calls in error reporting have been replaced with structured logging using the Pino-based logger.

## Support

For issues or questions about error tracking:

1. Check this documentation
2. Review error logs in your aggregation service
3. Consult external service documentation (Sentry, DataDog, etc.)
4. Open an issue in the project repository
