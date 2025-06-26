import { API_CONFIG, getAuthToken } from '../../config/api';

interface EquipmentAnalysisResult {
  equipmentType: string;
  brand: string | null;
  model: string | null;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedAge: string;
  confidence: {
    type: number;
    brand: number;
    model: number;
    overall: number;
  };
  visibleIssues: string[];
  maintenanceRecommendations: string[];
}

export class GeminiVisionService {
  static async analyzeEquipmentPhoto(
    photoUri: string,
    sessionId: string
  ): Promise<EquipmentAnalysisResult> {
    try {
      // Convert photo to blob
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('photo', blob, 'equipment.jpg');
      formData.append('sessionId', sessionId);
      
      // Send to API
      const apiResponse = await fetch(`${API_CONFIG.BASE_URL}/api/ai/analyze-equipment-photo`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      
      if (!apiResponse.ok) {
        throw new Error('Failed to analyze photo');
      }
      
      const result = await apiResponse.json();
      return result.analysis;
    } catch (error) {
      console.error('Gemini Vision analysis failed:', error);
      throw error;
    }
  }
}