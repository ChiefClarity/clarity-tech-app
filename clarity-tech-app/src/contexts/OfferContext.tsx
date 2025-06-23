import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Offer, OfferStatus, PendingAction, OfferState } from '../types';
import { useOffline } from '../hooks/useOffline';
import { FEATURES } from '../config/featureFlags';
import { offersService } from '../services/api/offers';
import { useAuth } from './AuthContext';

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
  
  switch (action.type) {
    case 'LOAD_STATE': {
      return {
        ...state,
        ...action.payload,
      };
    }

    case 'ADD_OFFER': {
      const newOffers = new Map(state.offers);
      const newStatuses = new Map(state.offerStatuses);
      
      newOffers.set(action.payload.id, action.payload);
      newStatuses.set(action.payload.id, 'pending');
      
      return {
        ...state,
        offers: newOffers,
        offerStatuses: newStatuses,
      };
    }

    case 'UPDATE_OFFER_STATUS': {
      const newStatuses = new Map(state.offerStatuses);
      const oldStatus = newStatuses.get(action.payload.offerId);
      newStatuses.set(action.payload.offerId, action.payload.status);
      
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
  fetchOffers: () => Promise<void>;
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
    
    let serializedData: string;
    
    if (data instanceof Map) {
      const entries = Array.from(data.entries());
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
  } catch (error) {
  }
};

const loadFromStorage = async (key: string): Promise<any> => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) {
      return null;
    }
    
    const parsed = JSON.parse(data);
    
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
      return map;
    }
    
    if (key === STORAGE_KEYS.SYNC_QUEUE) {
      const result = parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
      return result;
    }
    
    return parsed;
  } catch (error) {
    return null;
  }
};

const apiAcceptOffer = async (offerId: string): Promise<void> => {
  const response = await offersService.acceptOffer(offerId);
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to accept offer');
  }
};

const apiDeclineOffer = async (offerId: string): Promise<void> => {
  const response = await offersService.declineOffer(offerId);
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to decline offer');
  }
};

const apiUndoOfferAction = async (offerId: string): Promise<void> => {
  const response = await offersService.undoOfferAction(offerId);
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to undo action');
  }
};

// Provider component
export const OfferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(offerReducer, initialState);
  const { isOffline } = useOffline();
  const { user } = useAuth();
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
      }
    };

    loadInitialState();
  }, []);

  // Save state to storage whenever it changes
  useEffect(() => {
    const saveState = async () => {
      try {
        await Promise.all([
          saveToStorage(STORAGE_KEYS.OFFERS, state.offers),
          saveToStorage(STORAGE_KEYS.OFFER_STATUSES, state.offerStatuses),
          saveToStorage(STORAGE_KEYS.ACCEPTANCE_TIMESTAMPS, state.acceptanceTimestamps),
          saveToStorage(STORAGE_KEYS.SYNC_QUEUE, state.syncQueue),
        ]);
      } catch (error) {
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
  const fetchOffers = useCallback(async (): Promise<void> => {
    console.log('📋 [Offers] Fetching offers...');
    try {
      if (!user?.id) {
        console.warn('⚠️ [Offers] No user ID available for fetching offers');
        return;
      }

      const response = await offersService.fetchTechnicianOffers(user.id);
      
      if (response.success && response.data) {
        // Clear existing offers and statuses
        const newOffers = new Map<string, Offer>();
        const newStatuses = new Map<string, OfferStatus>();
        
        response.data.offers.forEach(offer => {
          newOffers.set(offer.id, offer);
          
          // Check if offer is expired
          const now = new Date();
          if (now > offer.expiresAt) {
            newStatuses.set(offer.id, 'expired');
          } else {
            // Check if we have a local status for this offer
            const existingStatus = state.offerStatuses.get(offer.id);
            newStatuses.set(offer.id, existingStatus || 'pending');
          }
        });
        
        // Update state with new offers
        dispatch({ 
          type: 'LOAD_STATE', 
          payload: {
            offers: newOffers,
            offerStatuses: newStatuses,
          }
        });
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  }, [user?.id, state.offerStatuses]);

  const acceptOffer = useCallback(async (offerId: string): Promise<void> => {
    
    try {
      const offer = state.offers.get(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      const currentStatus = state.offerStatuses.get(offerId);
      
      if (currentStatus !== 'pending') {
        throw new Error('Offer is not available for acceptance');
      }

      const now = new Date();
      const expiresAt = offer.expiresAt;
      
      if (now > expiresAt) {
        dispatch({ type: 'UPDATE_OFFER_STATUS', payload: { offerId, status: 'expired' } });
        throw new Error('Offer has expired');
      }

      // Optimistic update
      const timestamp = new Date();
      dispatch({ type: 'UPDATE_OFFER_STATUS', payload: { offerId, status: 'accepted' } });
      dispatch({ type: 'SET_ACCEPTANCE_TIMESTAMP', payload: { offerId, timestamp } });

      
      if (isOffline) {
        // Add to sync queue if offline
        const action: PendingAction = {
          id: `accept_${offerId}_${Date.now()}`,
          type: 'accept',
          offerId,
          timestamp,
          retryCount: 0,
        };
        dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: action });
      } else {
        // Try to sync immediately
        try {
          await apiAcceptOffer(offerId);
        } catch (error) {
          // If sync fails, add to queue for retry
          const action: PendingAction = {
            id: `accept_${offerId}_${Date.now()}`,
            type: 'accept',
            offerId,
            timestamp,
            retryCount: 0,
          };
          dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: action });
        }
      }
      
    } catch (error) {
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
          await apiDeclineOffer(offerId);
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
        }
      }
    } catch (error) {
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
      return false;
    }
  }, [canUndoAccept, state.syncQueue]);

  const addOffer = useCallback(async (offer: Offer): Promise<void> => {
    try {
      dispatch({ type: 'ADD_OFFER', payload: offer });
    } catch (error) {
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
    }
  }, [state.offers, state.offerStatuses]);

  const retrySyncQueue = useCallback(async (): Promise<void> => {
    if (isOffline || state.syncQueue.length === 0) return;
    
    console.log(`🔄 [Offers] Retrying sync queue (${state.syncQueue.length} items)`);

    const actionsToRetry = [...state.syncQueue];

    for (const action of actionsToRetry) {
      try {
        if (action.type === 'accept') {
          await apiAcceptOffer(action.offerId);
        } else if (action.type === 'decline') {
          await apiDeclineOffer(action.offerId);
        }

        // Success - remove from queue
        console.log(`✅ [Offers] Synced ${action.type} action for offer ${action.offerId}`);
        dispatch({ type: 'REMOVE_FROM_SYNC_QUEUE', payload: { actionId: action.id } });
      } catch (error) {
        console.error(`❌ [Offers] Failed to sync ${action.type} action:`, error);
        // Failure - increment retry count
        const newRetryCount = action.retryCount + 1;
        
        if (newRetryCount >= 3) {
          // Max retries reached - remove from queue
          dispatch({ type: 'REMOVE_FROM_SYNC_QUEUE', payload: { actionId: action.id } });
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
    fetchOffers,
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