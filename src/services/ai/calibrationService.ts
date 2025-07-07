import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalibrationData {
  poolId: string;
  measured: {
    length: number;
    width: number;
    surfaceArea: number;
  };
  detected: {
    length: number;
    width: number;
    surfaceArea: number;
  };
  timestamp: string;
  zoomLevel: number;
}

class CalibrationService {
  private readonly STORAGE_KEY = 'pool_calibration_data';
  private calibrationFactors: Map<string, number> = new Map();

  async addCalibrationPoint(data: CalibrationData): Promise<void> {
    try {
      const existing = await this.loadCalibrationData();
      existing.push(data);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
      await this.recalculateFactors();
    } catch (error) {
      console.error('Error saving calibration data:', error);
    }
  }

  async getCalibrationFactor(zoomLevel: number): Promise<number> {
    // Calculate factor based on zoom level and historical data
    const baseFactors = await this.loadFactors();
    
    // Interpolate based on zoom level
    const factor = baseFactors.get(zoomLevel.toString()) || 1.0;
    return factor;
  }

  private async recalculateFactors(): Promise<void> {
    const data = await this.loadCalibrationData();
    
    // Group by zoom level
    const grouped = data.reduce((acc, item) => {
      const key = item.zoomLevel.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, CalibrationData[]>);

    // Calculate average correction factor per zoom level
    const factors = new Map<string, number>();
    
    Object.entries(grouped).forEach(([zoom, items]) => {
      const avgFactor = items.reduce((sum, item) => {
        const lengthFactor = item.measured.length / item.detected.length;
        const widthFactor = item.measured.width / item.detected.width;
        return sum + (lengthFactor + widthFactor) / 2;
      }, 0) / items.length;
      
      factors.set(zoom, avgFactor);
    });

    this.calibrationFactors = factors;
    await this.saveFactors(factors);
  }

  private async loadCalibrationData(): Promise<CalibrationData[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async loadFactors(): Promise<Map<string, number>> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEY}_factors`);
      return data ? new Map(JSON.parse(data)) : new Map();
    } catch {
      return new Map();
    }
  }

  private async saveFactors(factors: Map<string, number>): Promise<void> {
    const data = Array.from(factors.entries());
    await AsyncStorage.setItem(`${this.STORAGE_KEY}_factors`, JSON.stringify(data));
  }
}

export const calibrationService = new CalibrationService();