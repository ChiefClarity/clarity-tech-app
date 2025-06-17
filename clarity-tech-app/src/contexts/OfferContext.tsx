import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Offer, OfferStatus, PendingAction, OfferState } from '../types';
import { useOffline } from '../hooks/useOffline';
import { FEATURES } from '../config/featureFlags';

// TODO: Offer assignment algorithm
// Score = (proximityWeight * (1/distance)) + (ratingWeight * rating)
// proximityWeight = 0.6, ratingWeight = 0.4
// Sort techs by score, offer to highest first

const STORAGE_KEYS = {
  OFFERS: '@clarity_offers',
  OFFER_STATUSES: '@clarity_offer_statuses',
  ACCEPTANCE_TIMESTAMPS: '@clarity_acceptance_timestamps',
  SYNC_QUEUE: '@clarity_sync_queue',
};

const OFFER_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes
const UNDO_TIME_LIMIT = 2 * 60 * 1000; // 2 minutes
const EXPIRATION_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Action types
type OfferAction =
  | { type: 'LOAD_STATE'; payload: Partial<OfferState> }
  | { type: 'ADD_OFFER'; payload: Offer }
  | { type: 'UPDATE_OFFER_STATUS'; payload: { offerId: string; status: OfferStatus } }
  | { type: 'SET_ACCEPTANCE_TIMESTAMP'; payload: { offerId: string; timestamp: Date } }
  | { type: 'REMOVE_ACCEPTANCE_TIMESTAMP'; payload: { offerId: string } }
  | { type: 'ADD_TO_SYNC_QUEUE'; payload: PendingAction }
  | { type: 'REMOVE_FROM_SYNC_QUEUE'; payload: { actionId: string } }
  | { type: 'UPDATE_SYNC_QUEUE_RETRY'; payload: { actionId: string; retryCount: number } }
  | { type: 'CLEAR_SYNC_QUEUE' }
  | { type: 'EXPIRE_OFFERS'; payload: { expiredOfferIds: string[] } };

// Initial state
const initialState: OfferState = {
  offers: new Map(),
  offerStatuses: new Map(),
  acceptanceTimestamps: new Map(),
  syncQueue: [],
};

// Reducer
function offerReducer(state: OfferState, action: OfferAction): OfferState {
  console.log(`🔄 [REDUCER] Action dispatched:`, action.type, action.payload);
  
  switch (action.type) {
    case 'LOAD_STATE': {
      console.log(`🔄 [REDUCER] Loading state:`, action.payload);
      return {
        ...state,
        ...action.payload,
      };
    }

    case 'ADD_OFFER': {
      console.log(`🔄 [REDUCER] Adding offer:`, action.payload.id);
      const newOffers = new Map(state.offers);
      const newStatuses = new Map(state.offerStatuses);
      
      newOffers.set(action.payload.id, action.payload);
      newStatuses.set(action.payload.id, 'pending');
      
      console.log(`🔄 [REDUCER] Offers map size after add:`, newOffers.size);
      
      return {
        ...state,
        offers: newOffers,
        offerStatuses: newStatuses,
      };
    }

    case 'UPDATE_OFFER_STATUS': {
      console.log(`🔄 [REDUCER] Updating offer status: ${action.payload.offerId} -> ${action.payload.status}`);
      const newStatuses = new Map(state.offerStatuses);
      const oldStatus = newStatuses.get(action.payload.offerId);
      newStatuses.set(action.payload.offerId, action.payload.status);
      
      console.log(`🔄 [REDUCER] Status change: ${oldStatus} -> ${action.payload.status}`);
      
      return {
        ...state,
        offerStatuses: newStatuses,
      };
    }

    case 'SET_ACCEPTANCE_TIMESTAMP': {
      const newTimestamps = new Map(state.acceptanceTimestamps);
      newTimestamps.set(action.payload.offerId, action.payload.timestamp);
      
      return {
        ...state,
        acceptanceTimestamps: newTimestamps,
      };
    }

    case 'REMOVE_ACCEPTANCE_TIMESTAMP': {
      const newTimestamps = new Map(state.acceptanceTimestamps);
      newTimestamps.delete(action.payload.offerId);
      
      return {
        ...state,
        acceptanceTimestamps: newTimestamps,
      };
    }

    case 'ADD_TO_SYNC_QUEUE': {
      return {
        ...state,
        syncQueue: [...state.syncQueue, action.payload],
      };
    }

    case 'REMOVE_FROM_SYNC_QUEUE': {
      return {
        ...state,
        syncQueue: state.syncQueue.filter(item => item.id !== action.payload.actionId),
      };
    }

    case 'UPDATE_SYNC_QUEUE_RETRY': {
      return {
        ...state,
        syncQueue: state.syncQueue.map(item =>
          item.id === action.payload.actionId
            ? { ...item, retryCount: action.payload.retryCount }
            : item
        ),
      };
    }

    case 'CLEAR_SYNC_QUEUE': {
      return {
        ...state,
        syncQueue: [],
      };
    }

    case 'EXPIRE_OFFERS': {
      const newStatuses = new Map(state.offerStatuses);
      action.payload.expiredOfferIds.forEach(offerId => {
        newStatuses.set(offerId, 'expired');
      });
      
      return {
        ...state,
        offerStatuses: newStatuses,
      };
    }

    default:
      return state;
  }
}

