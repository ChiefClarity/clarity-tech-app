import { apiClient } from '../api/client';

interface WeatherData {
  avgRainfall: number;
  windPatterns: string;
  seasonalFactors: {
    summer: { avgTemp: number; humidity: number };
    winter: { avgTemp: number; humidity: number };
    spring: { avgTemp: number; humidity: number };
    fall: { avgTemp: number; humidity: number };
  };
  pollenData?: {
    currentLevel: string;
    mainTypes: string[];
    forecast: string;
  };
}

class WeatherService {
  async getWeatherAndPollenData(address: string): Promise<WeatherData> {
    try {
      // This endpoint integrates with your Gemini API's weather/pollen capabilities
      const response = await apiClient.post('/ai/analyze-weather-pollen', {
        address,
      });
      
      if (response.success) {
        return response.data;
      }
      
      // Fallback to basic data if API fails
      return this.getDefaultWeatherData();
    } catch (error) {
      console.error('Weather/Pollen API error:', error);
      return this.getDefaultWeatherData();
    }
  }

  private getDefaultWeatherData(): WeatherData {
    return {
      avgRainfall: 52.4,
      windPatterns: 'Moderate easterly winds',
      seasonalFactors: {
        summer: { avgTemp: 85, humidity: 75 },
        winter: { avgTemp: 65, humidity: 60 },
        spring: { avgTemp: 78, humidity: 70 },
        fall: { avgTemp: 75, humidity: 68 }
      }
    };
  }
}

export const weatherService = new WeatherService();