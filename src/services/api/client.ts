// Mock API client for demonstration
class ApiClient {
  async post(endpoint: string, data: any): Promise<any> {
    console.log(`API POST ${endpoint}:`, data);
    
    // Mock response based on endpoint
    if (endpoint === '/ai/analyze-weather-pollen') {
      return {
        success: true,
        data: {
          avgRainfall: 52.4,
          windPatterns: 'Moderate easterly winds',
          seasonalFactors: {
            summer: { avgTemp: 85, humidity: 75 },
            winter: { avgTemp: 65, humidity: 60 },
            spring: { avgTemp: 78, humidity: 70 },
            fall: { avgTemp: 75, humidity: 68 }
          },
          pollenData: {
            currentLevel: 'moderate',
            mainTypes: ['Oak', 'Grass'],
            forecast: 'High levels expected this week'
          }
        }
      };
    }
    
    return { success: true, data: {} };
  }
  
  async get(endpoint: string): Promise<any> {
    console.log(`API GET ${endpoint}`);
    return { success: true, data: {} };
  }
}

export const apiClient = new ApiClient();