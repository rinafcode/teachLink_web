
# Auth Module

This folder contains a complete authentication system implementation for the TeachLink project.

## Features

- **Login/Signup Pages**: Complete authentication pages with form validation
- **Password Reset**: Forgot password and reset password functionality
- **Protected Routes**: Component to protect authenticated routes
- **Authentication Context**: React context for managing auth state
- **Form Validation**: Using react-hook-form + zod for robust validation
- **Toast Notifications**: User feedback for auth actions
- **Responsive Design**: Mobile-first design using Tailwind CSS

## Usage

### 1. Wrap your app with AuthProvider

```tsx
import { AuthProvider } from "@/auth";

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### 2. Use the authentication pages

```tsx
import { Login, Signup, ForgotPassword, ResetPassword } from "@/auth";

// Add these to your routing
<Route path="/auth/login" element={<Login />} />
<Route path="/auth/signup" element={<Signup />} />
<Route path="/auth/forgot-password" element={<ForgotPassword />} />
<Route path="/auth/reset-password" element={<ResetPassword />} />
```

### 3. Protect routes

```tsx
import { ProtectedRoute } from "@/auth";

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### 4. Use authentication in components

```tsx
import { useAuth } from "@/auth";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <button onClick={() => login(email, password)}>Login</button>
      )}
    </div>
  );
}
```

## Components

- **Login/Signup Pages**: Complete authentication pages with split layout
- **ForgotPassword**: Password reset request page
- **ResetPassword**: Password reset form with token validation
- **LoginForm/SignupForm**: Reusable form components
- **ProtectedRoute**: Route protection component

## Services

- **authService**: Handles all authentication API calls (currently mocked)
- **AuthContext**: React context for global auth state management

## Form Validation

All forms use react-hook-form with zod schemas for validation:
- Email format validation
- Password strength requirements
- Required field validation
- Password confirmation matching

## Styling

- Uses existing Tailwind CSS classes and design tokens
- Responsive design with mobile-first approach
- Consistent with the rest of the TeachLink application
- Includes proper form states and error handling

## API Integration

Currently uses mock API calls. To integrate with real backend:
1. Update the `authService.ts` file
2. Replace mock implementations with actual API calls
3. Update the API_URL constant
4. Add proper error handling for different response types
