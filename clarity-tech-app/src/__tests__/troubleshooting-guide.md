# API Integration Troubleshooting Guide

## Quick Diagnostics

Run this command to check your setup:
```bash
npm run test:integration
```

## Common Issues & Solutions

### 1. CORS Errors

**Symptoms:**
- Browser console shows: `Access to XMLHttpRequest at 'http://localhost:3000/...' from origin 'http://localhost:19006' has been blocked by CORS policy`

**Solutions:**

1. **Update API CORS configuration** in `clarity-pool-api/src/main.ts`:
```typescript
app.enableCors({
  origin: [
    'http://localhost:19006',
    'http://localhost:19007',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

2. **Check API is running** on the correct port:
```bash
# Should show API running
curl http://localhost:3000/health
```

### 2. 404 Not Found Errors

**Symptoms:**
- API returns 404 for endpoints
- Network tab shows red 404 responses

**Solutions:**

1. **Verify endpoint paths match exactly**:
```typescript
// API should have:
@Post('auth/technician/login')  // NOT just 'login'
@Get('offers/technician')        // NOT 'offers/:techId'
```

2. **Check route prefixes** in API controllers:
```typescript
@Controller('api')  // Global prefix
export class AppController {
  @Controller('auth')  // Results in /api/auth/*
  export class AuthController {}
}
```

3. **Verify parameter replacements**:
```typescript
// Wrong:
const endpoint = '/api/offers/:id/accept';
apiClient.post(endpoint);  // Sends literal ':id'

// Correct:
const endpoint = API_ENDPOINTS.OFFERS.ACCEPT.replace(':id', offerId);
apiClient.post(endpoint);  // Sends actual ID
```

### 3. Authentication Failures

**Symptoms:**
- 401 Unauthorized errors
- Redirected to login unexpectedly
- "No token available" errors

**Solutions:**

1. **Check token format**:
```javascript
// Open DevTools Console and run:
localStorage.getItem('@clarity_secure_token')
// Should return a JWT like: eyJhbGc...

// Decode to check expiry:
JSON.parse(atob(token.split('.')[1]))
```

2. **Verify Authorization header**:
- Network tab → Request → Headers
- Should see: `Authorization: Bearer eyJhbGc...`

3. **Check token storage**:
```javascript
// If using AsyncStorage on web:
localStorage.getItem('@clarity_secure_token')
localStorage.getItem('@clarity_secure_refresh_token')
localStorage.getItem('@clarity_user_data')
```

4. **Force re-login**:
```javascript
// Clear all auth data
localStorage.clear();
// Reload page
window.location.reload();
```

### 4. No Data Returned

**Symptoms:**
- Empty offers list
- Empty onboarding sessions
- API returns `{ data: [] }`

**Solutions:**

1. **Check database seeding**:
```bash
cd ../clarity-pool-api
npm run seed  # If available
```

2. **Verify technician ID matches**:
```javascript
// Check logged-in user ID
const userData = JSON.parse(localStorage.getItem('@clarity_user_data'));
console.log('Technician ID:', userData.id);
```

3. **Check API query filters**:
```typescript
// API might filter by technicianId
@Get('offers/technician')
async getTechnicianOffers(@User() user) {
  return this.offersService.findByTechnicianId(user.id);
}
```

### 5. Network Connection Issues

**Symptoms:**
- "Network Error" messages
- ERR_CONNECTION_REFUSED
- Timeouts

**Solutions:**

1. **Try different localhost formats**:
```javascript
// In .env.local try:
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000
// or
EXPO_PUBLIC_API_BASE_URL=http://[::1]:3000  // IPv6
```

2. **Check firewall/antivirus**:
- Temporarily disable firewall
- Add exceptions for ports 3000 and 19006

3. **Verify no port conflicts**:
```bash
# Check what's using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows
```

### 6. Offline Mode Issues

**Symptoms:**
- Data not persisting offline
- Sync queue not working
- Lost data after refresh

**Solutions:**

1. **Check offline detection**:
```javascript
// In console:
navigator.onLine  // Should be false when offline
```

2. **Verify storage persistence**:
```javascript
// Check sync queue
localStorage.getItem('@clarity_sync_queue')
```

3. **Force offline mode**:
- DevTools → Network → Offline checkbox
- Or disconnect WiFi/Ethernet

### 7. Token Refresh Issues

**Symptoms:**
- Multiple login prompts
- "Refresh token expired"
- Infinite refresh loops

**Solutions:**

1. **Check refresh token endpoint**:
```bash
# Test manually
curl -X POST http://localhost:3000/api/auth/technician/refresh \
  -H "Authorization: Bearer {refresh_token}" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "{refresh_token}"}'
```

2. **Verify refresh logic**:
- Should only retry once
- Should clear tokens on failure
- Should emit 'auth:failed' event

### 8. Performance Issues

**Symptoms:**
- Slow API responses
- UI freezing
- Memory warnings

**Solutions:**

1. **Check for duplicate requests**:
- Network tab shouldn't show duplicate API calls
- useEffect dependencies are correct

2. **Enable request deduplication**:
```javascript
// Check for AbortController usage
const controller = new AbortController();
// Cleanup on unmount
return () => controller.abort();
```

## Debug Mode

Enable comprehensive logging:

1. **Browser Console**:
```javascript
// Enable verbose logging
localStorage.setItem('DEBUG', 'true');
window.location.reload();
```

2. **Network Tab**:
- Enable "Preserve log"
- Filter by XHR/Fetch
- Check request/response details

3. **React Developer Tools**:
- Check component props/state
- Verify context values
- Monitor re-renders

## API Health Checks

1. **Basic connectivity**:
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

2. **Auth endpoints**:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/technician/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@claritypool.com","password":"test123"}'
```

3. **Protected endpoints**:
```bash
# Get offers (requires token)
curl http://localhost:3000/api/offers/technician \
  -H "Authorization: Bearer {token}"
```

## Environment Verification

1. **Check all env variables**:
```javascript
console.log({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  USE_REAL_AUTH: process.env.EXPO_PUBLIC_USE_REAL_AUTH,
  USE_REAL_OFFERS: process.env.EXPO_PUBLIC_USE_REAL_OFFERS,
  USE_REAL_ONBOARDING: process.env.EXPO_PUBLIC_USE_REAL_ONBOARDING,
});
```

2. **Verify feature flags**:
```javascript
import { FEATURES } from './src/config/featureFlags';
console.log('Feature flags:', FEATURES);
```

## Still Having Issues?

1. **Clear everything and start fresh**:
```bash
# Clear all storage
localStorage.clear()
sessionStorage.clear()

# Clear Expo cache
rm -rf .expo
rm -rf node_modules/.cache

# Reinstall and restart
npm install
npm run web
```

2. **Check for updates**:
```bash
# Update dependencies
npm update

# Check for security issues
npm audit fix
```

3. **Enable maximum logging**:
- Add `console.log` statements in:
  - API interceptors
  - Auth context
  - Offer context
  - Service methods

4. **Create minimal reproduction**:
- Test with just login
- Test with single API call
- Isolate the failing component

## Contact Support

If none of the above solutions work:

1. Collect logs:
   - Browser console output
   - Network tab HAR export
   - API server logs

2. Document:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

3. Report issue:
   - GitHub Issues
   - Include minimal reproduction
   - Attach collected logs