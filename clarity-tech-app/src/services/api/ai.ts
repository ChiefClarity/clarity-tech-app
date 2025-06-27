import { apiClient } from './client';
import { ApiResponse } from '../../types';
import { ImageCompressor, getCompressionPreset } from '../../utils/imageCompression';
import { logger } from '../../utils/logger';

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
      logger.info('🤖 [AI Service] Starting test strip analysis...');
      
      // Compress image if it's not already a URI
      let compressedImage = imageBase64;
      if (!imageBase64.startsWith('file://') && !imageBase64.startsWith('data:')) {
        logger.info('Compressing test strip image before sending to AI...');
        const compressionOptions = getCompressionPreset('testStrip');
        const compressionResult = await ImageCompressor.compressForAI(
          `data:image/jpeg;base64,${imageBase64}`,
          compressionOptions
        );
        compressedImage = compressionResult.base64 || imageBase64;
        
        logger.info(`Image compressed: ${compressionResult.compressionRatio?.toFixed(1)}% reduction`);
      }
      
      const response = await apiClient.post<TestStripAnalysis>('/ai/analyze-test-strip', {
        image: compressedImage,
        sessionId: sessionId
      });
      
      logger.info('🤖 [AI Service] Test strip analysis complete:', response);
      return response;
    } catch (error: any) {
      logger.error('🤖 [AI Service] Test strip analysis failed:', error);
      
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
      logger.info('🤖 [AI Service] Starting equipment analysis...');
      
      // Compress image
      let compressedImage = imageBase64;
      if (!imageBase64.startsWith('file://') && !imageBase64.startsWith('data:')) {
        logger.info('Compressing equipment image before sending to AI...');
        const compressionOptions = getCompressionPreset('equipment');
        const compressionResult = await ImageCompressor.compressForAI(
          `data:image/jpeg;base64,${imageBase64}`,
          compressionOptions
        );
        compressedImage = compressionResult.base64 || imageBase64;
        
        logger.info(`Image compressed: ${compressionResult.compressionRatio?.toFixed(1)}% reduction`);
      }
      
      const response = await apiClient.post<EquipmentAnalysis>('/ai/analyze-equipment', {
        image: compressedImage,
        equipmentType,
      });
      
      logger.info('🤖 [AI Service] Equipment analysis complete:', response);
      return response;
    } catch (error) {
      logger.error('🤖 [AI Service] Equipment analysis failed:', error);
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
    // Compress image
    let compressedImage = imageBase64;
    if (!imageBase64.startsWith('file://') && !imageBase64.startsWith('data:')) {
      const compressionOptions = getCompressionPreset('pool');
      const compressionResult = await ImageCompressor.compressForAI(
        `data:image/jpeg;base64,${imageBase64}`,
        compressionOptions
      );
      compressedImage = compressionResult.base64 || imageBase64;
    }
    
    return apiClient.post('/ai/analyze-pool-surface', {
      image: compressedImage,
      sessionId,
    });
  },

  async analyzeEnvironment(images: string[], sessionId: string): Promise<ApiResponse<any>> {
    // Compress multiple images
    const compressedImages = await Promise.all(
      images.map(async (image) => {
        if (!image.startsWith('file://') && !image.startsWith('data:')) {
          const compressionOptions = getCompressionPreset('pool');
          const compressionResult = await ImageCompressor.compressForAI(
            `data:image/jpeg;base64,${image}`,
            compressionOptions
          );
          return compressionResult.base64 || image;
        }
        return image;
      })
    );
    
    return apiClient.post('/ai/analyze-environment', {
      images: compressedImages,
      sessionId,
    });
  },

  async analyzeSkimmers(images: string[], sessionId: string): Promise<ApiResponse<any>> {
    // Compress multiple images
    const compressedImages = await Promise.all(
      images.map(async (image) => {
        if (!image.startsWith('file://') && !image.startsWith('data:')) {
          const compressionOptions = getCompressionPreset('equipment');
          const compressionResult = await ImageCompressor.compressForAI(
            `data:image/jpeg;base64,${image}`,
            compressionOptions
          );
          return compressionResult.base64 || image;
        }
        return image;
      })
    );
    
    return apiClient.post('/ai/analyze-skimmers', {
      images: compressedImages,
      sessionId,
    });
  },

  async analyzeDeck(images: string[], sessionId: string): Promise<ApiResponse<any>> {
    // Compress multiple images
    const compressedImages = await Promise.all(
      images.map(async (image) => {
        if (!image.startsWith('file://') && !image.startsWith('data:')) {
          const compressionOptions = getCompressionPreset('pool');
          const compressionResult = await ImageCompressor.compressForAI(
            `data:image/jpeg;base64,${image}`,
            compressionOptions
          );
          return compressionResult.base64 || image;
        }
        return image;
      })
    );
    
    return apiClient.post('/ai/analyze-deck', {
      images: compressedImages,
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