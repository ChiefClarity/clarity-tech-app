import { apiClient } from './client';
import { ApiResponse } from '../../types';
import { getCompressionPreset, compressImageForAI } from '../../utils/imageCompression';
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
  analyzedBy?: string; // Which AI provider was used
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
  analyzedBy?: string; // Which AI provider was used
}

export const aiService = {
  async analyzeTestStrip(imageUri: string, sessionId: string): Promise<ApiResponse<TestStripAnalysis>> {
    try {
      console.log('🤖 [AI Service] Preparing test strip for analysis...');
      
      // Compress image before sending
      const compressionOptions = getCompressionPreset('testStrip');
      const compressed = await compressImageForAI(imageUri, compressionOptions);
      
      console.log('🤖 [AI Service] Image compressed:', {
        originalSize: `${(compressed.originalSize! / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(compressed.compressedSize! / 1024 / 1024).toFixed(2)}MB`,
        reduction: `${compressed.compressionRatio?.toFixed(1)}%`,
        dimensions: `${compressed.width}x${compressed.height}`
      });
      
      // Use compressed base64 (already includes data URL prefix)
      const imageBase64 = compressed.base64 || imageUri;
      
      const response = await apiClient.post<TestStripAnalysis>('/ai/analyze-test-strip', {
        image: imageBase64,
        sessionId: sessionId
      });
      
      console.log('🤖 [AI Service] Test strip analysis complete:', response);
      
      // Log which AI provider was used if available
      if (response.data?.analyzedBy) {
        console.log(`🤖 [AI Service] Analysis performed by: ${response.data.analyzedBy}`);
      }
      
      return response;
    } catch (error: any) {
      console.error('🤖 [AI Service] Test strip analysis failed:', error);
      
      // Enhanced error messages for specific issues
      if (error?.response?.status === 403) {
        return {
          success: false,
          error: 'AI service authentication error. Please contact support.',
          message: 'The AI service is temporarily unavailable due to configuration issues.'
        };
      }
      
      if (error?.response?.status === 500) {
        return {
          success: false,
          error: 'Server error. The system is attempting alternative analysis methods.',
          message: error?.response?.data?.message || 'Internal server error'
        };
      }
      
      if (error?.response?.status === 503) {
        return {
          success: false,
          error: 'AI services are temporarily unavailable. Please try again in a moment.',
          message: 'All AI providers are currently at capacity.'
        };
      }
      
      throw error;
    }
  },

  async analyzeEquipment(images: string | string[], sessionId?: string, equipmentType?: string): Promise<ApiResponse<any>> {
    try {
      console.log('🤖 [AI Service] Starting equipment analysis...');
      
      // Handle both single image (for backward compatibility) and multiple images
      const imageArray = Array.isArray(images) ? images : [images];
      console.log(`🤖 [AI Service] Processing ${imageArray.length} equipment images`);
      
      // Compress all images
      const compressionOptions = getCompressionPreset('equipment');
      const compressedImages = await Promise.all(
        imageArray.map(async (image, index) => {
          console.log(`🤖 [AI Service] Compressing image ${index + 1}/${imageArray.length}`);
          const compressed = await compressImageForAI(image, compressionOptions);
          return compressed.base64 || image;
        })
      );
      
      console.log('🤖 [AI Service] All images compressed, sending to API...');
      
      const response = await apiClient.post('/ai/analyze-equipment', {
        images: compressedImages,  // Send as array
        sessionId,
        equipmentType,
      });
      
      console.log('🤖 [AI Service] Equipment analysis complete:', response);
      return response;
    } catch (error) {
      console.error('🤖 [AI Service] Equipment analysis failed:', error);
      
      // Enhanced error handling
      if (error?.response?.status === 413) {
        return {
          success: false,
          error: 'Images are too large. Please try fewer images or reduce image quality.',
          message: 'Image size limit exceeded'
        };
      }
      
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

  async analyzePoolSurface(imageUri: string, sessionId: string): Promise<ApiResponse<any>> {
    // Compress image
    const compressionOptions = getCompressionPreset('pool');
    const compressed = await compressImageForAI(imageUri, compressionOptions);
    const imageBase64 = compressed.base64 || imageUri;
    
    const result = await apiClient.post('/ai/analyze-pool-surface', {
      image: imageBase64,
      sessionId,
    });
    
    console.log('🔍 aiService.analyzePoolSurface raw result:', result);
    
    return result;
  },

  async analyzeEnvironment(images: string[], sessionId: string, context?: any): Promise<ApiResponse<any>> {
    logger.info('🌳 [AI Service] Analyzing environment...', { 
      photoCount: images.length,
      hasContext: !!context 
    });
    
    // Compress multiple images
    const compressionOptions = getCompressionPreset('pool');
    const compressedImages = await Promise.all(
      images.map(async (image) => {
        const compressed = await compressImageForAI(image, compressionOptions);
        return compressed.base64 || image;
      })
    );
    
    return apiClient.post('/ai/analyze-environment', {
      images: compressedImages,
      sessionId,
      context, // Add context to request
    });
  },

  async analyzeSkimmers(images: string[], sessionId: string): Promise<ApiResponse<any>> {
    // Compress multiple images
    const compressionOptions = getCompressionPreset('equipment');
    const compressedImages = await Promise.all(
      images.map(async (image) => {
        const compressed = await compressImageForAI(image, compressionOptions);
        return compressed.base64 || image;
      })
    );
    
    return apiClient.post('/ai/analyze-skimmers', {
      images: compressedImages,
      sessionId,
    });
  },

  async analyzeDeck(images: string[], sessionId: string): Promise<ApiResponse<any>> {
    // Compress multiple images
    const compressionOptions = getCompressionPreset('pool');
    const compressedImages = await Promise.all(
      images.map(async (image) => {
        const compressed = await compressImageForAI(image, compressionOptions);
        return compressed.base64 || image;
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