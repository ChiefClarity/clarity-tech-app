import { apiClient } from '../api/client';
import { FEATURES } from '../../config/features';

export interface SatelliteAnalysisResult {
  success: boolean;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  satelliteImageUrl: string;
  analysis: {
    poolDetected: boolean;
    poolDimensions?: {
      length: number;
      width: number;
      surfaceArea: number;
    };
    poolShape?: 'rectangle' | 'oval' | 'kidney' | 'freeform' | 'round';
    poolFeatures?: {
      hasSpillover?: boolean;
      hasSpa?: boolean;
      hasWaterFeature?: boolean;
      hasDeck?: boolean;
      deckMaterial?: string;
    };
    propertyFeatures?: {
      treeCount?: number;
      treeProximity?: 'close' | 'moderate' | 'far';
      landscapeType?: string;
      propertySize?: string;
    };
    confidence: number;
    aiModel: string;
  };
}

export class SatelliteAnalyzer {
  async analyzePoolFromAddress(
    address: string, 
    sessionId: string
  ): Promise<SatelliteAnalysisResult> {
    console.log('🛰️ [SatelliteAnalyzer] Starting analysis:', {
      address,
      sessionId,
      USE_REAL_AI: FEATURES.USE_REAL_AI,
      AI_SATELLITE_ANALYSIS: FEATURES.AI_SATELLITE_ANALYSIS
    });
    
    if (FEATURES.USE_REAL_AI) {
      try {
        console.log('🔌 [SatelliteAnalyzer] Making API call to:', '/ai/analyze-pool-satellite');
        
        const response = await apiClient.post('/ai/analyze-pool-satellite', {
          address,
          sessionId
        });

        console.log('🔍 [SatelliteAnalyzer] Response type:', typeof response);
        console.log('🔍 [SatelliteAnalyzer] Response keys:', Object.keys(response));
        console.log('🔍 [SatelliteAnalyzer] Response.data type:', typeof response.data);
        console.log('🔍 [SatelliteAnalyzer] Full response structure:', response);
        
        console.log('📡 [SatelliteAnalyzer] Raw API response:', {
          success: response.success,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          fullResponse: JSON.stringify(response, null, 2)
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Satellite analysis failed');
        }
        
        console.log('✅ [SatelliteAnalyzer] Returning analysis data');
        // The apiClient returns the response directly for AI endpoints
        return response as SatelliteAnalysisResult;
      } catch (error: any) {
        console.error('❌ [SatelliteAnalyzer] API call failed:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        throw error;
      }
    } else {
      console.log('🎭 [SatelliteAnalyzer] Using MOCK data (USE_REAL_AI is false)');
      return this.getMockAnalysis(address);
    }
  }
  
  private getMockAnalysis(address: string): SatelliteAnalysisResult {
    const mockShapes = ['rectangle', 'kidney', 'oval', 'freeform'] as const;
    const randomShape = mockShapes[Math.floor(Math.random() * mockShapes.length)];
    const dimensions = this.generateDimensionsForShape(randomShape);
    
    return {
      success: true,
      location: {
        lat: 26.1224 + (Math.random() * 0.01),
        lng: -80.1373 + (Math.random() * 0.01),
        address: address
      },
      satelliteImageUrl: 'https://maps.googleapis.com/maps/api/staticmap?mock=true',
      analysis: {
        poolDetected: true,
        poolDimensions: dimensions,
        poolShape: randomShape,
        poolFeatures: {
          hasSpillover: Math.random() > 0.7,
          hasSpa: Math.random() > 0.6,
          hasWaterFeature: Math.random() > 0.8,
          hasDeck: true,
          deckMaterial: Math.random() > 0.5 ? 'pavers' : 'concrete'
        },
        propertyFeatures: {
          treeCount: Math.floor(Math.random() * 10) + 2,
          treeProximity: Math.random() > 0.5 ? 'close' : 'moderate',
          landscapeType: 'tropical',
          propertySize: 'medium'
        },
        confidence: 0.85 + Math.random() * 0.1,
        aiModel: 'gemini-vision-mock'
      }
    };
  }
  
  private generateDimensionsForShape(shape: string) {
    switch (shape) {
      case 'rectangle':
        const length = 20 + Math.floor(Math.random() * 20);
        const width = 10 + Math.floor(Math.random() * 10);
        return { length, width, surfaceArea: length * width };
        
      case 'kidney':
        const kLength = 25 + Math.floor(Math.random() * 15);
        const kWidth = 12 + Math.floor(Math.random() * 8);
        return { 
          length: kLength, 
          width: kWidth, 
          surfaceArea: Math.floor(kLength * kWidth * 0.85)
        };
        
      case 'oval':
        const oLength = 20 + Math.floor(Math.random() * 20);
        const oWidth = 10 + Math.floor(Math.random() * 10);
        return { 
          length: oLength, 
          width: oWidth, 
          surfaceArea: Math.floor(Math.PI * (oLength/2) * (oWidth/2))
        };
        
      case 'round':
        const diameter = 15 + Math.floor(Math.random() * 15);
        return { 
          length: diameter, 
          width: diameter, 
          surfaceArea: Math.floor(Math.PI * Math.pow(diameter/2, 2))
        };
        
      default:
        const fLength = 25 + Math.floor(Math.random() * 20);
        const fWidth = 15 + Math.floor(Math.random() * 10);
        return { 
          length: fLength, 
          width: fWidth, 
          surfaceArea: Math.floor(fLength * fWidth * 0.75)
        };
    }
  }
  
  calculateGallons(surfaceArea: number, avgDepth: number): number {
    return Math.round(surfaceArea * avgDepth * 7.48);
  }
  
  calculateAverageDepth(shallowDepth: number, deepDepth: number): number {
    return (shallowDepth * 0.6) + (deepDepth * 0.4);
  }
}

export const satelliteAnalyzer = new SatelliteAnalyzer();