# Toast Circuit Breaker Implementation

## Overview

This document describes the Circuit Breaker implementation for Toast Notifications in the teachLink_web application. The Circuit Breaker pattern prevents cascading failures and provides fallback behavior when the toast notification system is overwhelmed.

## Architecture

### Circuit Breaker States

The Circuit Breaker operates in three states:

1. **CLOSED** (Normal Operation)
   - All toast notifications pass through normally
   - Failures are tracked but don't block operations
   - Circuit opens when failure threshold is reached

2. **OPEN** (Circuit Tripped)
   - Toast notifications are blocked
   - Fallback behavior is triggered
   - System waits for timeout before attempting recovery

3. **HALF_OPEN** (Recovery Testing)
   - Limited operations allowed to test system health
   - Circuit closes if success threshold is reached
   - Circuit reopens if failures continue

### Configuration

The Circuit Breaker uses the following configuration:

```typescript
{
  failureThreshold: 5,        // Number of failures before opening
  successThreshold: 2,        // Number of successes to close circuit
  timeout: 60000,            // Time in ms before attempting recovery (1 minute)
  monitoringPeriod: 10000,   // Time window for failure counting (10 seconds)
  maxConcurrentRequests: 10  // Maximum concurrent toast operations
}
```

## Implementation Details

### Core Components

1. **CircuitBreaker Class** (`src/utils/circuitBreaker.ts`)
   - Manages circuit state transitions
   - Tracks metrics and failure history
   - Executes operations with circuit protection
   - Provides fallback mechanisms

2. **ToastContext Integration** (`src/context/ToastContext.tsx`)
   - Wraps toast operations with Circuit Breaker
   - Provides metrics access via `getCircuitBreakerMetrics()`
   - Allows manual reset via `resetCircuitBreaker()`
   - Shows fallback toast when circuit is open

### Usage

```typescript
import { useToast } from '@/context/ToastContext';

function MyComponent() {
  const { addToast, getCircuitBreakerMetrics, resetCircuitBreaker } = useToast();

  // Normal usage - Circuit Breaker handles protection automatically
  addToast('Operation successful', 'success');

  // Check circuit breaker metrics
  const metrics = getCircuitBreakerMetrics();
  console.log('Circuit state:', metrics.state);

  // Manually reset circuit breaker if needed
  resetCircuitBreaker();
}
```

## Metrics

The Circuit Breaker tracks the following metrics:

- `state`: Current circuit state (CLOSED, OPEN, HALF_OPEN)
- `failureCount`: Current failure count in monitoring window
- `successCount`: Current success count in recovery mode
- `lastFailureTime`: Timestamp of last failure
- `lastStateChange`: Timestamp of last state transition
- `totalRequests`: Total number of requests processed
- `totalFailures`: Total number of failures
- `totalSuccesses`: Total number of successes

## Fallback Behavior

When the Circuit Breaker is OPEN:

1. Toast notifications are suppressed
2. A warning is logged to console
3. A simplified fallback toast is shown: "Notifications temporarily limited"
4. Maximum of 2 fallback toasts are displayed simultaneously

This prevents UI clutter while informing users of the temporary limitation.

## Testing

### Unit Tests

Located in `src/utils/__tests__/circuitBreaker.test.ts`:

- Initial state verification
- Successful operation handling
- Failure tracking and circuit opening
- Fallback behavior
- Recovery (HALF_OPEN state)
- Concurrent request limiting
- Metrics tracking
- Reset functionality

### Integration Tests

Located in `src/context/__tests__/ToastContext.circuitBreaker.test.tsx`:

- Circuit breaker metrics availability
- Toast operation tracking
- Circuit breaker reset
- Normal toast rendering
- Different toast type handling
- Toast suppression when circuit is open
- Warning logging

## Performance Considerations

The Circuit Breaker implementation is designed for minimal performance impact:

- **O(1) State Checks**: State transitions are constant time operations
- **Efficient Failure Tracking**: Uses array with automatic cleanup of old entries
- **Non-blocking**: Operations fail fast when circuit is open
- **Memory Efficient**: Limits concurrent requests and toast queue size
- **Minimal Overhead**: Only adds logging and state management overhead

## Accessibility

The Circuit Breaker implementation maintains accessibility:

- Fallback toasts use the same accessible Toast component
- Role="alert" is preserved on all toast notifications
- ARIA labels remain intact
- Screen readers receive notification of temporary limitations
- No impact on keyboard navigation

## Security Considerations

The Circuit Breaker enhances security:

- **Rate Limiting**: Prevents toast spam attacks
- **Resource Protection**: Limits concurrent operations to prevent DoS
- **Fail-Safe**: Graceful degradation under load
- **No Sensitive Data Exposure**: Metrics don't expose sensitive information
- **Console Logging**: Only logs non-sensitive operation details

## Monitoring and Debugging

### Console Logs

The Circuit Breaker logs important events:

- `[Toast Circuit Breaker] Toast notification suppressed` - When circuit is open
- `[Toast Circuit Breaker] Error` - When unexpected errors occur

### Metrics Access

Access real-time metrics via the `getCircuitBreakerMetrics()` function:

```typescript
const metrics = getCircuitBreakerMetrics();
if (metrics.state === 'OPEN') {
  console.log('Circuit is open, last failure:', metrics.lastFailureTime);
}
```

## Best Practices

1. **Don't Suppress Errors**: Let the Circuit Breaker handle failures naturally
2. **Monitor Metrics**: Use metrics to identify patterns and adjust configuration
3. **Test Failure Scenarios**: Verify fallback behavior works as expected
4. **Adjust Configuration**: Tune thresholds based on application load
5. **Manual Reset**: Use `resetCircuitBreaker()` only when necessary (e.g., after fixing issues)

## Troubleshooting

### Circuit Frequently Opening

If the circuit opens frequently:

1. Check for error conditions in toast operations
2. Increase `failureThreshold` if failures are expected
3. Increase `timeout` to allow more recovery time
4. Review `monitoringPeriod` to adjust failure counting window

### Toasts Not Showing

If toasts are not appearing:

1. Check circuit state via `getCircuitBreakerMetrics()`
2. Look for console warnings about suppressed notifications
3. Verify `maxConcurrentRequests` is not too low
4. Consider manually resetting the circuit breaker

### Performance Issues

If performance is impacted:

1. Verify Circuit Breaker is not the bottleneck (check metrics)
2. Reduce `monitoringPeriod` for faster cleanup
3. Lower `maxConcurrentRequests` if system is overloaded
4. Review console logging frequency

## Future Enhancements

Potential improvements for the Circuit Breaker:

1. **Adaptive Thresholds**: Automatically adjust thresholds based on load
2. **Metrics Dashboard**: Visual monitoring of circuit breaker state
3. **Custom Fallbacks**: Allow custom fallback behavior per toast type
4. **Circuit Breaker Events**: Emit events for state changes
5. **Persistence**: Save metrics across page reloads
6. **Integration with Monitoring**: Send metrics to external monitoring services

## References

- [Circuit Breaker Pattern - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Microsoft Circuit Breaker Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Resilience4j Circuit Breaker](https://resilience4j.readme.io/docs/circuitbreaker)

## Changelog

### Version 1.0.0
- Initial implementation of Circuit Breaker for Toast Notifications
- Integration with ToastContext
- Comprehensive unit and integration tests
- Documentation and usage examples
