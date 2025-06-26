# API Connection Update Summary

## Changes Made

### 1. **Updated API Configuration** (`src/config/api.ts`)
- Changed development URL from `http://localhost:3000` to `https://clarity-pool-api.onrender.com`
- Now uses production API even in development mode

### 2. **Enabled Real API Features** (`.env`)
Added the following environment variables to enable real API calls:
```
EXPO_PUBLIC_USE_REAL_AUTH=true
EXPO_PUBLIC_USE_REAL_OFFERS=true
EXPO_PUBLIC_USE_REAL_ONBOARDING=true
```

### 3. **Added API Health Check** (`App.tsx`)
- Added automatic API connectivity test on app startup
- Logs success/failure to console for debugging

## How It Works

1. **Authentication**: When users log in, the app now calls the real API at `https://clarity-pool-api.onrender.com/api/auth/technician/login`
2. **Offers**: Real-time offer data is fetched from the API instead of using mock data
3. **Onboarding**: Session data is saved to the real API backend

## Testing the Connection

1. Start the app and check the console for: `✅ API Connected: {status: "ok"}`
2. Try logging in with valid credentials created in the API
3. The test account (`test@claritypool.com`) will still work if the API is down

## Rollback Instructions

If you need to switch back to mock data:
1. Change the environment variables in `.env` to `false`
2. Or update `src/config/api.ts` to use localhost for development

## API Endpoints Used

- Health Check: `GET /health`
- Login: `POST /api/auth/technician/login`
- Offers: `GET /api/offers/technician/:techId`
- Accept Offer: `POST /api/offers/:id/accept`
- Decline Offer: `POST /api/offers/:id/decline`
- Onboarding: Various endpoints under `/api/onboarding`

## Notes

- The app will automatically retry failed requests with exponential backoff
- Offline functionality is preserved - actions are queued when offline
- Token refresh is handled automatically