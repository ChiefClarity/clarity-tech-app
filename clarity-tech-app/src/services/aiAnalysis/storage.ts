import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/storage';

// AI Analysis Types
export interface SatelliteAnalysis {
  timestamp: string;
  confidence: number;
  dimensions: {
    length: number;
    width: number;
    surfaceArea: number;
  };
  shape: string;
  calibrationFactors?: {
    scale: number;
    accuracy: number;
  };
}

export interface AIPoolSurfaceAnalysis {
  timestamp: string;
  imageUri: string;
  material: {
    detected: string;
    confidence: number;
    alternatives: Array<{material: string; confidence: number}>;
  };
  issues: {
    cracks: { detected: boolean; severity: number; locations: Array<{x: number; y: number}> };
    stains: { detected: boolean; severity: number; type: string };
    algae: { detected: boolean; coverage: number; type: string };
    discoloration: { detected: boolean; severity: number };
    roughness: { estimated: number; confidence: number };
  };
  overallHealthScore: number;
  recommendedActions: string[];
  rawAnalysisData: any;
}

export interface AIEnvironmentAnalysis {
  timestamp: string;
  imageUri: string;
  trees: {
    detected: boolean;
    count: number;
    types: string[];
    overhangRisk: number;
    leafDropEstimate: string;
  };
  screenEnclosure: {
    detected: boolean;
    condition: string;
    coverage: number;
  };
  foliage: {
    density: number;
    proximityToPool: number;
    maintenanceImpact: string;
  };
  weatherPatterns: {
    avgRainfall: number;
    windPatterns: string;
    seasonalFactors: any;
  };
  sunExposure: {
    hoursPerDay: number;
    shadedAreas: number;
  };
  rawAnalysisData: any;
}

export interface VoiceNoteAnalysis {
  timestamp: string;
  audioUri: string;
  transcription: string;
  keyPoints: string[];
  surfaceObservations?: string[];
  equipmentNotes?: string[];
  specialCircumstances?: string[];
  pricingFactors?: string[];
}

export interface CustomerAIAnalysis {
  customerId: string;
  analyses: {
    pool: {
      satellite: SatelliteAnalysis[];
      surface: AIPoolSurfaceAnalysis[];
    };
    environment: AIEnvironmentAnalysis[];
    equipment: any[]; // To be expanded
    voiceNotes: VoiceNoteAnalysis[];
  };
  metadata: {
    lastUpdated: string;
    version: string;
    technicianId: string;
  };
}

class AIAnalysisStorage {
  private readonly STORAGE_KEY = STORAGE_KEYS.AI_ANALYSIS_DATA;
  private readonly VERSION = '1.0.0';

  async saveAnalysis(customerId: string, type: 'surface' | 'environment' | 'satellite' | 'voice', data: any): Promise<void> {
    try {
      const existingData = await this.getCustomerAnalysis(customerId);
      const analysis = existingData || this.createEmptyAnalysis(customerId);
      
      // Add timestamp if not present
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }

      // Store based on type
      switch (type) {
        case 'surface':
          analysis.analyses.pool.surface.push(data);
          break;
        case 'environment':
          analysis.analyses.environment.push(data);
          break;
        case 'satellite':
          analysis.analyses.pool.satellite.push(data);
          break;
        case 'voice':
          analysis.analyses.voiceNotes.push(data);
          break;
      }

      // Update metadata
      analysis.metadata.lastUpdated = new Date().toISOString();

      // Save to storage
      await this.saveToStorage(customerId, analysis);
    } catch (error) {
      console.error('Error saving AI analysis:', error);
      throw error;
    }
  }

  async getCustomerAnalysis(customerId: string): Promise<CustomerAIAnalysis | null> {
    try {
      const key = `${this.STORAGE_KEY}_${customerId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving AI analysis:', error);
      return null;
    }
  }

  async getLatestAnalysis(customerId: string, type: 'surface' | 'environment' | 'satellite'): Promise<any | null> {
    try {
      const analysis = await this.getCustomerAnalysis(customerId);
      if (!analysis) return null;

      let dataArray: any[] = [];
      switch (type) {
        case 'surface':
          dataArray = analysis.analyses.pool.surface;
          break;
        case 'environment':
          dataArray = analysis.analyses.environment;
          break;
        case 'satellite':
          dataArray = analysis.analyses.pool.satellite;
          break;
      }

      return dataArray.length > 0 ? dataArray[dataArray.length - 1] : null;
    } catch (error) {
      console.error('Error getting latest analysis:', error);
      return null;
    }
  }

  private createEmptyAnalysis(customerId: string): CustomerAIAnalysis {
    return {
      customerId,
      analyses: {
        pool: {
          satellite: [],
          surface: []
        },
        environment: [],
        equipment: [],
        voiceNotes: []
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: this.VERSION,
        technicianId: '' // Will be set from context
      }
    };
  }

  private async saveToStorage(customerId: string, data: CustomerAIAnalysis): Promise<void> {
    const key = `${this.STORAGE_KEY}_${customerId}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  // Compression utility for large data
  private compressData(data: any): string {
    // For now, just stringify. In production, use a compression library
    return JSON.stringify(data);
  }

  private decompressData(compressed: string): any {
    return JSON.parse(compressed);
  }
}

export const aiAnalysisStorage = new AIAnalysisStorage();