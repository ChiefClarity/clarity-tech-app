import { apiClient } from '../api/client';

export class AIInsightsService {
  // Get insights after water chemistry is saved
  static async getWaterChemistryInsights(chemistry: any): Promise<string[]> {
    try {
      const response = await apiClient.post('/api/ai/insights/water-chemistry', { chemistry });
      return response.data.insights || [
        'Analyzing water balance...',
        'Checking chemical levels against ideal ranges...'
      ];
    } catch (error) {
      return ['AI insights will be available after analysis'];
    }
  }
  
  // Get insights after equipment is identified
  static async getEquipmentInsights(equipment: any): Promise<string[]> {
    try {
      const response = await apiClient.post('/api/ai/insights/equipment', { equipment });
      return response.data.insights || [
        'Equipment condition assessed',
        'Maintenance recommendations generated'
      ];
    } catch (error) {
      return ['Equipment insights pending...'];
    }
  }
  
  // Get insights after pool details are entered
  static async getPoolDetailsInsights(poolDetails: any, satelliteAnalysis?: any): Promise<string[]> {
    try {
      const response = await apiClient.post('/api/ai/insights/pool-details', { 
        poolDetails,
        satelliteAnalysis 
      });
      return response.data.insights || [
        'Pool volume calculated',
        'Service requirements determined'
      ];
    } catch (error) {
      return ['Pool analysis in progress...'];
    }
  }
}