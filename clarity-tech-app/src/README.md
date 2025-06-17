# Clarity Pool Services - Technician App

A modern React Native/Expo application for pool service technicians to manage customer onboarding, service requests, and field operations.

## 🏗️ Architecture Overview

This application follows a modular architecture with clear separation of concerns:

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/           # Business logic and API calls
├── hooks/              # Custom React hooks
├── contexts/           # React contexts for state management
├── utils/              # Utility functions
├── constants/          # Application constants
├── styles/             # Theme and styling
├── types/              # TypeScript type definitions
└── assets/             # Static assets
```

## 🚀 Key Features

### PWA Capabilities
- **Offline Support**: Full offline functionality with background sync
- **Service Worker**: Caches resources and handles offline requests
- **Push Notifications**: Real-time notifications for updates
- **App-like Experience**: Installable as a Progressive Web App

### Core Functionality
- **Customer Onboarding**: Complete pool setup and equipment survey
- **Offline-First**: Works without internet connection
- **Photo & Voice Notes**: Capture multimedia data in the field
- **Real-time Sync**: Automatic synchronization when online
- **Secure Authentication**: JWT-based auth with secure token storage

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **Modern React**: Hooks, context, and functional components
- **Performance Optimized**: Code splitting, lazy loading, memoization
- **Error Handling**: Comprehensive error boundaries and logging
- **Testing Ready**: Structured for unit and integration testing

## 📱 Screens

### Authentication
- **LoginScreen**: Secure user authentication

### Main Navigation
- **DashboardScreen**: Overview and quick actions
- **OnboardingsScreen**: Manage customer onboarding processes
- **ProfileScreen**: User profile and settings

### Onboarding Flow
- **CustomerInfo**: Basic customer information
- **WaterChemistry**: Pool chemistry analysis
- **EquipmentSurvey**: Equipment inventory and condition
- **PoolDetails**: Pool specifications and features
- **VoiceNotes**: Audio notes and observations
- **PhotoCapture**: Visual documentation
- **ReviewSubmit**: Final review and submission

## 🛠️ Services

### API Services
- **Authentication**: User login, logout, token management
- **Onboarding**: Customer onboarding operations
- **File Upload**: Photo and voice note uploads
- **Network Recovery**: Automatic retry and error handling

### Storage Services
- **Offline Storage**: Local data persistence
- **Secure Storage**: Encrypted token storage
- **Queue Management**: Offline request queuing
- **Background Sync**: Automatic data synchronization

### Utility Services
- **Error Handling**: Centralized error processing
- **Logging**: Structured application logging
- **Service Worker**: PWA functionality management

## 🎨 UI Components

### Common Components
- **Header**: Navigation header with title and actions
- **LoadingSpinner**: Loading indicators
- **ErrorBoundary**: Error handling wrapper
- **Logo**: Application branding

### Form Components
- **ModernInput**: Styled text input with validation
- **GradientButton**: Gradient-styled buttons
- **EquipmentForm**: Equipment data collection
- **Card**: Material-design inspired cards

### UI Elements
- **SkeletonLoader**: Loading placeholders
- **Various form controls**: Checkboxes, selectors, etc.

## 📦 State Management

### Contexts
- **AuthContext**: User authentication state
- **ThemeContext**: App theme and styling

### Hooks
- **useAuth**: Authentication operations
- **useApi**: API call management with offline support
- **useOfflineQueue**: Offline data management

## 🔒 Security Features

- **Input Sanitization**: XSS protection for all user inputs
- **Secure Token Storage**: Encrypted authentication tokens
- **Request Validation**: Server-side validation
- **Error Logging**: Secure error reporting without sensitive data

## 🌐 Offline Support

The app is designed to work seamlessly offline:

1. **Data Caching**: Critical data cached locally
2. **Request Queuing**: Failed requests queued for retry
3. **Background Sync**: Automatic sync when connection restored
4. **Offline UI**: Clear indicators for offline status
5. **Conflict Resolution**: Handles data conflicts gracefully

## 📐 Development Guidelines

### Code Style
- **TypeScript**: Strict typing enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks

### Performance
- **Memoization**: React.memo for component optimization
- **Lazy Loading**: Dynamic imports for code splitting
- **Image Optimization**: Efficient image handling
- **Bundle Analysis**: Regular bundle size monitoring

### Testing
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API and service testing
- **E2E Tests**: Complete user flow testing
- **Performance Tests**: Load and stress testing

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Development**:
   ```bash
   npm run web:dev    # Web development
   npm run android    # Android development
   npm run ios        # iOS development
   ```

4. **Production Build**:
   ```bash
   npm run web-build  # Production web build
   npm run serve      # Serve production build
   ```

## 📄 Environment Variables

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.claritypoolservices.com
EXPO_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
EXPO_PUBLIC_ENVIRONMENT=production
```

## 🤝 Contributing

1. Follow the established code patterns
2. Add TypeScript types for all new code
3. Include error handling for all operations
4. Test offline functionality
5. Update documentation for new features

## 📋 Module Documentation

Each major module includes its own README with specific implementation details:

- **[Services](./services/README.md)**: API and business logic
- **[Components](./components/README.md)**: UI component library
- **[Utils](./utils/README.md)**: Utility functions and helpers
- **[Navigation](./navigation/README.md)**: App navigation structure

## 🔧 Troubleshooting

### Common Issues
1. **Build Errors**: Clear node_modules and reinstall
2. **Type Errors**: Run `npx tsc --noEmit` for type checking
3. **Service Worker**: Clear browser cache for updates
4. **Offline Sync**: Check network tab for failed requests

### Debug Mode
- Enable debug logging in development
- Use React DevTools for component inspection
- Monitor network requests in browser tools
- Check offline queue status in app