// Context interface
interface OfferContextType {
  // State
  offers: Map<string, Offer>;
  offerStatuses: Map<string, OfferStatus>;
  acceptanceTimestamps: Map<string, Date>;
  syncQueue: PendingAction[];
  
  // Computed values
  pendingOffers: Offer[];
  acceptedOffers: Offer[];
  declinedOffers: Offer[];
  expiredOffers: Offer[];
  hasPendingSync: boolean;
  
  // Methods
  acceptOffer: (offerId: string) => Promise<void>;
  declineOffer: (offerId: string) => Promise<void>;
  undoAccept: (offerId: string) => Promise<boolean>;
  canUndoAccept: (offerId: string) => boolean;
  addOffer: (offer: Offer) => Promise<void>;
  getOffer: (offerId: string) => Offer | undefined;
  getOfferStatus: (offerId: string) => OfferStatus | undefined;
  checkExpiredOffers: () => Promise<void>;
  retrySyncQueue: () => Promise<void>;
  clearSyncQueue: () => Promise<void>;
}

// Create context
const OfferContext = createContext<OfferContextType | undefined>(undefined);

// Helper functions for persistence
const saveToStorage = async (key: string, data: any): Promise<void> => {
  try {
    console.log(`🗄️ [STORAGE] Saving ${key}:`, data instanceof Map ? `Map with ${data.size} entries` : data);
    
    let serializedData: string;
    
    if (data instanceof Map) {
      const entries = Array.from(data.entries());
      console.log(`🗄️ [STORAGE] Map entries for ${key}:`, entries);
      serializedData = JSON.stringify(entries);
    } else if (Array.isArray(data)) {
      serializedData = JSON.stringify(data.map(item => ({
        ...item,
        timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : item.timestamp,
      })));
    } else {
      serializedData = JSON.stringify(data);
    }
    
    await AsyncStorage.setItem(key, serializedData);
    console.log(`✅ [STORAGE] Successfully saved ${key}`);
  } catch (error) {
    console.error(`❌ [STORAGE] Failed to save ${key} to storage:`, error);
  }
};

