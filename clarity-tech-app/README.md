# Clarity Pool Services Technician App

A complete Expo PWA for pool service technicians to manage customer onboardings with offline capabilities.

## Features

### ✅ Completed Features

- **Modern Authentication System**
  - JWT token-based authentication
  - Remember me functionality
  - Offline-capable login with AsyncStorage

- **Dashboard with Real-time Stats**
  - Today's overview with completion stats
  - Pull to refresh functionality
  - Recent onboardings list
  - Beautiful gradient cards with animations

- **Complete Onboarding Flow**
  - **Customer Info**: Full contact and address details
  - **Water Chemistry**: pH, chlorine, alkalinity, and optional readings
  - **Equipment**: Photo capture, condition tracking, multiple equipment types
  - **Pool Details**: Dimensions, features, auto-calculated volume
  - **Voice Notes**: Optional audio recording for additional observations

- **Offline-First Architecture**
  - All data stored locally with AsyncStorage
  - Automatic sync when connection returns
  - Queue system for pending API calls
  - Draft saving for incomplete onboardings

- **Modern UI Components**
  - Floating label inputs with validation
  - Gradient buttons with loading states
  - Progress indicators
  - Bottom sheets for forms
  - Card layouts with shadows
  - Smooth animations (300ms transitions)

- **PWA Configuration**
  - Standalone display mode
  - Custom splash screen and theme colors
  - Web app manifest
  - Responsive design

## Tech Stack

- **Framework**: Expo (React Native for Web)
- **TypeScript**: Full type safety
- **Navigation**: React Navigation with bottom tabs
- **Forms**: React Hook Form with Zod validation
- **Offline**: AsyncStorage + custom sync queue
- **UI**: Custom component library with Expo Vector Icons
- **Audio**: Expo AV for voice recording
- **Camera**: Expo Camera & Image Picker
- **Networking**: Axios with interceptors

## Color Scheme

- **Primary**: Sea Foam (#D2E2E1) → Blue Green (#577C8E) → Dark Blue (#2F4157)
- **Accents**: Success (#4CAF50), Error (#EF4444), Warning (#F59E0B)
- **Neutrals**: Light Gray (#F0F4F8), Gray (#697689)

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form components
│   └── common/       # Shared components
├── screens/
│   ├── auth/         # Authentication screens
│   ├── dashboard/    # Main dashboard
│   ├── onboarding/   # Multi-step onboarding flow
│   └── profile/      # User profile
├── navigation/       # App navigation setup
├── services/
│   ├── api/          # API client and endpoints
│   ├── storage/      # Offline storage and sync
│   └── utils/        # Constants and utilities
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── styles/           # Theme and color definitions
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   # Web
   npm run web
   
   # iOS (requires macOS)
   npm run ios
   
   # Android
   npm run android
   ```

3. **Environment Setup**
   - Set `EXPO_PUBLIC_API_URL` environment variable for your API endpoint
   - Configure camera and microphone permissions for mobile

## API Integration

The app is designed to work with a REST API. Key endpoints expected:

- `POST /auth/login` - User authentication
- `POST /onboarding/create` - Create new onboarding
- `GET /onboarding/list` - List onboardings
- `POST /onboarding/upload-photo` - Upload equipment photos
- `POST /onboarding/upload-voice` - Upload voice notes

## Offline Capabilities

- **Local Storage**: All form data saved to AsyncStorage
- **Sync Queue**: Failed API calls queued for retry
- **Draft System**: Incomplete onboardings saved as drafts
- **Connection Monitoring**: Real-time online/offline status
- **Automatic Retry**: Exponential backoff for failed requests

## PWA Features

- **Installable**: Can be installed as a native-like app
- **Offline Capable**: Core functionality works without internet
- **Responsive**: Adapts to different screen sizes
- **Fast Loading**: Optimized bundle with code splitting

## Key Components

### ModernInput
Floating label input with validation and icon support

### GradientButton  
Customizable button with gradient backgrounds and loading states

### ProgressBar
Animated progress indicator for multi-step flows

### OfflineIndicator
Shows connection status to users

### BottomSheet
Modal sheet for forms and additional content

## Form Validation

All forms use Zod schemas for validation:
- Email format validation
- Phone number formatting
- Required field checking
- Numeric range validation for pool chemistry

## Performance Features

- Concurrent API calls where possible
- Optimized re-renders with React.memo
- Debounced form inputs
- Lazy loading for images
- Efficient list rendering with FlatList

## Accessibility

- Semantic HTML for web
- Screen reader support
- High contrast mode support
- Keyboard navigation
- Touch targets >= 44px

This is a production-ready app with proper error handling, loading states, and user feedback throughout the entire user journey.