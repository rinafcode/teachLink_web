# Referral Program Implementation

## Overview
This document describes the Referral Program implementation for the Authentication Flow in TeachLink. The referral program allows users to invite others to join the platform using unique referral codes, tracking referrals and providing benefits for both the referrer and the referred user.

## Features

### Core Functionality
- **Referral Code Generation**: Each user receives a unique 8-character referral code upon signup
- **Referral Tracking**: Users can enter a referral code during signup to track who referred them
- **Referral Validation**: The system validates referral codes before accepting them
- **Referral Counting**: Track the number of successful referrals for each user
- **Self-Referral Prevention**: Users cannot use their own referral code

### API Endpoints

#### POST /api/auth/signup
Enhanced to support referral codes during user registration.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "referralCode": "ABCDEFGH" // Optional
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "referralCode": "NEWCODE1",
    "referredBy": "ABCDEFGH",
    "referralCount": 0,
    "role": "STUDENT"
  },
  "token": "mock-jwt-token-123456"
}
```

#### GET /api/referral/validate
Validates a referral code before use during signup.

**Query Parameters:**
- `code` (required): The referral code to validate

**Response:**
```json
{
  "valid": true,
  "message": "Referral code is valid"
}
```

**Error Responses:**
- `400`: Invalid referral code format
- `404`: Referral code not found

## Data Model

### User Schema Extensions
The user schema has been extended to include referral-related fields:

```typescript
{
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'GUEST';
  referralCode?: string;        // User's unique referral code
  referredBy?: string;          // Referral code used during signup
  referralCount: number;         // Number of users this user has referred
}
```

## Referral Code Format

- **Length**: 8 characters
- **Character Set**: A-Z (excluding I, O) and 2-9 (excluding 0, 1)
- **Example**: `ABCDEFGH`, `AB12CD34`

The format excludes confusing characters (I, O, 0, 1) to improve readability and prevent user error.

## Implementation Details

### Utilities
The referral functionality is implemented in `/src/lib/referral.ts` with the following utilities:

- `generateReferralCode()`: Generates a unique referral code
- `validateReferralCode(code)`: Validates referral code format
- `referralCodeExists(code)`: Checks if a referral code exists in the system
- `storeReferralCode(email, code)`: Stores a referral code for a user
- `getReferralCodeOwner(code)`: Gets the owner of a referral code
- `incrementReferralCount(code)`: Increments the referral count for a code
- `getReferralCount(code)`: Gets the referral count for a code

### Frontend Integration

#### Signup Form
The signup form now includes an optional referral code field:
```tsx
<input
  type="text"
  placeholder="Enter referral code"
  {...register('referralCode')}
/>
```

The field is optional and allows users to enter a referral code during registration.

## Security Considerations

1. **Code Validation**: Referral codes are validated for format before checking existence
2. **Self-Referral Prevention**: Users cannot use their own referral code
3. **Rate Limiting**: Referral validation endpoints are rate-limited to prevent abuse
4. **Unique Codes**: Codes are generated using a cryptographically secure random method

## Testing

### Unit Tests
Unit tests for referral utilities are located in `/src/lib/__tests__/referral.test.ts`:
- Code generation uniqueness and format
- Format validation
- Storage and retrieval operations
- Referral count tracking

### Integration Tests
Integration tests for API endpoints are located in `/src/app/api/referral/__tests__/validate.test.ts`:
- Referral validation endpoint behavior
- Error handling for invalid codes
- Rate limiting compliance

### E2E Tests
E2E tests for the referral flow are in `/e2e/auth/signup.spec.ts`:
- Signup with valid referral code
- Signup without referral code
- Error handling for invalid referral codes
- Referral code field visibility

## Future Enhancements

Potential future improvements to the referral program:

1. **Reward System**: Implement actual rewards for successful referrals
2. **Referral Dashboard**: Create a dashboard for users to track their referrals
3. **Referral Sharing**: Add social media sharing buttons for referral codes
4. **Multi-level Referrals**: Support multi-level referral programs
5. **Analytics**: Provide analytics on referral performance
6. **Email Notifications**: Send notifications when referrals are successful
7. **Referral Expiration**: Add expiration dates to referral codes
8. **Bulk Referral Imports**: Allow importing referral codes in bulk

## Migration Notes

When migrating from a system without referral support:

1. Existing users will be assigned a referral code on their next login/update
2. The `referralCode` field is optional and nullable for backward compatibility
3. The `referralCount` defaults to 0 for existing users
4. The `referredBy` field is optional and nullable

## Performance Considerations

- Referral code validation is fast (O(1) lookup in mock storage)
- In production, use database indexing on referral codes for optimal performance
- Consider caching referral code validation results for frequently used codes
- Implement batch processing for referral count updates if needed

## Compliance and Accessibility

- Referral codes follow accessibility best practices (no confusing characters)
- Referral program is optional and does not affect core functionality
- Users can opt-out of the referral program if desired
- Referral data is handled according to privacy policies and regulations

## Support and Maintenance

For issues or questions related to the referral program:
- Check the unit tests for usage examples
- Review the API endpoint documentation
- Contact the development team for complex scenarios
- Monitor referral validation logs for potential abuse patterns

## Changelog

### Version 1.0.0 (Current)
- Initial implementation of referral program
- Referral code generation and validation
- Integration with signup flow
- Unit, integration, and E2E tests
- Documentation

---

**Last Updated**: 2025-05-30
**Maintained By**: TeachLink Development Team