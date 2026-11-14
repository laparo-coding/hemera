# Quickstart: Protected Area Shell

## Overview

This quickstart guide validates the Protected Area Shell implementation through end-to-end user
scenarios. It tests authentication flow, role-based navigation, and security features.

## Prerequisites

- Hemera application running locally
- Clerk authentication configured
- Test user accounts with different roles

## Test Scenario 1: User Authentication Flow

### Objective

Verify that users can successfully sign in and access the protected area with appropriate
navigation.

### Steps

1. **Start the application**

   ```bash
   cd /Users/Zauberflocke/Documents/My\ Dev\ Projects/hemera
   npm run dev
   ```
2. **Attempt to access protected area while unauthenticated**
   - Navigate to `http://localhost:3000/protected/dashboard`
   - **Expected**: Automatic redirect to `/sign-in` page
   - **Validation**: URL should be `http://localhost:3000/sign-in`

3. **Sign in with user credentials**
   - Enter valid email and password on sign-in page
   - Click sign-in button
   - **Expected**: Redirect to `/protected/dashboard`
   - **Validation**: User should see dashboard content

4. **Verify user navigation**
   - Check navigation tabs visible
   - **Expected**: "Dashboard" and "Courses" tabs visible
   - **Expected**: "Admin" tab NOT visible
   - **Validation**: Navigation reflects user role permissions

5. **Test tab switching**
   - Click "Courses" tab
   - **Expected**: Navigate to `/protected/courses`
   - **Expected**: Courses tab highlighted as active
   - Click "Dashboard" tab
   - **Expected**: Navigate to `/protected/dashboard`
   - **Expected**: Dashboard tab highlighted as active

6. **Verify user information display**
   - Check user profile area
   - **Expected**: User email displayed
   - **Expected**: User role displayed as "user"
   - **Expected**: Sign-out button visible

### Success Criteria

- ✅ Unauthenticated redirect works
- ✅ Sign-in redirects to protected area
- ✅ User sees appropriate navigation (Dashboard + Courses only)
- ✅ Tab switching works correctly
- ✅ User information displayed correctly

## Test Scenario 2: Admin Role Access

### Objective

Verify that admin users have access to all navigation sections including admin area.

### Steps

1. **Sign out from previous session**
   - Click sign-out button
   - **Expected**: Redirect to home page
   - **Validation**: No longer authenticated

2. **Sign in with admin credentials**
   - Navigate to `/sign-in`
   - Enter admin user email and password
   - Click sign-in button
   - **Expected**: Redirect to `/protected/dashboard`

3. **Verify admin navigation**
   - Check navigation tabs visible
   - **Expected**: "Dashboard", "Courses", and "Admin" tabs visible
   - **Validation**: All three sections accessible to admin

4. **Test admin section access**
   - Click "Admin" tab
   - **Expected**: Navigate to `/protected/admin`
   - **Expected**: Admin tab highlighted as active
   - **Expected**: Admin section content displayed

5. **Verify admin user information**
   - Check user profile area
   - **Expected**: Admin email displayed
   - **Expected**: User role displayed as "admin"

### Success Criteria

- ✅ Admin sees all navigation sections (Dashboard + Courses + Admin)
- ✅ Admin can access admin section
- ✅ Admin role displayed correctly in user profile

## Test Scenario 3: Security Validation

### Objective

Verify that security measures are working correctly and unauthorized access is prevented.

### Steps

1. **Test direct URL access while unauthenticated**
   - Open incognito/private browser window
   - Navigate directly to `http://localhost:3000/protected/admin`
   - **Expected**: Redirect to `/sign-in`
   - **Validation**: Cannot bypass authentication via direct URL

2. **Test role-based section protection**
   - Sign in as regular user (not admin)
   - Attempt to navigate directly to `http://localhost:3000/protected/admin`
   - **Expected**: Access denied or graceful fallback
   - **Validation**: User role restrictions enforced

3. **Test session persistence**
   - Sign in as user
   - Refresh page multiple times
   - **Expected**: Remain authenticated
   - **Expected**: Navigation and role information preserved

4. **Test sign-out security**
   - Sign out while on protected page
   - Attempt to navigate back to protected area
   - **Expected**: Redirect to sign-in page
   - **Validation**: Session properly cleared

### Success Criteria

- ✅ Direct URL access blocked when unauthenticated
- ✅ Role-based access control enforced
- ✅ Session persistence works correctly
- ✅ Sign-out clears session properly

## Test Scenario 4: Error Handling

### Objective

Verify that error conditions are handled gracefully without breaking the user experience.

### Steps

1. **Test invalid credentials**
   - Navigate to `/sign-in`
   - Enter invalid email/password combination
   - **Expected**: Clear error message displayed
   - **Expected**: User remains on sign-in page

2. **Test network connectivity issues**
   - Sign in successfully
   - Simulate network interruption (disable network)
   - Navigate between protected sections
   - **Expected**: Graceful error handling
   - **Expected**: No application crashes

3. **Test unknown user roles**
   - If possible, modify user role to invalid value
   - Access protected area
   - **Expected**: Fallback to default user permissions
   - **Expected**: No application errors

### Success Criteria

- ✅ Invalid credentials handled gracefully
- ✅ Network issues don't crash application
- ✅ Unknown roles fallback to safe defaults

## Performance Validation

### Objective

Verify that performance requirements are met for protected area access.

### Steps

1. **Measure authentication check performance**
   - Open browser developer tools
   - Sign in and navigate to protected area
   - Check Network tab for auth-related requests
   - **Expected**: Auth checks complete within 50ms
   - **Expected**: Total page load under 200ms TTFB

2. **Test navigation switching performance**
   - Switch between navigation tabs rapidly
   - Measure response times
   - **Expected**: Smooth transitions without delays
   - **Expected**: No loading spinners for role checks

### Success Criteria

- ✅ Auth checks complete within performance targets
- ✅ Navigation switching is responsive
- ✅ No visible performance degradation

## Cleanup

### Post-Test Actions

1. **Sign out properly**
   - Click sign-out button
   - Verify redirect to public area

2. **Clear browser data (if needed)**
   - Clear cookies and local storage
   - Verify clean state for future tests

3. **Stop development server**

   ```bash
   # Press Ctrl+C in terminal running npm run dev
   ```

## Troubleshooting

### Common Issues

1. **Redirect loop on sign-in**
   - Check Clerk configuration
   - Verify environment variables
   - Check middleware configuration

2. **Navigation tabs not showing**
   - Verify user role assignment in Clerk
   - Check role permission logic
   - Inspect console for errors

3. **Performance issues**
   - Check server-side auth check implementation
   - Verify no unnecessary client-side auth calls
   - Monitor network requests

### Debug Commands

```bash
# Check application logs
npm run dev

# Run contract tests
npm run test:contract

# Check linting
npm run lint

# Verify build
npm run build
```

## Validation Checklist

### Feature Complete ✅

- [ ] User can sign in and access protected area
- [ ] Role-based navigation works (user vs admin)
- [ ] Sign-out functionality works
- [ ] Security restrictions enforced
- [ ] Performance requirements met
- [ ] Error handling graceful
- [ ] All contract tests pass

### Ready for Production ✅

- [ ] All quickstart scenarios pass
- [ ] No console errors during normal operation
- [ ] Responsive design works on mobile
- [ ] Accessibility requirements met
- [ ] Performance targets achieved

**Status**: 📋 Quickstart Complete - Ready for implementation validation
