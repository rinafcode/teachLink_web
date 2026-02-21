# Auto-Save Manager

The Auto-Save Manager provides automatic form data persistence to prevent data loss and enable seamless draft management for long forms.

## Features

### 1. Basic Auto-Save Functionality (Requirements 3.1, 3.3)
- **Automatic Save Triggers**: Configurable intervals for automatic saves
- **Field Blur Events**: Save data when users leave a field
- **Draft Storage**: Store form data with timestamps and metadata
- **Metadata Tracking**: Track form ID, session ID, user ID, and timestamps

### 2. Draft Data Recovery (Requirement 3.2)
- **Draft Loading**: Restore previously saved form data
- **Data Integrity Validation**: Verify draft data structure and completeness
- **Expiration Handling**: Automatically remove expired drafts
- **Session Recovery**: Restore form state from previous sessions

### 3. Offline Save Management (Requirement 3.4)
- **Save Queue**: Queue failed save operations for retry
- **Network Detection**: Monitor online/offline status
- **Automatic Retry**: Retry queued saves when connectivity is restored
- **Retry Limits**: Configurable maximum retry attempts

### 4. Save Status Indication (Requirement 3.5)
- **Status States**: idle, saving, saved, error
- **Status Callbacks**: Subscribe to status changes
- **Visual Indicators**: Support for UI status indicators
- **Error Reporting**: Detailed error information

### 5. Storage Management (Requirements 3.6, 3.7)
- **Draft Cleanup**: Clear drafts after successful submission
- **Storage Quota**: Configurable storage size limits
- **Oldest-First Cleanup**: Remove oldest drafts when quota is exceeded
- **Storage Monitoring**: Track current storage usage

## Usage

### Basic Setup

```typescript
import { AutoSaveManagerImpl } from './auto-save/auto-save-manager';

// Create manager instance
const autoSaveManager = new AutoSaveManagerImpl();

// Enable auto-save with 5-second interval
autoSaveManager.enableAutoSave('my-form', 5000);

// Subscribe to status changes
const subscription = autoSaveManager.onSaveStatusChange((status) => {
  console.log('Status:', status.status);
  if (status.lastSaved) {
    console.log('Last saved:', status.lastSaved);
  }
});
```

### Manual Save

```typescript
const formState: FormState = {
  values: { name: 'John', email: 'john@example.com' },
  validation: {},
  touched: {},
  dirty: {},
  isSubmitting: false,
  submitCount: 0,
  metadata: {
    formId: 'my-form',
    sessionId: 'session-123',
    createdAt: new Date(),
    lastModified: new Date(),
    version: '1.0'
  }
};

await autoSaveManager.saveNow('my-form', formState);
```

### Draft Recovery

```typescript
// Load draft on form initialization
const draft = await autoSaveManager.loadDraft('my-form');

if (draft) {
  // Restore form with draft data
  console.log('Recovered values:', draft.values);
} else {
  // Start with empty form
  console.log('No draft found');
}
```

### Draft Cleanup

```typescript
// Clear draft after successful submission
await autoSaveManager.clearDraft('my-form');
```

### Storage Quota Management

```typescript
// Set 5MB storage quota
autoSaveManager.setStorageQuota(5 * 1024 * 1024);

// Oldest drafts will be automatically removed when quota is exceeded
```

## API Reference

### AutoSaveManager Interface

#### `enableAutoSave(formId: string, interval: number): void`
Enable automatic saving for a form at specified interval (in milliseconds).

#### `saveNow(formId: string, data: FormState): Promise<void>`
Save form data immediately. Throws error if save fails.

#### `loadDraft(formId: string): Promise<FormState | null>`
Load previously saved draft. Returns null if no draft exists or draft is invalid/expired.

#### `clearDraft(formId: string): Promise<void>`
Remove draft data for a form. Safe to call even if no draft exists.

#### `setStorageQuota(maxSize: number): void`
Set maximum storage size in bytes. Oldest drafts are removed when quota is exceeded.