const loadFromStorage = async (key: string): Promise<any> => {
  try {
    console.log(`📂 [STORAGE] Loading ${key}...`);
    const data = await AsyncStorage.getItem(key);
    if (!data) {
      console.log(`📂 [STORAGE] No data found for ${key}`);
      return null;
    }
    
    const parsed = JSON.parse(data);
    console.log(`📂 [STORAGE] Parsed data for ${key}:`, parsed);
    
    // Handle specific data types
    if (key === STORAGE_KEYS.OFFERS) {
      const map = new Map(parsed);
      // Convert date strings back to Date objects
      map.forEach((offer, id) => {
        map.set(id, {
          ...offer,
          nextAvailableDate: new Date(offer.nextAvailableDate),
          expiresAt: new Date(offer.expiresAt),
          offeredAt: new Date(offer.offeredAt),
        });
      });
      console.log(`📂 [STORAGE] Loaded ${map.size} offers from storage`);
      return map;
    }
    
    if (key === STORAGE_KEYS.OFFER_STATUSES || key === STORAGE_KEYS.ACCEPTANCE_TIMESTAMPS) {
      const map = new Map(parsed);
      if (key === STORAGE_KEYS.ACCEPTANCE_TIMESTAMPS) {
        // Convert timestamp strings back to Date objects
        map.forEach((timestamp, id) => {
          map.set(id, new Date(timestamp));
        });
      }
      console.log(`📂 [STORAGE] Loaded ${map.size} entries for ${key}`);
      return map;
    }
    
    if (key === STORAGE_KEYS.SYNC_QUEUE) {
      const result = parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
      console.log(`📂 [STORAGE] Loaded ${result.length} sync queue items`);
      return result;
    }
    
    return parsed;
  } catch (error) {
    console.error(`❌ [STORAGE] Failed to load ${key} from storage:`, error);
    return null;
  }
};

