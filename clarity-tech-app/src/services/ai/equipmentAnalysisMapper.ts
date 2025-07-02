import { logger } from '../../utils/logger';

interface BackendEquipmentResponse {
  equipmentType?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  age?: string;
  condition?: string;
  issues?: {
    rust?: boolean;
    leaks?: boolean;
    cracks?: boolean;
    electricalIssues?: boolean;
    missingParts?: boolean;
    noise?: boolean;
  };
  specifications?: {
    horsepower?: string;
    voltage?: string;
    filterSize?: string;
    flowRate?: string;
    capacity?: string;
  };
  maintenanceNeeded?: string[];
  recommendations?: string[];
  detectedEquipment?: Array<{
    type: string;
    brand?: string;
    model?: string;
    condition?: string;
  }>;
  pressureReading?: number | null;
  timerSettings?: {
    onTime?: string;
    offTime?: string;
    duration?: string;
  };
}

export class EquipmentAnalysisMapper {
  constructor(
    private equipmentData: any,
    private setEquipmentData: (data: any) => void,
    private updateEquipment: (data: any) => Promise<void>
  ) {}

  async mapResponseToForm(response: BackendEquipmentResponse): Promise<void> {
    logger.info('🔧 Mapping equipment analysis to form:', response, 'equipment-mapper');

    const updates: any = {};

    // Map based on equipment type
    const type = response.equipmentType?.toLowerCase();
    
    // Map pump info
    if (type === 'pump' || response.specifications?.horsepower) {
      if (response.brand) updates.pumpManufacturer = response.brand;
      if (response.model) updates.pumpModel = response.model;
      if (response.serialNumber) updates.pumpSerialNumber = response.serialNumber;
      if (response.condition) updates.pumpCondition = response.condition;
      if (response.specifications?.horsepower) updates.pumpHP = response.specifications.horsepower;
      if (response.specifications?.voltage) updates.pumpVoltage = response.specifications.voltage;
      
      // Determine pump type based on model or features
      if (response.model?.toLowerCase().includes('variable') || 
          response.model?.toLowerCase().includes('vs')) {
        updates.pumpType = 'variable-speed';
      }
      
      logger.info('📝 Mapped pump data:', updates, 'equipment-mapper');
    }
    
    // Map filter info
    if (type === 'filter' || response.specifications?.filterSize) {
      if (response.brand) updates.filterManufacturer = response.brand;
      if (response.model) updates.filterModel = response.model;
      if (response.serialNumber) updates.filterSerialNumber = response.serialNumber;
      if (response.condition) updates.filterCondition = response.condition;
      if (response.specifications?.filterSize) updates.filterSize = response.specifications.filterSize;
      
      // Determine filter type
      if (response.model?.toLowerCase().includes('cartridge')) {
        updates.filterType = 'cartridge';
      } else if (response.model?.toLowerCase().includes('de') || 
                 response.model?.toLowerCase().includes('diatomaceous')) {
        updates.filterType = 'DE';
      } else if (response.model?.toLowerCase().includes('sand')) {
        updates.filterType = 'sand';
      }
      
      logger.info('📝 Mapped filter data:', updates, 'equipment-mapper');
    }
    
    // Map heater info
    if (type === 'heater' || response.specifications?.capacity) {
      if (response.brand) updates.heaterManufacturer = response.brand;
      if (response.model) updates.heaterModel = response.model;
      if (response.serialNumber) updates.heaterSerialNumber = response.serialNumber;
      if (response.condition) updates.heaterCondition = response.condition;
      if (response.specifications?.capacity) updates.heaterBTU = response.specifications.capacity;
      
      // Determine heater type
      if (response.model?.toLowerCase().includes('heat pump')) {
        updates.heaterType = 'heat-pump';
      } else if (response.model?.toLowerCase().includes('gas')) {
        updates.heaterType = 'gas';
      }
      
      logger.info('📝 Mapped heater data:', updates, 'equipment-mapper');
    }
    
    // Map sanitizer info
    if (type === 'chlorinator' || type === 'sanitizer') {
      if (response.brand) updates.sanitizerManufacturer = response.brand;
      if (response.model) updates.sanitizerModel = response.model;
      if (response.serialNumber) updates.sanitizerSerialNumber = response.serialNumber;
      if (response.condition) updates.sanitizerCondition = response.condition;
      
      // Determine sanitizer type
      if (response.model?.toLowerCase().includes('salt')) {
        updates.sanitizerType = 'salt';
      }
      
      logger.info('📝 Mapped sanitizer data:', updates, 'equipment-mapper');
    }
    
    // Map timer settings
    if (response.timerSettings?.onTime || response.timerSettings?.offTime) {
      updates.timerOnTime = response.timerSettings.onTime;
      updates.timerOffTime = response.timerSettings.offTime;
      updates.runDuration = response.timerSettings.duration;
      
      logger.info('📝 Mapped timer settings:', updates, 'equipment-mapper');
    }
    
    // Map pressure reading
    if (response.pressureReading !== null && response.pressureReading !== undefined) {
      updates.pressureReading = response.pressureReading.toString();
      logger.info('📝 Mapped pressure reading:', updates.pressureReading, 'equipment-mapper');
    }
    
    // Handle multiple detected equipment
    if (response.detectedEquipment && response.detectedEquipment.length > 1) {
      logger.info('📝 Multiple equipment detected:', response.detectedEquipment, 'equipment-mapper');
      // Map each piece to appropriate fields
      response.detectedEquipment.forEach(eq => {
        const eqType = eq.type.toLowerCase();
        if (eqType.includes('pump') && !updates.pumpManufacturer && eq.brand) {
          updates.pumpManufacturer = eq.brand;
          updates.pumpModel = eq.model || '';
          if (eq.condition) updates.pumpCondition = eq.condition;
        } else if (eqType.includes('filter') && !updates.filterManufacturer && eq.brand) {
          updates.filterManufacturer = eq.brand;
          updates.filterModel = eq.model || '';
          if (eq.condition) updates.filterCondition = eq.condition;
        } else if (eqType.includes('heater') && !updates.heaterManufacturer && eq.brand) {
          updates.heaterManufacturer = eq.brand;
          updates.heaterModel = eq.model || '';
          if (eq.condition) updates.heaterCondition = eq.condition;
        } else if (eqType.includes('sanitizer') && !updates.sanitizerManufacturer && eq.brand) {
          updates.sanitizerManufacturer = eq.brand;
          updates.sanitizerModel = eq.model || '';
          if (eq.condition) updates.sanitizerCondition = eq.condition;
        }
      });
    }
    
    // Update state with all mapped data
    const updatedData = { ...this.equipmentData, ...updates };
    this.setEquipmentData(updatedData);
    await this.updateEquipment(updatedData);
    
    logger.info('✅ Equipment mapping complete', 'equipment-mapper');
  }
}