#### `onSaveStatusChange(callback: SaveStatusCallback): Subscription`
Subscribe to save status changes. Returns subscription object with `unsubscribe()` method.

### SaveStatus Interface

```typescript
interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: Error;
  queuedSaves: number;
}
```

### DraftData Interface

```typescript
interface DraftData {
  formId: string;
  userId?: string;
  sessionId: string;
  data: FormState;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  compressed: boolean;
}
```

## Implementation Details

### Storage Strategy
- Uses browser's `localStorage` by default
- Can be configured with custom storage provider
- Drafts are stored with key format: `form-draft-{formId}`
- Each draft includes metadata for tracking and validation

### Network Handling
- Monitors `online` and `offline` events
- Queues saves when offline
- Automatically processes queue when connectivity is restored
- Configurable retry limits (default: 3 attempts)

### Data Integrity
- Validates draft structure before loading
- Checks for required fields (formId, data, sessionId)
- Verifies data structure (values, metadata)
- Handles corrupted data gracefully

### Storage Quota Management
- Tracks total storage usage
- Sorts drafts by update time
- Removes oldest drafts first when quota is exceeded
- Ensures new saves can complete successfully

### Expiration Handling
- Drafts expire after 7 days by default
- Expired drafts are automatically removed on load
- Expiration time is stored in draft metadata

## Testing

The Auto-Save Manager includes comprehensive unit tests covering:

- Basic save and load operations
- Draft recovery and validation
- Offline save queueing and retry
- Storage quota management
- Status indication and callbacks
- Error handling
- Resource cleanup

Run tests with:
```bash
npm test -- auto-save-manager.test.ts
```

## Examples

See `examples/auto-save-example.ts` for complete usage examples including:

- Basic auto-save setup
- Manual save operations
- Draft recovery on form load
- Draft cleanup after submission
- Storage quota configuration
- Offline save handling
- Visual status indicators
- Complete form integration

## Integration with Form State Manager

The Auto-Save Manager is designed to work seamlessly with the Form State Manager:

```typescript
import { FormStateManagerImpl } from './state/form-state-manager';
import { AutoSaveManagerImpl } from './auto-save/auto-save-manager';

const stateManager = new FormStateManagerImpl(/* ... */);
const autoSaveManager = new AutoSaveManagerImpl();

// Enable auto-save
autoSaveManager.enableAutoSave('my-form', 5000);

// Subscribe to state changes and trigger saves
stateManager.subscribeToChanges((event) => {
  if (event.type === 'field-change') {
    const currentState = stateManager.getState();
    autoSaveManager.saveNow('my-form', currentState);
  }
});

// Load draft on initialization
const draft = await autoSaveManager.loadDraft('my-form');
if (draft) {
  // Restore state from draft
  Object.entries(draft.values).forEach(([fieldId, value]) => {
    stateManager.updateField(fieldId, value);
  });
}
```

## Best Practices

1. **Set Appropriate Intervals**: Balance between data safety and performance (5-10 seconds recommended)
2. **Handle Errors Gracefully**: Always handle save errors and inform users
3. **Clear Drafts on Submission**: Remove drafts after successful form submission
4. **Monitor Storage Quota**: Set reasonable quota limits based on form complexity
5. **Validate Loaded Drafts**: Always validate draft data before using it
6. **Unsubscribe Callbacks**: Clean up subscriptions when components unmount
7. **Use Status Indicators**: Provide visual feedback to users about save status

## Performance Considerations

- Auto-save operations are asynchronous and non-blocking
- Storage operations use browser's native localStorage (synchronous but fast)
- Network detection uses browser events (minimal overhead)
- Queue processing is batched for efficiency
- Storage cleanup is performed only when necessary

## Browser Compatibility

- Requires browser support for:
  - localStorage API
  - Online/offline events
  - Promise API
  - Modern JavaScript (ES6+)

## Future Enhancements

Potential improvements for future versions:

- Data compression for large forms
- IndexedDB support for larger storage
- Conflict resolution for multi-device scenarios
- Encryption for sensitive data
- Custom expiration policies
- Backup to server storage
- Delta updates for efficiency
