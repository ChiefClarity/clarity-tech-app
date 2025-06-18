export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'technician' | 'admin';
  avatar?: string;
  token?: string;
  displayName?: string; // Computed from firstName + lastName or custom name
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
}

export interface WaterChemistry {
  chlorine: number;
  ph: number;
  alkalinity: number;
  cyanuricAcid: number;
  calcium?: number;
  salt?: number;
  tds?: number;
  temperature?: number;
  phosphates?: number;
  copper?: number;
  iron?: number;
  orp?: number;
  hasSaltCell?: boolean;
  notes?: string;
}

export interface Equipment {
  id: string;
  type: 'pump' | 'filter' | 'sanitizer' | 'heater' | 'cleaner' | 'other';
  manufacturer: string;
  model: string;
  serial?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  installDate?: string;
  photoUri?: string;
}

export interface PoolDetails {
  type: 'inground' | 'above_ground';
  shape: 'rectangle' | 'oval' | 'circle' | 'kidney' | 'freeform' | 'other';
  length: number;
  width: number;
  avgDepth: number;
  deepEndDepth: number;
  shallowEndDepth: number;
  volume: number;
  surfaceArea?: number;
  surfaceMaterial: 'plaster' | 'pebble' | 'tile' | 'vinyl' | 'fiberglass' | 'other';
  surfaceCondition: 'excellent' | 'good' | 'fair' | 'poor';
  surfaceStains?: boolean;
  stainTypes?: string;
  features: string[];
  environment: {
    nearbyTrees: boolean;
    treeType?: string;
    deckMaterial: string;
    fenceType: string;
    grassOrDirt?: 'grass' | 'dirt' | 'both';
    sprinklerSystem?: boolean;
  };
  
  // Add deck material to main interface
  deckMaterial?: 'pavers' | 'stamped concrete' | 'tile' | 'natural stone' | 'concrete' | 'other';
  
  // New fields for sections
  environmentAnalysis?: {
    trees: string[];
    sunExposure: string;
    leafFall: string;
    windExposure: string;
    shadeCoverage: string;
  };
  deckAnalysis?: {
    material: string;
    condition: string;
    cleanliness: string;
    issues: string[];
  };
  deckCleanliness?: string;
  
  // Dynamic skimmer fields
  skimmerCount?: number;
  [key: `skimmer${number}Functioning`]: boolean;
  [key: `skimmer${number}BasketCondition`]: string;
  [key: `skimmer${number}LidCondition`]: string;
  [key: `skimmer${number}LidModel`]: string;
}

export interface OnboardingData {
  customerId?: string;
  customer: Customer;
  waterChemistry: WaterChemistry;
  equipment: Equipment[];
  poolDetails: PoolDetails;
  voiceNoteUri?: string;
  photos: string[];
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface DashboardStats {
  todayOnboardings: number;
  weekOnboardings: number;
  pendingSync: number;
  completedToday: number;
}

export interface Offer {
  id: string;
  customerId: string;
  customerName: string;
  address: string;
  poolSize: string;
  suggestedDay: string;
  routeProximity: number; // Distance in miles
  nextAvailableDate: Date;
  expiresAt: Date; // 30 mins from creation
  offeredAt: Date;
}

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface PendingAction {
  id: string;
  type: 'accept' | 'decline';
  offerId: string;
  timestamp: Date;
  retryCount: number;
}

export interface OfferState {
  offers: Map<string, Offer>;
  offerStatuses: Map<string, OfferStatus>;
  acceptanceTimestamps: Map<string, Date>;
  syncQueue: PendingAction[];
}

// Legacy interface for backward compatibility
export interface OnboardingOffer {
  id: string;
  customerName: string;
  address: string;
  poolSize: string;
  suggestedDay: string;
  routeProximity: string;
  nextAvailableDate: string;
  status: 'pending_acceptance' | 'accepted' | 'declined';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Scheduling System Types - Clarity Platform Core
export interface ScheduledService {
  id: string;
  type: 'onboarding' | 'maintenance' | 'repair' | 'inspection';
  customerId: string;
  customerName: string;
  customerAddress: string;
  technicianId: string;
  scheduledDate: Date;
  status: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  estimatedDuration: number; // minutes
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number; // minutes
  notes?: string;
  poolbrainJobId?: string; // Will be set when synced to Poolbrain
  poolbrainSyncStatus: 'pending' | 'synced' | 'failed' | 'not_required';
  createdAt: Date;
  updatedAt: Date;
  
  // Additional context for onboarding services
  offerId?: string; // Link back to the original offer
  offerAcceptedAt?: Date;
  
  // Location data
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  
  // Service-specific data
  serviceData?: {
    onboarding?: {
      isFirstVisit: boolean;
      expectedServices: string[];
      customerPreferences?: string;
    };
    maintenance?: {
      serviceType: string;
      lastServiceDate?: Date;
      serviceInterval: number; // days
    };
    repair?: {
      issueDescription: string;
      estimatedCost?: number;
      partsNeeded?: string[];
    };
  };
}

export type ServiceStatus = ScheduledService['status'];
export type ServiceType = ScheduledService['type'];
export type PoolbrainSyncStatus = ScheduledService['poolbrainSyncStatus'];

export interface SchedulingState {
  services: Map<string, ScheduledService>;
  todayServices: ScheduledService[];
  upcomingServices: ScheduledService[];
  completedServices: ScheduledService[];
  syncQueue: ScheduledService[];
  lastSyncTime?: Date;
  isLoading: boolean;
  error?: string;
}

// API Request/Response types for scheduling
export interface CreateScheduledServiceRequest {
  type: ServiceType;
  customerId: string;
  customerName: string;
  customerAddress: string;
  technicianId: string;
  scheduledDate: string; // ISO string
  estimatedDuration: number;
  notes?: string;
  offerId?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  serviceData?: ScheduledService['serviceData'];
}

export interface CreateScheduledServiceResponse {
  service: ScheduledService;
  poolbrainJobId?: string;
  message: string;
}

export interface UpdateServiceStatusRequest {
  status: ServiceStatus;
  actualStartTime?: string; // ISO string
  actualEndTime?: string; // ISO string
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateServiceStatusResponse {
  service: ScheduledService;
  poolbrainSynced: boolean;
  message: string;
}

export interface TechnicianScheduleResponse {
  services: ScheduledService[];
  totalCount: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  lastUpdated: string; // ISO string
}