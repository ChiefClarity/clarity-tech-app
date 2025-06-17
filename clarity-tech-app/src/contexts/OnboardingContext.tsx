import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CRITICAL: These MUST match existing field names exactly
interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface WaterChemistry {
  // Required fields - EXACT names from current forms
  chlorine: number;
  ph: number;
  alkalinity: number;
  cyanuricAcid: number;
  
  // Optional fields - ALL must be included
  calcium?: number;
  salt?: number;
  tds?: number;
  temperature?: number;
  phosphates?: number;
  copper?: number;
  iron?: number;
  notes?: string;
}

interface PoolDetails {
  // Basic info
  poolType: 'inground' | 'aboveGround';
  shape: 'rectangle' | 'oval' | 'kidney' | 'freeform' | 'other';
  
  // Dimensions - MUST support both manual and calculated
  length: number;
  width: number;
  depth: number;
  avgDepth?: number;
  deepEndDepth?: number;
  shallowEndDepth?: number;
  volume: number; // Auto-calculated but stored
  surfaceArea?: number;
  
  // Surface
  surfaceMaterial: 'plaster' | 'pebble' | 'tile' | 'vinyl' | 'fiberglass' | 'other';
  surfaceCondition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Features - checkbox array
  features: string[]; // ['waterfall', 'spa', 'lights', 'heater', 'autoCover', 'slide', 'divingBoard']
  
  // Environment
  nearbyTrees: boolean;
  treeTypes?: string;
  grassOrDirt: 'grass' | 'dirt' | 'both';
  sprinklerSystem: boolean;
}

interface EquipmentData {
  photos: string[]; // Array of photo URIs
  
  // Pump - ALL fields from current form
  pumpType: string;
  pumpManufacturer: string;
  pumpModel: string;
  pumpSerialNumber: string;
  pumpCondition: string;
  pumpBasketCondition: string;
  pumpPrimes: boolean;
  pumpLidWorks: boolean;
  pumpNotes: string;
  
  // Filter - ALL fields
  filterType: string;
  filterManufacturer: string;
  filterModel: string;
  filterSerialNumber: string;
  filterCondition: string;
  filterLidWorks: boolean;
  filterNotes: string;
  cartridgeModel?: string;
  cartridgeCondition?: string;
  cartridgeNeedsReplacement?: boolean;
  
  // Sanitizer
  sanitizerType: string;
  sanitizerManufacturer?: string;
  sanitizerModel?: string;
  sanitizerSerialNumber?: string;
  sanitizerCondition?: string;
  sanitizerNotes?: string;
  
  // Heater
  heaterType?: string;
  heaterManufacturer?: string;
  heaterModel?: string;
  heaterSerialNumber?: string;
  heaterCondition?: string;
  heaterNotes?: string;
  
  // Timer
  timerType?: string;
  timerCondition?: string;
  timerSynced?: boolean;
  timerStartHour?: string;
  timerStartMinute?: string;
  timerStartPeriod?: string;
  timerEndHour?: string;
  timerEndMinute?: string;
  timerEndPeriod?: string;
  timerManufacturer?: string;
  timerModel?: string;
  timerSerialNumber?: string;
  timerNotes?: string;
  
  // Valves
  valveCondition?: string;
  valvesProperlyLabeled?: boolean;
  valveNotes?: string;
  
  // Equipment Pad
  pressureReading?: string;
  equipmentPadNotes?: string;
}

interface VoiceNote {
  uri: string;
  duration: number;
  transcription?: string;
}

interface OnboardingSession {
  id: string;
  customerId: string;
  customerName: string;
  customerInfo?: CustomerInfo;
  waterChemistry?: WaterChemistry;
  poolDetails?: PoolDetails;
  equipment?: EquipmentData;
  voiceNote?: VoiceNote;
  photos: string[];
  status: 'draft' | 'in_progress' | 'completed' | 'synced';
  startedAt: string;
  completedAt?: string;
  syncedAt?: string;
}

interface OnboardingContextType {
  // Session data
  session: OnboardingSession | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // Navigation
  currentStep: number;
  canNavigateForward: boolean;
  
  // Actions
  initializeSession: (customerId: string, customerName: string, offerId?: string) => Promise<void>;
  updateCustomerInfo: (data: CustomerInfo) => Promise<void>;
  updateWaterChemistry: (data: WaterChemistry) => Promise<void>;
  updatePoolDetails: (data: PoolDetails) => Promise<void>;
  updateEquipment: (data: Partial<EquipmentData>) => Promise<void>;
  addPhoto: (uri: string) => Promise<void>;
  recordVoiceNote: (uri: string, duration: number) => Promise<void>;
  
  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  
  // Persistence
  saveAndExit: () => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  completeSession: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // CRITICAL: Steps validation - each step must be complete to proceed
  const stepValidation = {
    0: (s: OnboardingSession) => {
      if (!s.customerInfo) return false;
      const c = s.customerInfo;
      return !!(c.firstName && c.lastName && c.email && c.phone && 
                c.address && c.city && c.state && c.zipCode);
    },
    1: (s: OnboardingSession) => s.waterChemistry && s.waterChemistry.chlorine !== undefined,
    2: (s: OnboardingSession) => s.poolDetails && s.poolDetails.volume > 0,
    3: (s: OnboardingSession) => s.equipment && s.equipment.photos.length > 0,
    4: (s: OnboardingSession) => s.voiceNote && s.voiceNote.duration >= 30,
  };
  
