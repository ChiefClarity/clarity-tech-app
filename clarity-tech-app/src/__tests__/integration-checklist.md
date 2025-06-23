# Clarity Tech App - API Integration Testing Checklist

## Prerequisites

### 1. Environment Setup
- [ ] Ensure `.env.local` exists with correct values:
  ```
  EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
  EXPO_PUBLIC_USE_REAL_AUTH=true
  EXPO_PUBLIC_USE_REAL_OFFERS=true
  EXPO_PUBLIC_USE_REAL_ONBOARDING=true
  EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
  ```

### 2. Start Services
- [ ] **Terminal 1**: Start API server
  ```bash
  cd ../clarity-pool-api
  npm run start:dev
  ```
  Verify API is running at http://localhost:3000

- [ ] **Terminal 2**: Start Tech App
  ```bash
  cd clarity-tech-app
  npm run web
  ```
  App should open at http://localhost:19006 or similar port

## Authentication Testing

### 3. Login Flow
- [ ] Open browser DevTools (F12) → Network tab
- [ ] Navigate to login screen
- [ ] Enter credentials: `test@claritypool.com` / `test123`
- [ ] Click Login
- [ ] **Verify**: Network tab shows POST to `/api/auth/technician/login`
- [ ] **Verify**: Response contains `token`, `refreshToken`, and `user` object
- [ ] **Verify**: Redirected to dashboard

### 4. Token Storage
- [ ] Open DevTools → Application → Local Storage
- [ ] **Verify**: `@clarity_secure_token` is stored
- [ ] **Verify**: `@clarity_secure_refresh_token` is stored
- [ ] **Verify**: `@clarity_user_data` contains user info

### 5. Token Refresh
- [ ] Wait for token to expire (or manually delete token)
- [ ] Perform any authenticated action
- [ ] **Verify**: Network tab shows `/api/auth/technician/refresh` call
- [ ] **Verify**: New token is stored

## Offers Testing

### 6. Fetch Offers
- [ ] Navigate to Offers screen
- [ ] **Verify**: Network tab shows GET to `/api/offers/technician`
- [ ] **Verify**: Offers appear in the UI
- [ ] **Verify**: Expiration timers are counting down

### 7. Accept Offer
- [ ] Click on a pending offer
- [ ] Click "Accept Offer"
- [ ] **Verify**: Network tab shows POST to `/api/offers/{id}/accept`
- [ ] **Verify**: Offer status changes to "Accepted"
- [ ] **Verify**: 2-minute undo timer starts

### 8. Undo Action
- [ ] Within 2 minutes, click "Undo"
- [ ] **Verify**: Network tab shows POST to `/api/offers/{id}/undo`
- [ ] **Verify**: Offer returns to pending status

### 9. Decline Offer
- [ ] Click on another pending offer
- [ ] Click "Decline"
- [ ] **Verify**: Network tab shows POST to `/api/offers/{id}/decline`
- [ ] **Verify**: Offer status changes to "Declined"

## Onboarding Testing

### 10. View Sessions
- [ ] Navigate to Onboarding screen
- [ ] **Verify**: Network tab shows GET to `/api/onboarding/sessions/technician`
- [ ] **Verify**: Sessions list appears

### 11. Start Session
- [ ] Click on a pending session
- [ ] Click "Start Onboarding"
- [ ] **Verify**: Network tab shows POST to `/api/onboarding/sessions/{id}/start`
- [ ] **Verify**: Session status changes to "In Progress"

### 12. Water Chemistry
- [ ] Fill out water chemistry form:
  - pH: 7.4
  - Chlorine: 2.0
  - Alkalinity: 100
  - etc.
- [ ] Click "Save"
- [ ] **Verify**: Network tab shows POST to `/api/onboarding/sessions/{id}/water-chemistry`
- [ ] **Verify**: Success message appears

### 13. Equipment
- [ ] Navigate to Equipment step
- [ ] Add equipment:
  - Type: Pump
  - Brand: Pentair
  - Model: SuperFlo
  - Condition: Good
- [ ] Click "Save"
- [ ] **Verify**: Network tab shows POST to `/api/onboarding/sessions/{id}/equipment`

