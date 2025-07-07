import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AIAnalysisData {
  timestamp: string;
  imageUri?: string;
  analysis: any;
}

export interface AIPoolSurfaceAnalysis extends AIAnalysisData {
  material: {
    detected: string;
    confidence: number;
    alternatives: string[];
  };
  issues: {
    cracks: {
      detected: boolean;
      severity: number;
      locations: any[];
    };
    stains: {
      detected: boolean;
      severity: number;
      type: string;
    };
    algae: {
      detected: boolean;
      coverage: number;
      type: string;
    };
    discoloration: {
      detected: boolean;
      severity: number;
    };
    roughness: {
      estimated: number;
      confidence: number;
    };
  };
  overallHealthScore: number;
  recommendedActions: string[];
  rawAnalysisData: any;
}

export interface AIEnvironmentAnalysis extends AIAnalysisData {
  trees: {
    detected: boolean;
    count: number;
    types: string[];
    overhangRisk: string;
    leafDropEstimate: string;
  };
  screenEnclosure: {
    detected: boolean;
    condition: string;
    coverage: number;
  };
  foliage: {
    density: string;
    proximityToPool: string;
    maintenanceImpact: string;
  };
  weatherPatterns?: {
    avgRainfall: number;
    windPatterns: string;
    seasonalFactors: any;
    pollenData?: any;
  };
  sunExposure: {
    hoursPerDay: number;
    shadedAreas: number;
  };
  rawAnalysisData: {
    ground?: any;
    satellite?: any;
  };
}

type AnalysisType = 'surface' | 'environment' | 'satellite' | 'skimmer' | 'deck' | 'equipment';

class AIAnalysisStorage {
  private readonly STORAGE_PREFIX = '@ai_analysis_';

  async saveAnalysis(
    customerId: string,
    type: AnalysisType,
    analysis: any
  ): Promise<void> {
    try {
      const key = `${this.STORAGE_PREFIX}${customerId}_${type}`;
      const timestamp = new Date().toISOString();
      
      // Get existing analyses
      const existingData = await this.getAnalyses(customerId, type);
      
      // Add new analysis with timestamp
      const updatedData = [
        ...existingData,
        {
          ...analysis,
          timestamp,
          id: `${type}_${Date.now()}`
        }
      ];
      
      // Keep only last 10 analyses per type
      const trimmedData = updatedData.slice(-10);
      
      await AsyncStorage.setItem(key, JSON.stringify(trimmedData));
    } catch (error) {
      console.error('Error saving AI analysis:', error);
      throw error;
    }
  }

  async getLatestAnalysis(
    customerId: string,
    type: AnalysisType
  ): Promise<any | null> {
    try {
      const analyses = await this.getAnalyses(customerId, type);
      return analyses.length > 0 ? analyses[analyses.length - 1] : null;
    } catch (error) {
      console.error('Error getting latest AI analysis:', error);
      return null;
    }
  }

  async getAnalyses(
    customerId: string,
    type: AnalysisType
  ): Promise<any[]> {
    try {
      const key = `${this.STORAGE_PREFIX}${customerId}_${type}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting AI analyses:', error);
      return [];
    }
  }

  async getAllAnalyses(customerId: string): Promise<Record<AnalysisType, any[]>> {
    const types: AnalysisType[] = ['surface', 'environment', 'satellite', 'skimmer', 'deck', 'equipment'];
    const result: Record<string, any[]> = {};
    
    for (const type of types) {
      result[type] = await this.getAnalyses(customerId, type);
    }
    
    return result as Record<AnalysisType, any[]>;
  }

  async clearAnalyses(customerId: string, type?: AnalysisType): Promise<void> {
    try {
      if (type) {
        const key = `${this.STORAGE_PREFIX}${customerId}_${type}`;
        await AsyncStorage.removeItem(key);
      } else {
        // Clear all analyses for the customer
        const types: AnalysisType[] = ['surface', 'environment', 'satellite', 'skimmer', 'deck', 'equipment'];
        for (const t of types) {
          const key = `${this.STORAGE_PREFIX}${customerId}_${t}`;
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing AI analyses:', error);
      throw error;
    }
  }
}

export const aiAnalysisStorage = new AIAnalysisStorage();