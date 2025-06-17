# Services Module

The services module contains all business logic, API interactions, and data management functionality.

## 📁 Structure

```
services/
├── api/                # API client and endpoint handlers
├── storage/            # Data persistence and caching
├── sync/              # Background synchronization
└── network/           # Network management and recovery
```

## 🌐 API Services

### Client Configuration
- **Base URL**: Configurable API endpoint
- **Authentication**: JWT token management
- **Request Interceptors**: Automatic token attachment
- **Response Interceptors**: Error handling and token refresh
- **Timeout Handling**: Configurable request timeouts

### Authentication Service (`api/auth.ts`)
```typescript
/**
 * Authenticate user with email and password
 */
export const loginUser = async (email: string, password: string): Promise<ApiResponse<LoginResponse>>

/**
 * Refresh authentication token
 */
export const refreshToken = async (): Promise<ApiResponse<RefreshResponse>>

/**
 * Logout user and invalidate tokens
 */
export const logoutUser = async (): Promise<ApiResponse<void>>
```

### Onboarding Service (`api/onboarding.ts`)
```typescript
/**
 * Create new customer onboarding
 */
export const createOnboarding = async (data: OnboardingData): Promise<ApiResponse<OnboardingResponse>>

/**
 * Upload photo for onboarding
 */
export const uploadOnboardingPhoto = async (file: File, onboardingId: string): Promise<ApiResponse<UploadResponse>>

/**
 * Upload voice note for onboarding
 */
export const uploadVoiceNote = async (file: File, onboardingId: string): Promise<ApiResponse<UploadResponse>>
```

## 💾 Storage Services

### Offline Storage (`storage/offline.ts`)
Manages local data persistence and offline queue functionality.

#### Queue Management
- **Request Queuing**: Store failed requests for later retry
- **Data Drafts**: Save incomplete forms locally
- **Retry Logic**: Automatic retry with exponential backoff
- **Conflict Resolution**: Handle data conflicts during sync

#### Key Methods
```typescript
/**
 * Add request to offline queue
 */
async saveToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void>

/**
 * Get all queued requests
 */
async getQueue(): Promise<OfflineQueueItem[]>

/**
 * Save draft data locally
 */
async saveDraft(draft: Partial<OnboardingData>): Promise<void>

/**
 * Move failed item to failed queue
 */
async moveToFailed(item: OfflineQueueItem, errorMessage: string): Promise<void>
```

### Secure Storage (`storage/secureStorage.ts`)
Handles encrypted storage for sensitive data like authentication tokens.

#### Features
- **Token Encryption**: Secure storage for JWT tokens
- **Cross-Platform**: Works on web and mobile
- **Automatic Cleanup**: Token cleanup on logout
- **Migration Support**: Handle storage format changes

### Queue Management (`storage/queue.ts`)
Advanced queue management with priority and retry logic.

#### Features
- **Priority Queues**: High, normal, and low priority requests
- **Retry Strategies**: Exponential backoff with jitter
- **Queue Statistics**: Monitor queue health and performance
- **Batch Processing**: Process multiple items efficiently

## 🔄 Sync Services

### Background Sync (`sync/backgroundSync.ts`)
Handles automatic synchronization of offline data when connectivity is restored.

#### Key Features
- **Service Worker Integration**: Uses browser background sync API
- **Progress Tracking**: Real-time sync progress updates
- **Error Handling**: Comprehensive error recovery
- **Conflict Resolution**: Handle data conflicts during sync

#### Main Methods
```typescript
/**
 * Process offline queue items
 */
async processOfflineQueue(): Promise<SyncResult>

/**
 * Manually trigger sync process
 */
async triggerSync(): Promise<SyncResult>

/**
 * Add sync progress listener
 */
addProgressListener(listener: (progress: SyncProgress) => void): void

/**
 * Retry all failed items
 */
async retryFailedItems(): Promise<number>
```

## 🌐 Network Services

### Network Recovery (`network/networkRecovery.ts`)
Handles network connectivity monitoring and automatic recovery.

#### Features
- **Connection Monitoring**: Real-time network status tracking
- **Automatic Retry**: Smart retry logic for failed requests
- **Circuit Breaker**: Prevent cascade failures
- **Health Checks**: Periodic connectivity verification

## 🔧 Configuration

### Environment Variables
```bash
EXPO_PUBLIC_API_BASE_URL=https://api.claritypoolservices.com
EXPO_PUBLIC_REQUEST_TIMEOUT=30000
EXPO_PUBLIC_RETRY_ATTEMPTS=3
EXPO_PUBLIC_OFFLINE_SYNC_INTERVAL=60000
```

### Constants
All service constants are centralized in `/constants/api.ts`:
- API endpoints
- HTTP status codes
- Error types
- Timeout values
- Retry configurations

## 📊 Monitoring & Analytics

### Logging
All services include comprehensive logging:
- **Request/Response Logging**: Track API calls
- **Error Logging**: Detailed error information
- **Performance Metrics**: Track response times
- **Offline Analytics**: Monitor offline usage patterns

### Health Checks
- **API Connectivity**: Periodic health checks
- **Queue Health**: Monitor queue size and age
- **Storage Health**: Check storage quotas
- **Sync Status**: Track synchronization health

## 🚀 Performance Optimization

### Caching Strategies
- **API Response Caching**: Cache GET requests
- **Image Caching**: Optimize image loading
- **Metadata Caching**: Cache frequently accessed data
- **Smart Invalidation**: Efficient cache invalidation

### Request Optimization
- **Request Batching**: Combine multiple requests
- **Response Compression**: Reduce payload size
- **Connection Pooling**: Reuse HTTP connections
- **Parallel Processing**: Concurrent request handling

## 🔒 Security

### Data Protection
- **Input Sanitization**: Clean all user inputs
- **Token Security**: Secure token storage and transmission
- **Request Validation**: Validate all outgoing requests
- **Error Sanitization**: Remove sensitive data from errors

### Authentication
- **JWT Tokens**: Secure authentication tokens
- **Token Refresh**: Automatic token renewal
- **Session Management**: Secure session handling
- **Logout Cleanup**: Complete data cleanup on logout

## 🧪 Testing

### Unit Tests
- **Service Method Testing**: Test individual methods
- **Mock API Responses**: Test with controlled data
- **Error Scenarios**: Test error handling
- **Edge Cases**: Test boundary conditions

### Integration Tests
- **End-to-End Flows**: Test complete user flows
- **Offline Scenarios**: Test offline functionality
- **Sync Testing**: Test synchronization logic
- **Performance Testing**: Measure service performance

## 📋 Best Practices

### Error Handling
- Always use the centralized error handler
- Provide user-friendly error messages
- Log errors with context information
- Implement retry logic for transient errors

### Offline Support
- Queue all mutations for offline support
- Cache critical data locally
- Provide offline indicators
- Handle conflicts gracefully

### Performance
- Use request caching where appropriate
- Implement request cancellation
- Monitor and optimize payload sizes
- Use compression for large requests

### Security
- Validate all inputs
- Use secure storage for sensitive data
- Implement proper error handling
- Follow security best practices