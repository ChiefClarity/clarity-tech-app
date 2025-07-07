export interface EnvironmentAnalysisResponse {
  success: boolean;
  imageUrls: string[];
  analysis: {
    vegetation?: {
      treesPresent: boolean;
      treeCount: number;
      treeTypes: string[];
      proximityToPool: string;
      overhangRisk: string;
      debrisRisk: string;
    };
    structures?: {
      screenEnclosure: boolean;
      enclosureCondition?: string;
    };
    environmentalFactors?: {
      sunExposure: string;
      windExposure: string;
      privacyLevel: string;
    };
    maintenanceChallenges: string[];
    recommendations: string[];
    confidence: number;
    pollenData?: {
      currentLevel: string;
      mainTypes: string[];
      forecast: string;
    };
  };
}

export interface WeatherPollenResponse {
  success: boolean;
  data: {
    avgRainfall: number;
    windPatterns: string;
    seasonalFactors: {
      [season: string]: {
        avgTemp: number;
        humidity: number;
      };
    };
    pollenData?: {
      currentLevel: string;
      mainTypes: string[];
      forecast: string;
    };
  };
}