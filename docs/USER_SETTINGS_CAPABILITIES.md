# User Settings Capabilities Implementation

## Overview

This document describes the implementation of Capabilities for User Settings as part of issue #495 and Virtual Background support as part of the Backup System enhancement. This implementation adds a comprehensive service layer, validation, testing infrastructure, and enhanced capabilities to the User Settings system, following the architectural pattern established by the notification system refactoring.

## Virtual Background Feature (v3)

### Overview
The virtual background feature allows users to replace their actual background during video calls with various effects:
- **Blur**: Applies a blur effect to the background
- **Image**: Uses a custom image as the background
- **Color**: Uses a solid color as the background
- **None**: Disables virtual background (default)

### Implementation Details

#### Settings Schema (v3)
Added the following fields to `AppSettings`:
- `virtualBackgroundEnabled`: boolean - Master toggle for virtual background
- `virtualBackgroundType`: enum ('none' | 'blur' | 'image' | 'color') - Type of background effect
- `virtualBackgroundImage`: string (max 500 chars) - URL for custom background image
- `virtualBackgroundBlur`: number (0-100) - Blur intensity
- `virtualBackgroundColor`: string (max 7 chars) - Hex color for solid color backgrounds

#### UI Components
- Added Virtual Background section to settings page (`src/pages/settings/index.tsx`)
- Integrated with video conference component (`src/components/collaboration/VideoConference.tsx`)
- Created custom hook for virtual background management (`src/hooks/useVirtualBackground.ts`)

#### Utility Functions
Created `src/utils/virtualBackgroundUtils.ts` with:
- `applyVirtualBackground()`: Applies virtual background effects to video streams
- `settingsToVirtualBackgroundConfig()`: Converts settings to config object
- `isValidImageUrl()`: Validates image URLs
- `isValidHexColor()`: Validates hex color codes
- `isValidBlurIntensity()`: Validates blur intensity values

#### Migration
- Schema version updated from v2 to v3
- Automatic migration from v2 to v3 adds default virtual background settings
- Preserves existing user settings during migration

## Problems Addressed

### Before Implementation

1. **Basic Architecture**: The User Settings implementation was limited to a simple API route with in-memory storage:
   - No service layer for business logic
   - Limited validation capabilities
   - No comprehensive testing
   - Basic error handling

2. **Limited Functionality**: 
   - No settings validation service
   - No sync capabilities or conflict resolution
   - No import/export functionality
   - No capability-based permission system

3. **Poor Test Coverage**: No unit or integration tests for settings operations

## After Implementation

### New Architecture

```
src/lib/settings/
├── types.ts          # Unified type definitions
├── constants.ts      # Configuration constants
├── service.ts        # Business logic layer (NEW)
├── index.ts          # Public API exports (NEW)
└── __tests__/
    ├── service.test.ts      # Unit tests for service layer (NEW)
    └── integration.test.ts  # Integration tests (NEW)
```

### Key Improvements

1. **Service Layer**: Clear separation of business logic from API routes
2. **Enhanced Validation**: Comprehensive validation for all settings operations
3. **Testing Infrastructure**: Unit and integration tests for all functionality
4. **Settings Sync**: Conflict resolution and synchronization capabilities
5. **Import/Export**: Settings backup and restore functionality
6. **Capabilities System**: Permission-based settings access control
7. **Migration Support**: Version migration for future schema changes

## Components

### 1. Service Layer (`service.ts`)

Business logic layer that handles:

- **Settings Validation**: `validateSettings()` - Validates settings against schema
- **Store State Management**: `createStoreState()` - Creates properly structured settings state
- **Settings Sync**: `mergeSettings()` - Conflict resolution for sync operations
- **Sync Detection**: `needsSync()` - Determines when settings need synchronization
- **Partial Updates**: `validatePartialUpdate()` - Validates incremental updates
- **Individual Validation**: `validateSettingValue()` - Validates specific setting values
- **Export/Import**: `exportSettings()`, `importSettings()` - Backup and restore functionality
- **Reset to Defaults**: `resetToDefaults()` - Reverts to default settings
- **Capabilities**: `getCapabilities()`, `canEditSetting()` - Permission system
- **Migration**: `migrateSettings()` - Schema version migration
- **Virtual Background**: Support for video conference virtual backgrounds (NEW in v3)