  const canNavigateForward = session ? stepValidation[currentStep as keyof typeof stepValidation]?.(session) ?? false : false;
  
  // Initialize new session
  const initializeSession = async (customerId: string, customerName: string, offerId?: string) => {
    setLoading(true);
    try {
      // Check for existing draft
      const draftKey = `onboarding_session_${customerId}`;
      const existingDraft = await AsyncStorage.getItem(draftKey);
      
      if (existingDraft) {
        const parsed = JSON.parse(existingDraft);
        setSession(parsed);
        // Resume from last step
        const lastStep = Object.keys(stepValidation).findIndex(
          (_, idx) => !stepValidation[idx as keyof typeof stepValidation](parsed)
        );
        setCurrentStep(lastStep >= 0 ? lastStep : 0);
      } else {
        // Create new session
        const newSession: OnboardingSession = {
          id: `session_${Date.now()}`,
          customerId,
          customerName,
          photos: [],
          status: 'draft',
          startedAt: new Date().toISOString(),
        };
        
        setSession(newSession);
        await AsyncStorage.setItem(draftKey, JSON.stringify(newSession));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Update customer info
  const updateCustomerInfo = async (data: CustomerInfo) => {
    if (!session) return;
    
    setSaving(true);
    try {
      // Update local state
      const updated = { ...session, customerInfo: data };
      setSession(updated);
      
      // Save to AsyncStorage immediately
      await AsyncStorage.setItem(
        `onboarding_session_${session.customerId}`,
        JSON.stringify(updated)
      );
      
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw to handle in UI
    } finally {
      setSaving(false);
    }
  };
  
  // Update water chemistry
  const updateWaterChemistry = async (data: WaterChemistry) => {
    if (!session) return;
    
    setSaving(true);
    try {
      const updated = { ...session, waterChemistry: data };
      setSession(updated);
      
      await AsyncStorage.setItem(
        `onboarding_session_${session.customerId}`,
        JSON.stringify(updated)
      );
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };
  
  // Update pool details
  const updatePoolDetails = async (data: PoolDetails) => {
    if (!session) return;
    
    setSaving(true);
    try {
      const updated = { ...session, poolDetails: data };
      setSession(updated);
      
      await AsyncStorage.setItem(
        `onboarding_session_${session.customerId}`,
        JSON.stringify(updated)
      );
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };
  
  // Update equipment
  const updateEquipment = async (data: Partial<EquipmentData>) => {
    if (!session) return;
    
    setSaving(true);
    try {
      const updated = { 
        ...session, 
        equipment: { 
          ...session.equipment,
          ...data 
        } 
      };
      setSession(updated);
      
      await AsyncStorage.setItem(
        `onboarding_session_${session.customerId}`,
        JSON.stringify(updated)
      );
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };
  
  // Add photo
  const addPhoto = async (uri: string) => {
    if (!session) return;
    
    try {
      const updated = { 
        ...session, 
        photos: [...session.photos, uri] 
      };
      setSession(updated);
      
      await AsyncStorage.setItem(
        `onboarding_session_${session.customerId}`,
        JSON.stringify(updated)
      );
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };
  
  // Record voice note
  const recordVoiceNote = async (uri: string, duration: number) => {
    if (!session) return;
    
    setSaving(true);
    try {
      const updated = { 
        ...session, 
        voiceNote: { uri, duration } 
      };
      setSession(updated);
      
      await AsyncStorage.setItem(
        `onboarding_session_${session.customerId}`,
        JSON.stringify(updated)
      );
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };
  
  // Save and exit
  const saveAndExit = async () => {
    if (!session) return;
    
    setSaving(true);
    try {
      // Update status
      const updated = { ...session, status: 'in_progress' as const };
      
      // Save locally
      await AsyncStorage.setItem(
        `onboarding_session_${session.customerId}`,
        JSON.stringify(updated)
      );
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Resume session
  const resumeSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem(`onboarding_session_${sessionId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        
        // Find last completed step
        const lastStep = Object.keys(stepValidation).findIndex(
          (_, idx) => !stepValidation[idx as keyof typeof stepValidation](parsed)
        );
        setCurrentStep(lastStep >= 0 ? lastStep : 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Complete session
  const completeSession = async () => {
    if (!session || !session.voiceNote) return;
    
    setLoading(true);
    try {
      // Mark as completed
      const completed = {
        ...session,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      };
      
      // Clear local draft
      await AsyncStorage.removeItem(`onboarding_session_${session.customerId}`);
      
      // Update state
      setSession(completed);
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <OnboardingContext.Provider
      value={{
        session,
        loading,
        saving,
        error,
        currentStep,
        canNavigateForward,
        initializeSession,
        updateCustomerInfo,
        updateWaterChemistry,
        updatePoolDetails,
        updateEquipment,
        addPhoto,
        recordVoiceNote,
        nextStep: () => setCurrentStep(Math.min(currentStep + 1, 4)),
        previousStep: () => setCurrentStep(Math.max(currentStep - 1, 0)),
        goToStep: setCurrentStep,
        saveAndExit,
        resumeSession,
        completeSession,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};