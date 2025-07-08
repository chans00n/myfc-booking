# Intake Form ID Investigation Report

## Issue Summary

User is seeing another user's intake form ID (8202e27f-bb79-4d24-a793-a65460fa2e44), which is a critical security issue.

## Key Findings

### 1. Database Security (RLS)

- **Status**: ✅ Properly configured
- Row Level Security (RLS) is enabled on the `intake_forms` table
- Policies correctly restrict access to only the form owner or admins
- The `getIntakeForm` function in `/lib/intake-forms/index.ts` validates ownership before returning data

### 2. Frontend State Management

- **Status**: ⚠️ Potential issue
- The `BookingContext` stores `intakeFormId` in its state
- The context is provided at the page level (`/app/(booking)/booking/page.tsx`)
- No evidence of global/shared state between users

### 3. Storage Mechanisms

- **Status**: ✅ Minimal usage
- `sessionStorage` is used for:
  - Storing appointment details after payment (`lastAppointment`)
  - Post-booking signup flow (`postBookingSignup`)
- No `localStorage` usage for intake forms
- No hardcoded form IDs found

### 4. Intake Form Creation Flow

In `IntakeFormStep.tsx`:

1. Checks if form is required based on user history
2. If `bookingData.intakeFormId` exists, tries to fetch it
3. If not found or doesn't exist, creates a new form
4. Updates booking context with the new form ID

## Potential Issues Identified

### 1. Race Condition in Form Creation

**Location**: `/components/booking/steps/IntakeFormStep.tsx` lines 84-102

The component checks `bookingData.intakeFormId` and if it exists, tries to use it. If multiple users hit this simultaneously, there could be a race condition.

### 2. Missing User ID Validation

While the backend validates ownership, the frontend might be receiving a form ID from somewhere that hasn't been properly cleared.

### 3. Booking Context Not Cleared

The `BookingContext` might not be properly reset between different user sessions if the component is being reused.

## Recommended Fixes

### 1. Add User ID Validation in IntakeFormStep

```typescript
// In IntakeFormStep.tsx, after line 85
if (bookingData.intakeFormId) {
  const { data: existingForm } = await getIntakeForm(bookingData.intakeFormId);
  if (existingForm && existingForm.client_id === user.id) {
    // Only use the form if it belongs to the current user
    if (existingForm.status === "submitted") {
      setFormCompleted(true);
      onValidate(true);
    } else {
      setFormId(bookingData.intakeFormId);
    }
  } else {
    // Form doesn't belong to user or doesn't exist
    // Clear the invalid ID and create a new form
    updateBookingData({ intakeFormId: null });
    await createNewForm(user.id, requirement.formType);
  }
}
```

### 2. Clear Booking Context on Component Mount

```typescript
// In BookingWizard.tsx, add at the beginning of the component
useEffect(() => {
  // Reset booking data when component mounts to ensure clean state
  resetBooking();
}, []);
```

### 3. Add Debug Logging

```typescript
// In IntakeFormStep.tsx checkIntakeRequirement function
console.log("Intake form check debug:", {
  userId: user.id,
  existingFormId: bookingData.intakeFormId,
  timestamp: new Date().toISOString(),
});
```

### 4. Verify Backend Response

Ensure the `getIntakeForm` function returns proper error when user tries to access another user's form.

## Immediate Actions

1. **Check server logs** for any unauthorized access attempts
2. **Add monitoring** for intake form access patterns
3. **Implement the user ID validation** in IntakeFormStep
4. **Clear booking context** on component mount
5. **Add comprehensive logging** to track how form IDs are being passed

## Testing Recommendations

1. Test with multiple concurrent users
2. Test browser refresh during booking flow
3. Test with users switching accounts
4. Monitor for any caching issues at CDN/proxy level

## Conclusion

The issue appears to be in the frontend state management where an intake form ID might be persisting in the booking context and being reused for different users. The backend security is properly configured, but the frontend needs additional validation to ensure users can only access their own forms.