Example usage:

```typescript
import { SettingsService } from '@/lib/settings';

// Validate settings
const validation = SettingsService.validateSettings(userSettings);
if (!validation.valid) {
  console.error(validation.errors);
}

// Create store state
const storeState = SettingsService.createStoreState(settings);

// Merge settings for sync
const merged = SettingsService.mergeSettings(localState, remoteState);

// Check sync status
if (SettingsService.needsSync(localState)) {
  // Trigger sync
}

// Export settings
const exported = SettingsService.exportSettings(storeState);

// Import settings
const importResult = SettingsService.importSettings(exportedData);

// Check permissions
if (SettingsService.canEditSetting('theme')) {
  // Allow theme change
}
```

### 2. Updated API Route (`route.ts`)

Refactored to use the new service layer:

- Uses `SettingsService.validateSettings()` for payload validation
- Uses `SettingsService.createStoreState()` for consistent state management
- Enhanced error messages with validation details
- Improved response structure with error details

### 3. Type Definitions (`types.ts`)

Enhanced with comprehensive type support:

- Existing schema validation with Zod
- Store state types for persistence
- Export/import envelope types
- Default settings generation

### 4. Public API (`index.ts`)

Unified entry point for all settings functionality:

```typescript
export * from './types';
export * from './constants';
export * from './service';
```

## Migration Guide

### For Existing Code

Most existing code will continue to work without changes due to backward compatibility in the API route. However, consider these updates:

#### Before (Old Pattern)
```typescript
// Direct API calls without service layer
const response = await fetch('/api/user/settings?userId=123');
const data = await response.json();
```

#### After (Recommended Pattern)
```typescript
import { SettingsService } from '@/lib/settings';

// Use service layer for validation
const validation = SettingsService.validateSettings(newSettings);
if (validation.valid) {
  // Proceed with API call
  const response = await fetch('/api/user/settings', {
    method: 'PUT',
    body: JSON.stringify({
      userId: '123',
      settings: validation.data,
      updatedAt: Date.now(),
    }),
  });
}
```

### Type Imports

The types remain unchanged and can be imported as before:

```typescript
import { AppSettings, createDefaultSettings } from '@/lib/settings';
// or
import { AppSettings, createDefaultSettings } from '@/lib/settings/types';
```

## Testing

### Unit Tests

Service layer has comprehensive unit tests covering:

- Settings validation with various scenarios
- Store state creation and management
- Settings merge logic and conflict resolution
- Sync detection logic
- Partial update validation
- Individual setting value validation
- Export/import functionality
- Reset to defaults
- Capabilities system
- Migration logic
- Virtual background settings validation (NEW)
- Virtual background migration from v2 to v3 (NEW)

Run unit tests:
```bash
pnpm test src/lib/settings/__tests__/service.test.ts
pnpm test src/utils/__tests__/virtualBackgroundUtils.test.ts
pnpm test src/hooks/__tests__/useVirtualBackground.test.ts
```

### Integration Tests

Integration tests verify:

- End-to-end settings flow (create, validate, export)
- Settings sync and merge operations
- Validation integration across scenarios
- Export/import data integrity
- Capabilities system integration
- Migration integration
- LocalStorage integration
- Virtual background settings export/import (NEW)
- Virtual background settings reset to defaults (NEW)

Run integration tests:
```bash
pnpm test src/lib/settings/__tests__/integration.test.ts
```

## Features

### 1. Settings Validation

Comprehensive validation for all settings operations:
- Schema validation with detailed error messages
- Individual setting value validation
- Partial update validation
- Type-safe validation with TypeScript support

### 2. Settings Sync

Robust synchronization capabilities:
- Last-write-wins conflict resolution
- Timestamp-based merging
- Sync status detection
- Support for multiple clients

### 3. Import/Export

Settings backup and restore:
- JSON-based export format with metadata
- Version compatibility checking
- Data integrity validation
- Timestamp tracking

