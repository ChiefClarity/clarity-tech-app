import { apiClient } from './client';
import { ApiResponse } from '../../types';

interface TestStripAnalysis {
  readings: {
    freeChlorine: number | null;
    totalChlorine: number | null;
    ph: number | null;
    alkalinity: number | null;
    cyanuricAcid: number | null;
    calcium: number | null;
    copper: number | null;
    iron: number | null;
    phosphates: number | null;
    salt: number | null;
    tds: number | null;
  };
  imageUrl: string;
  analysis: {
    timestamp: string;
    aiModel: string;
    confidence: number;
  };
}

interface EquipmentAnalysis {
  imageUrl: string;
  analysis: {
    type: string;
    brand?: string;
    model?: string;
    condition: string;
    issues: string[];
    recommendations: string[];
  };
}

export const aiService = {
  async analyzeTestStrip(imageBase64: string, sessionId: string): Promise<ApiResponse<TestStripAnalysis>> {
    try {
      console.log('🤖 [AI Service] Analyzing test strip...');
      const response = await apiClient.post<TestStripAnalysis>('/ai/analyze-test-strip', {
        image: imageBase64,
        sessionId: sessionId
      });
      console.log('🤖 [AI Service] Test strip analysis complete:', response);
      return response;
    } catch (error: any) {
      console.error('🤖 [AI Service] Test strip analysis failed:', error);
      
      // Return a more user-friendly error
      if (error?.response?.status === 500) {
        return {
          success: false,
          error: 'Server error. Please try again later.',
          message: error?.response?.data?.message || 'Internal server error'
        };
      }
      
      throw error;
    }
  },

  async analyzeEquipment(imageBase64: string, equipmentType?: string): Promise<ApiResponse<EquipmentAnalysis>> {
    try {
      console.log('🤖 [AI Service] Analyzing equipment...');
      const response = await apiClient.post<EquipmentAnalysis>('/ai/analyze-equipment', {
        image: imageBase64,
        equipmentType,
      });
      console.log('🤖 [AI Service] Equipment analysis complete:', response);
      return response;
    } catch (error) {
      console.error('🤖 [AI Service] Equipment analysis failed:', error);
      throw error;
    }
  },

  async analyzePoolSatellite(address: string): Promise<ApiResponse<any>> {
    try {
      console.log('🤖 [AI Service] Analyzing pool satellite view...');
      const response = await apiClient.post('/ai/analyze-pool-satellite', {
        address,
      });
      console.log('🤖 [AI Service] Satellite analysis complete:', response);
      return response;
    } catch (error) {
      console.error('🤖 [AI Service] Satellite analysis failed:', error);
      throw error;
    }
  },

  async analyzePoolSurface(imageBase64: string, sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.post('/ai/analyze-pool-surface', {
      image: imageBase64,
      sessionId,
    });
  },

  async analyzeEnvironment(images: string[], sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.post('/ai/analyze-environment', {
      images,
      sessionId,
    });
  },

  async analyzeSkimmers(images: string[], sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.post('/ai/analyze-skimmers', {
      images,
      sessionId,
    });
  },

  async analyzeDeck(images: string[], sessionId: string): Promise<ApiResponse<any>> {
    return apiClient.post('/ai/analyze-deck', {
      images,
      sessionId,
    });
  },

  async generateWaterChemistryInsights(readings: any): Promise<ApiResponse<any>> {
    return apiClient.post('/ai/insights/water-chemistry', {
      readings,
    });
  },

  async transcribeVoiceNote(audioBase64: string): Promise<ApiResponse<any>> {
    return apiClient.post('/ai/transcribe-voice', {
      audio: audioBase64,
    });
  },

  // Legacy methods for onboarding sessions
  async analyzeTestStripForSession(sessionId: string, imageBase64: string) {
    return apiClient.put(`/onboarding/sessions/${sessionId}/water-chemistry`, {
      testStripImage: imageBase64,
    });
  },

  async analyzeEquipmentForSession(sessionId: string, equipment: any[]) {
    return apiClient.put(`/onboarding/sessions/${sessionId}/equipment`, {
      equipment,
    });
  },

  async analyzePoolLocation(sessionId: string, address: string) {
    return apiClient.post(`/onboarding/sessions/${sessionId}/analyze-pool-location`, {
      address,
    });
  },

  async uploadVoiceNote(sessionId: string, audioBase64: string, category?: string) {
    return apiClient.post(`/onboarding/sessions/${sessionId}/voice-note`, {
      audio: audioBase64,
      category,
    });
  },
};