### 14. Pool Details
- [ ] Navigate to Pool Details step
- [ ] Fill form:
  - Size: 20,000 gallons
  - Type: Gunite
  - Features: Select multiple
- [ ] Click "Save"
- [ ] **Verify**: Network tab shows POST to `/api/onboarding/sessions/{id}/pool-details`

### 15. Photo Upload
- [ ] Take or select a photo
- [ ] **Verify**: Network tab shows POST to `/api/onboarding/sessions/{id}/photos`
- [ ] **Verify**: Photo appears in gallery

### 16. Voice Note
- [ ] Record a voice note (10+ seconds)
- [ ] Click "Save Recording"
- [ ] **Verify**: Network tab shows POST to `/api/onboarding/sessions/{id}/voice-note`

### 17. Complete Session
- [ ] Navigate to final step
- [ ] Click "Complete Onboarding"
- [ ] **Verify**: Network tab shows POST to `/api/onboarding/sessions/{id}/complete`
- [ ] **Verify**: Redirected to success screen

## Offline Mode Testing

### 18. Disconnect Network
- [ ] Open DevTools → Network → Set to "Offline"
- [ ] Or disconnect WiFi/Ethernet

### 19. Offline Operations
- [ ] Accept an offer
- [ ] **Verify**: No network errors shown to user
- [ ] **Verify**: UI updates optimistically
- [ ] **Verify**: Sync indicator shows pending items

### 20. Data Persistence
- [ ] Refresh the page while offline
- [ ] **Verify**: Accepted offers still show as accepted
- [ ] **Verify**: Login state is maintained

### 21. Reconnect & Sync
- [ ] Re-enable network connection
- [ ] **Verify**: Sync indicator shows "Syncing..."
- [ ] **Verify**: Network tab shows queued API calls
- [ ] **Verify**: All pending actions complete successfully

## Error Handling

### 22. API Errors
- [ ] Stop the API server
- [ ] Try to fetch offers
- [ ] **Verify**: User-friendly error message appears
- [ ] **Verify**: App doesn't crash

### 23. Invalid Token
- [ ] Manually edit token in storage to invalid value
- [ ] Perform authenticated action
- [ ] **Verify**: Redirected to login screen
- [ ] **Verify**: Error message about session expiry

## Performance

### 24. Loading States
- [ ] Clear browser cache
- [ ] Login fresh
- [ ] **Verify**: Loading spinners appear during API calls
- [ ] **Verify**: No UI flashing or jumps

### 25. Concurrent Requests
- [ ] Navigate quickly between screens
- [ ] **Verify**: No duplicate API calls
- [ ] **Verify**: Previous requests are cancelled

## Console Checks

### 26. Debug Logs
Enable debug mode and verify logs for:
- [ ] API request/response logs
- [ ] Token refresh logs
- [ ] Offline queue operations
- [ ] State updates

### 27. No Errors
- [ ] **Verify**: No red errors in console
- [ ] **Verify**: No unhandled promise rejections
- [ ] **Verify**: No memory leak warnings

## Common Issues & Solutions

### CORS Errors
If you see CORS errors in console:
1. Check API `main.ts` has correct CORS config:
   ```typescript
   app.enableCors({
     origin: ['http://localhost:19006', 'http://localhost:3000'],
     credentials: true
   });
   ```

### 404 Not Found
If API returns 404:
1. Verify endpoint paths in `src/constants/api.ts`
2. Check API has matching routes
3. Ensure `:id` parameters are replaced correctly

### 401 Unauthorized
If getting 401 errors:
1. Check token is in Authorization header: `Bearer {token}`
2. Verify token format is correct
3. Check token hasn't expired

### No Data Returned
If API returns empty data:
1. Check database is seeded
2. Verify technician ID matches data
3. Check API query filters

### Network Errors
If network requests fail:
1. Verify API is running on correct port
2. Check no firewall blocking
3. Try `127.0.0.1` instead of `localhost`

## Sign-off

- [ ] All tests passed
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Offline mode works
- [ ] Error handling confirmed

**Tested by**: _______________  
**Date**: _______________  
**API Version**: _______________  
**App Version**: _______________