// [API-INTEGRATION: Offers - Priority 1]
// TODO: Replace with real API endpoints
const mockApiAcceptOffer = async (offerId: string): Promise<void> => {
  // TODO: POST /api/offers/:id/accept
  // [API-INTEGRATION: Push - Priority 3] Send push when new offer arrives
  
  console.log(`🌐 [MOCK API] Starting accept offer API call for: ${offerId}`);
  
  if (FEATURES.USE_REAL_OFFERS) {
    console.log(`🌐 [MOCK API] Real API enabled, but not implemented`);
    // Real API implementation would go here
    throw new Error('Real API not implemented yet');
  }
  
  // Mock implementation for development
  console.log(`🌐 [MOCK API] Simulating API delay...`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (Math.random() < 0.1) { // 10% chance of failure for testing
    console.error(`❌ [MOCK API] Simulated network error for offer: ${offerId}`);
    throw new Error('Network error');
  }
  
  console.log(`✅ [MOCK API] Successfully accepted offer: ${offerId}`);
};

const mockApiDeclineOffer = async (offerId: string): Promise<void> => {
  // TODO: POST /api/offers/:id/decline
  // [API-INTEGRATION: Offers - Priority 1]
  
  if (FEATURES.USE_REAL_OFFERS) {
    // Real API implementation would go here
    throw new Error('Real API not implemented yet');
  }
  
  // Mock implementation for development
  console.log('[MOCK API] Declining offer:', offerId);
  await new Promise(resolve => setTimeout(resolve, 500));
  if (Math.random() < 0.05) { // 5% chance of failure
    throw new Error('Network error');
  }
};

// Provider component
export const OfferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(offerReducer, initialState);
  const { isOffline } = useOffline();
  const expirationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from storage on mount
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const [offers, offerStatuses, acceptanceTimestamps, syncQueue] = await Promise.all([
          loadFromStorage(STORAGE_KEYS.OFFERS),
          loadFromStorage(STORAGE_KEYS.OFFER_STATUSES),
          loadFromStorage(STORAGE_KEYS.ACCEPTANCE_TIMESTAMPS),
          loadFromStorage(STORAGE_KEYS.SYNC_QUEUE),
        ]);

        dispatch({
          type: 'LOAD_STATE',
          payload: {
            offers: offers || new Map(),
            offerStatuses: offerStatuses || new Map(),
            acceptanceTimestamps: acceptanceTimestamps || new Map(),
            syncQueue: syncQueue || [],
          },
        });
      } catch (error) {
        console.error('Failed to load initial state:', error);
      }
    };

    loadInitialState();
  }, []);

  // Save state to storage whenever it changes
  useEffect(() => {
    console.log(`💾 [PROVIDER] State changed, saving to storage...`);
    console.log(`💾 [PROVIDER] Current state:`, {
      offersCount: state.offers.size,
      statusesCount: state.offerStatuses.size,
      timestampsCount: state.acceptanceTimestamps.size,
      syncQueueLength: state.syncQueue.length,
    });
    
    const saveState = async () => {
      try {
        await Promise.all([
          saveToStorage(STORAGE_KEYS.OFFERS, state.offers),
          saveToStorage(STORAGE_KEYS.OFFER_STATUSES, state.offerStatuses),
          saveToStorage(STORAGE_KEYS.ACCEPTANCE_TIMESTAMPS, state.acceptanceTimestamps),
          saveToStorage(STORAGE_KEYS.SYNC_QUEUE, state.syncQueue),
        ]);
        console.log(`✅ [PROVIDER] All state saved successfully`);
      } catch (error) {
        console.error(`❌ [PROVIDER] Failed to save state:`, error);
      }
    };

    saveState();
  }, [state]);

  // Set up expiration timer
  useEffect(() => {
    const startExpirationTimer = () => {
      if (expirationTimerRef.current) {
        clearInterval(expirationTimerRef.current);
      }
      
      expirationTimerRef.current = setInterval(() => {
        checkExpiredOffers();
      }, EXPIRATION_CHECK_INTERVAL);
    };

    startExpirationTimer();

    return () => {
      if (expirationTimerRef.current) {
        clearInterval(expirationTimerRef.current);
      }
    };
  }, []);

  // Set up sync retry timer when online
  useEffect(() => {
    if (!isOffline && state.syncQueue.length > 0) {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      
      syncTimerRef.current = setTimeout(() => {
        retrySyncQueue();
      }, 2000); // Retry after 2 seconds when back online
    }

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [isOffline, state.syncQueue.length]);

  // Computed values
  const pendingOffers = Array.from(state.offers.values()).filter(
    offer => state.offerStatuses.get(offer.id) === 'pending'
  );

  const acceptedOffers = Array.from(state.offers.values()).filter(
    offer => state.offerStatuses.get(offer.id) === 'accepted'
  );

  const declinedOffers = Array.from(state.offers.values()).filter(
    offer => state.offerStatuses.get(offer.id) === 'declined'
  );

  const expiredOffers = Array.from(state.offers.values()).filter(
    offer => state.offerStatuses.get(offer.id) === 'expired'
  );

  const hasPendingSync = state.syncQueue.length > 0;

  // Methods
  const acceptOffer = useCallback(async (offerId: string): Promise<void> => {
    console.log(`🎯 [ACCEPT] Starting accept offer flow for: ${offerId}`);
    
    try {
      console.log(`🔍 [ACCEPT] Checking offer exists...`);
      const offer = state.offers.get(offerId);
      if (!offer) {
        console.error(`❌ [ACCEPT] Offer not found: ${offerId}`);
        throw new Error('Offer not found');
      }
      console.log(`✅ [ACCEPT] Offer found:`, offer);

      console.log(`🔍 [ACCEPT] Checking offer status...`);
      const currentStatus = state.offerStatuses.get(offerId);
      console.log(`🔍 [ACCEPT] Current status: ${currentStatus}`);
      
      if (currentStatus !== 'pending') {
        console.error(`❌ [ACCEPT] Offer not pending: ${currentStatus}`);
        throw new Error('Offer is not available for acceptance');
      }

      console.log(`🔍 [ACCEPT] Checking expiration...`);
      const now = new Date();
      const expiresAt = offer.expiresAt;
      console.log(`🔍 [ACCEPT] Now: ${now.toISOString()}, Expires: ${expiresAt.toISOString()}`);
      
      if (now > expiresAt) {
        console.log(`⏰ [ACCEPT] Offer expired, updating status`);
        dispatch({ type: 'UPDATE_OFFER_STATUS', payload: { offerId, status: 'expired' } });
        throw new Error('Offer has expired');
      }

      console.log(`🚀 [ACCEPT] Starting optimistic updates...`);
      // Optimistic update
      const timestamp = new Date();
      console.log(`🚀 [ACCEPT] Dispatching status update to 'accepted'`);
      dispatch({ type: 'UPDATE_OFFER_STATUS', payload: { offerId, status: 'accepted' } });
      
      console.log(`🚀 [ACCEPT] Dispatching acceptance timestamp`);
      dispatch({ type: 'SET_ACCEPTANCE_TIMESTAMP', payload: { offerId, timestamp } });

      console.log(`🌐 [ACCEPT] Checking network status: ${isOffline ? 'OFFLINE' : 'ONLINE'}`);
      
      if (isOffline) {
        console.log(`📴 [ACCEPT] Offline - adding to sync queue`);
        // Add to sync queue if offline
        const action: PendingAction = {
          id: `accept_${offerId}_${Date.now()}`,
          type: 'accept',
          offerId,
          timestamp,
          retryCount: 0,
        };
        dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: action });
        console.log(`📴 [ACCEPT] Added to sync queue:`, action);
      } else {
        console.log(`🌐 [ACCEPT] Online - calling API immediately`);
        // Try to sync immediately
        try {
          await mockApiAcceptOffer(offerId);
          console.log(`✅ [ACCEPT] API call successful`);
        } catch (error) {
          console.warn(`⚠️ [ACCEPT] API call failed, adding to sync queue:`, error);
          // If sync fails, add to queue for retry
          const action: PendingAction = {
            id: `accept_${offerId}_${Date.now()}`,
            type: 'accept',
            offerId,
            timestamp,
            retryCount: 0,
          };
          dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: action });
          console.log(`📦 [ACCEPT] Added to sync queue after API failure:`, action);
        }
      }
      
      console.log(`🎉 [ACCEPT] Accept offer flow completed successfully for: ${offerId}`);
    } catch (error) {
      console.error(`❌ [ACCEPT] Failed to accept offer ${offerId}:`, error);
      throw error;
    }
  }, [state.offers, state.offerStatuses, isOffline]);

  const declineOffer = useCallback(async (offerId: string): Promise<void> => {
    try {
      const offer = state.offers.get(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const currentStatus = state.offerStatuses.get(offerId);
      if (currentStatus !== 'pending') {
        throw new Error('Offer is not available for declining');
      }

      // Optimistic update
      dispatch({ type: 'UPDATE_OFFER_STATUS', payload: { offerId, status: 'declined' } });

      if (isOffline) {
        // Add to sync queue if offline
        const action: PendingAction = {
          id: `decline_${offerId}_${Date.now()}`,
          type: 'decline',
          offerId,
          timestamp: new Date(),
          retryCount: 0,
        };
        dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: action });
      } else {
        // Try to sync immediately
        try {
          await mockApiDeclineOffer(offerId);
        } catch (error) {
          // If sync fails, add to queue for retry
          const action: PendingAction = {
            id: `decline_${offerId}_${Date.now()}`,
            type: 'decline',
            offerId,
            timestamp: new Date(),
            retryCount: 0,
          };
          dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: action });
          console.warn('Failed to sync decline offer, added to queue:', error);
        }
      }
    } catch (error) {
      console.error('Failed to decline offer:', error);
      throw error;
    }
  }, [state.offers, state.offerStatuses, isOffline]);

  const canUndoAccept = useCallback((offerId: string): boolean => {
    const timestamp = state.acceptanceTimestamps.get(offerId);
    if (!timestamp) return false;
    
    const timeSinceAcceptance = Date.now() - timestamp.getTime();
    return timeSinceAcceptance < UNDO_TIME_LIMIT;
  }, [state.acceptanceTimestamps]);

  const undoAccept = useCallback(async (offerId: string): Promise<boolean> => {
    try {
      if (!canUndoAccept(offerId)) {
        return false;
      }

      // Revert to pending status
      dispatch({ type: 'UPDATE_OFFER_STATUS', payload: { offerId, status: 'pending' } });
      dispatch({ type: 'REMOVE_ACCEPTANCE_TIMESTAMP', payload: { offerId } });

      // Remove any pending sync actions for this offer
      const actionsToRemove = state.syncQueue
        .filter(action => action.offerId === offerId && action.type === 'accept')
        .map(action => action.id);

      actionsToRemove.forEach(actionId => {
        dispatch({ type: 'REMOVE_FROM_SYNC_QUEUE', payload: { actionId } });
      });

      return true;
    } catch (error) {
      console.error('Failed to undo accept:', error);
      return false;
    }
  }, [canUndoAccept, state.syncQueue]);

  const addOffer = useCallback(async (offer: Offer): Promise<void> => {
    try {
      dispatch({ type: 'ADD_OFFER', payload: offer });
    } catch (error) {
      console.error('Failed to add offer:', error);
      throw error;
    }
  }, []);

  const getOffer = useCallback((offerId: string): Offer | undefined => {
    return state.offers.get(offerId);
  }, [state.offers]);

  const getOfferStatus = useCallback((offerId: string): OfferStatus | undefined => {
    return state.offerStatuses.get(offerId);
  }, [state.offerStatuses]);

  const checkExpiredOffers = useCallback(async (): Promise<void> => {
    try {
      const now = new Date();
      const expiredOfferIds: string[] = [];

      state.offers.forEach((offer, offerId) => {
        const status = state.offerStatuses.get(offerId);
        if (status === 'pending' && now > offer.expiresAt) {
          expiredOfferIds.push(offerId);
        }
      });

      if (expiredOfferIds.length > 0) {
        dispatch({ type: 'EXPIRE_OFFERS', payload: { expiredOfferIds } });
      }
    } catch (error) {
      console.error('Failed to check expired offers:', error);
    }
  }, [state.offers, state.offerStatuses]);

  const retrySyncQueue = useCallback(async (): Promise<void> => {
    if (isOffline || state.syncQueue.length === 0) return;

    const actionsToRetry = [...state.syncQueue];

    for (const action of actionsToRetry) {
      try {
        if (action.type === 'accept') {
          await mockApiAcceptOffer(action.offerId);
        } else if (action.type === 'decline') {
          await mockApiDeclineOffer(action.offerId);
        }

        // Success - remove from queue
        dispatch({ type: 'REMOVE_FROM_SYNC_QUEUE', payload: { actionId: action.id } });
      } catch (error) {
        // Failure - increment retry count
        const newRetryCount = action.retryCount + 1;
        
        if (newRetryCount >= 3) {
          // Max retries reached - remove from queue
          dispatch({ type: 'REMOVE_FROM_SYNC_QUEUE', payload: { actionId: action.id } });
          console.error(`Max retries reached for action ${action.id}:`, error);
        } else {
          // Update retry count
          dispatch({
            type: 'UPDATE_SYNC_QUEUE_RETRY',
            payload: { actionId: action.id, retryCount: newRetryCount },
          });
        }
      }
    }
  }, [isOffline, state.syncQueue]);

  const clearSyncQueue = useCallback(async (): Promise<void> => {
    dispatch({ type: 'CLEAR_SYNC_QUEUE' });
  }, []);

  const contextValue: OfferContextType = {
    // State
    offers: state.offers,
    offerStatuses: state.offerStatuses,
    acceptanceTimestamps: state.acceptanceTimestamps,
    syncQueue: state.syncQueue,
    
    // Computed values
    pendingOffers,
    acceptedOffers,
    declinedOffers,
    expiredOffers,
    hasPendingSync,
    
    // Methods
    acceptOffer,
    declineOffer,
    undoAccept,
    canUndoAccept,
    addOffer,
    getOffer,
    getOfferStatus,
    checkExpiredOffers,
    retrySyncQueue,
    clearSyncQueue,
  };

  return (
    <OfferContext.Provider value={contextValue}>
      {children}
    </OfferContext.Provider>
  );
};

// Hook to use the context
export const useOffers = (): OfferContextType => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffers must be used within an OfferProvider');
  }
  return context;
};

export default OfferContext;