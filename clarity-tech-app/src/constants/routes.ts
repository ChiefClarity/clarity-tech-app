/**
 * Navigation route constants
 * Centralized route names to eliminate magic strings
 */

export const ROUTES = {
  // Root Stack Routes
  AUTH: 'Auth' as const,
  MAIN: 'Main' as const,
  ONBOARDING_FLOW: 'OnboardingFlow' as const,
  
  // Auth Stack Routes
  LOGIN: 'Login' as const,
  FORGOT_PASSWORD: 'ForgotPassword' as const,
  
  // Bottom Tab Routes
  DASHBOARD: 'Dashboard' as const,
  ONBOARDINGS: 'Onboardings' as const,
  PROFILE: 'Profile' as const,
  
  // Additional Screens
  ACCEPTED_ONBOARDINGS: 'AcceptedOnboardings' as const,
  
  // Onboarding Flow Routes
  CUSTOMER_INFO: 'CustomerInfo' as const,
  WATER_CHEMISTRY: 'WaterChemistry' as const,
  EQUIPMENT_SURVEY: 'EquipmentSurvey' as const,
  POOL_DETAILS: 'PoolDetails' as const,
  VOICE_NOTES: 'VoiceNotes' as const,
  PHOTO_CAPTURE: 'PhotoCapture' as const,
  REVIEW_SUBMIT: 'ReviewSubmit' as const,
} as const;

export const SCREEN_TITLES = {
  [ROUTES.LOGIN]: 'Sign In',
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.ONBOARDINGS]: 'Onboardings',
  [ROUTES.PROFILE]: 'Profile',
  [ROUTES.ACCEPTED_ONBOARDINGS]: 'Accepted Onboardings',
  [ROUTES.CUSTOMER_INFO]: 'Customer Information',
  [ROUTES.WATER_CHEMISTRY]: 'Water Chemistry',
  [ROUTES.EQUIPMENT_SURVEY]: 'Equipment Survey',
  [ROUTES.POOL_DETAILS]: 'Pool Details',
  [ROUTES.VOICE_NOTES]: 'Voice Notes',
  [ROUTES.PHOTO_CAPTURE]: 'Photo Capture',
  [ROUTES.REVIEW_SUBMIT]: 'Review & Submit',
} as const;

export const TAB_LABELS = {
  [ROUTES.DASHBOARD]: 'Home',
  [ROUTES.ONBOARDINGS]: 'Onboardings',
  [ROUTES.PROFILE]: 'Profile',
} as const;

// Route parameter types
export type RootStackParamList = {
  [ROUTES.AUTH]: undefined;
  [ROUTES.MAIN]: undefined;
  [ROUTES.ONBOARDING_FLOW]: { 
    customerId?: string;
    offerId?: string;
    customerName?: string;
    customerAddress?: string;
  };
  [ROUTES.ACCEPTED_ONBOARDINGS]: undefined;
};

export type AuthStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
};

export type BottomTabParamList = {
  [ROUTES.DASHBOARD]: undefined;
  [ROUTES.ONBOARDINGS]: undefined;
  [ROUTES.PROFILE]: undefined;
};

export type OnboardingStackParamList = {
  [ROUTES.CUSTOMER_INFO]: { data?: any };
  [ROUTES.WATER_CHEMISTRY]: { data?: any };
  [ROUTES.EQUIPMENT_SURVEY]: { data?: any };
  [ROUTES.POOL_DETAILS]: { data?: any };
  [ROUTES.VOICE_NOTES]: { data?: any };
  [ROUTES.PHOTO_CAPTURE]: { data?: any };
  [ROUTES.REVIEW_SUBMIT]: { data?: any };
};