### 4. Capabilities System

Permission-based access control:
- Per-setting edit permissions
- Capability flags for different operations (including `canEditPollSettings` for custom poll preferences)
- Extensible for future features
- Role-based support (future enhancement)

### 5. Poll Creation Preferences

The system includes support for user-configurable default preferences for interactive polls:
- `pollCreationEnabled`: Master toggle for creating polls in classes, study groups, or discussions.
- `defaultPollDuration`: Active duration of created polls (1 to 30 days).
- `allowAnonymousVoting`: Default setting for enabling anonymous votes.
- `pollResultsVisibility`: Control who can view the voting results ('always' | 'after_voting' | 'after_ended').

### 6. Migration Support

Schema version management:
- Automatic migration between versions
- User data preservation during migration
- Future-proof schema evolution

### 6. Virtual Background (NEW in v3)

Virtual background support for video conferences:
- Four background types: none, blur, image, color
- Custom image background support with URL validation
- Configurable blur intensity (0-100)
- Solid color background with hex color picker
- Integrated with video conferencing component
- Full backup/restore support via export/import

## Benefits

### For Developers

1. **Clearer API**: Service layer provides a consistent interface
2. **Better TypeScript Support**: Enhanced type safety throughout
3. **Easier Testing**: Service layer is easily testable in isolation
4. **Consistent Behavior**: All settings operations use same business logic
5. **Better Error Handling**: Detailed validation errors for debugging

### For the Codebase

1. **Reduced Duplication**: Single implementation of settings operations
2. **Better Separation**: API routes focus on HTTP, service layer handles logic
3. **Easier Maintenance**: Changes to settings logic in one place
4. **Improved Testability**: Comprehensive test coverage
5. **Future-Proof**: Architecture supports future enhancements

### For Users

1. **Consistent Experience**: All settings operations follow same rules
2. **Better Reliability**: Improved validation and error handling
3. **Enhanced Features**: Sync, import/export, and capabilities
4. **Data Safety**: Conflict resolution and backup capabilities
5. **Performance**: Optimized validation and sync logic

## Performance Considerations

The implementation maintains performance characteristics:

- No additional overhead for existing functionality
- Service layer methods are lightweight and fast
- Validation is efficient with early returns on errors
- Sync operations are optimized with timestamp comparisons
- LocalStorage operations remain unchanged

## Future Enhancements

Potential areas for future improvement:

1. **Persistent Storage**: Replace in-memory storage with PostgreSQL or KV store
2. **User Roles**: Integrate with authentication for role-based capabilities
3. **Settings History**: Track settings changes over time
4. **Real-time Sync**: WebSocket integration for real-time updates
5. **Settings Templates**: Predefined settings for different use cases
6. **Analytics Dashboard**: UI for viewing settings usage
7. **A/B Testing**: Framework for testing new settings features
8. **Advanced Validation**: Custom validation rules per setting
9. **Bulk Operations**: Support for batch settings updates
10. **Settings Profiles**: Multiple settings profiles per user

## Security Considerations

The implementation includes security best practices:

- Input validation on all settings operations
- Type safety with TypeScript and Zod schemas
- No sensitive data in error messages
- Version checking to prevent schema mismatches
- Capability-based access control for future integration

## Accessibility Guidelines

The settings system supports accessibility:

- Clear error messages for all validation failures
- Consistent API structure for predictable behavior
- Support for reduced motion settings
- Theme preferences properly validated
- Language preferences validated and stored

## Rollback Plan

If issues arise, the implementation can be rolled back by:

1. Reverting the API route to previous implementation
2. Removing the service layer and tests
3. No data migration required (all changes are code-only)

## Conclusion

This implementation significantly improves the User Settings system by:

- Adding a comprehensive service layer with business logic
- Implementing robust validation and error handling
- Providing sync, import/export, and capabilities features
- Adding comprehensive unit and integration tests
- Following established architectural patterns
- Maintaining backward compatibility
- Providing a solid foundation for future enhancements

The system is now more maintainable, testable, and feature-rich while maintaining the simplicity and performance of the original implementation.