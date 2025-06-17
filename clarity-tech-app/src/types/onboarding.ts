/**
 * Onboarding-specific types
 * Provides proper type safety for onboarding flow
 */

import { Customer, WaterChemistry, Equipment, PoolDetails } from './index';

// Onboarding step data structure
export interface OnboardingStepData {
  customer?: Partial<Customer>;
  waterChemistry?: Partial<WaterChemistry>;
  equipment?: Equipment[];
  poolDetails?: Partial<PoolDetails>;
  voiceNoteUri?: string;
  photos?: string[];
  currentStep?: number;
  isComplete?: boolean;
}

// Individual step props interfaces
export interface CustomerInfoStepProps {
  data: OnboardingStepData;
  onNext: (customer: Customer) => void;
  onBack: () => void;
}

export interface WaterChemistryStepProps {
  data: OnboardingStepData;
  onNext: (waterChemistry: WaterChemistry) => void;
  onBack: () => void;
}

export interface EquipmentStepProps {
  data: OnboardingStepData;
  onNext: (equipment: Equipment[]) => void;
  onBack: () => void;
}

export interface PoolDetailsStepProps {
  data: OnboardingStepData;
  onNext: (poolDetails: PoolDetails) => void;
  onBack: () => void;
}

export interface VoiceNoteStepProps {
  data: OnboardingStepData;
  onNext: (voiceNoteUri: string) => void;
  onBack: () => void;
}

export interface PhotoCaptureStepProps {
  data: OnboardingStepData;
  onNext: (photos: string[]) => void;
  onBack: () => void;
}

export interface ReviewSubmitStepProps {
  data: OnboardingStepData;
  onNext: () => void;
  onBack: () => void;
}

// Equipment form types
export interface EquipmentFormData {
  type: Equipment['type'];
  manufacturer: string;
  model: string;
  serial?: string;
  condition: Equipment['condition'];
  installDate?: string;
  photoUri?: string;
}

export interface EquipmentFormProps {
  equipment?: Equipment;
  onSave: (equipment: Equipment) => void;
  onCancel: () => void;
}

// Voice note types
export interface VoiceNote {
  id: string;
  uri: string;
  duration: number;
  timestamp: number;
  transcription?: string;
}

// Photo types
export interface PhotoData {
  id: string;
  uri: string;
  timestamp: number;
  caption?: string;
  type?: 'equipment' | 'pool' | 'chemistry' | 'general';
}

// Step navigation types
export type OnboardingStep = 
  | 'CustomerInfo'
  | 'WaterChemistry'
  | 'Equipment'
  | 'PoolDetails'
  | 'VoiceNotes'
  | 'PhotoCapture'
  | 'ReviewSubmit';

export interface StepConfig {
  key: OnboardingStep;
  title: string;
  component: React.ComponentType<any>;
  isRequired: boolean;
  order: number;
}

// Step validation results
export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Onboarding flow state
export interface OnboardingFlowState {
  currentStep: number;
  steps: StepConfig[];
  data: OnboardingStepData;
  isLoading: boolean;
  errors: Record<string, string>;
  isComplete: boolean;
}