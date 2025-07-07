import { apiClient } from './client';
import { EnvironmentAnalysisResponse, WeatherPollenResponse } from '../../types/ai';

type ApiResponse<T> = T;

class AIService {
  async analyzeEnvironment(imageUris: string[], sessionId: string): Promise<ApiResponse<EnvironmentAnalysisResponse>> {
    try {
      console.log('🌳 [AI Service] Analyzing environment...');
      const response = await apiClient.post('/ai/analyze-environment', {
        images: imageUris,
        sessionId,
      });
      console.log('🌳 [AI Service] Environment analysis complete:', response);
      
      // Mock response for development
      return {
        success: true,
        imageUrls: imageUris,
        analysis: {
          vegetation: {
            treesPresent: true,
            treeCount: 3,
            treeTypes: ['Oak', 'Palm', 'Pine'],
            proximityToPool: 'moderate',
            overhangRisk: 'medium',
            debrisRisk: 'moderate'
          },
          structures: {
            screenEnclosure: false,
          },
          environmentalFactors: {
            sunExposure: 'partial shade',
            windExposure: 'moderate',
            privacyLevel: 'high'
          },
          maintenanceChallenges: ['leaf debris', 'pollen accumulation'],
          recommendations: ['Regular skimming required', 'Consider tree trimming'],
          confidence: 0.85
        }
      };
    } catch (error) {
      console.error('🌳 [AI Service] Environment analysis failed:', error);
      throw error;
    }
  }

  async analyzeWeatherPollen(address: string): Promise<ApiResponse<any>> {
    try {
      console.log('🌤️ [AI Service] Fetching weather and pollen data...');
      const response = await apiClient.post('/ai/analyze-weather-pollen', {
        address,
      });
      console.log('🌤️ [AI Service] Weather/pollen data received:', response);
      return response;
    } catch (error) {
      console.error('🌩️ [AI Service] Weather/pollen analysis failed:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();