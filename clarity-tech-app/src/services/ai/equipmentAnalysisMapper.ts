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
  // New aggregated equipment fields
  pump?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    condition?: string;
    horsepower?: string;
    age?: string;
    type?: string;
  };
  filter?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    condition?: string;
    type?: string;
    size?: string;
  };
  heater?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    condition?: string;
    type?: string;
    capacity?: string;
  };
  sanitizer?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    condition?: string;
    type?: string;
  };
  confidence?: number;
  imagesAnalyzed?: number;
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
    
    // Check for specific equipment in the aggregated response
    if (response.pump) {
      logger.info('📝 Mapping pump data:', response.pump, 'equipment-mapper');
      if (response.pump.brand) updates.pumpManufacturer = response.pump.brand;
      if (response.pump.model) updates.pumpModel = response.pump.model;
      if (response.pump.serialNumber) updates.pumpSerialNumber = response.pump.serialNumber;
      if (response.pump.horsepower) updates.pumpHP = response.pump.horsepower;
      if (response.pump.age) updates.pumpAge = response.pump.age;
      
      // Set pump type based on model
      if (response.pump.model?.toLowerCase().includes('variable') || 
          response.pump.model?.toLowerCase().includes('vs')) {
        updates.pumpType = 'variable-speed';
      } else if (response.pump.model?.toLowerCase().includes('two')) {
        updates.pumpType = 'two-speed';
      }
    }
    
    if (response.filter) {
      logger.info('📝 Mapping filter data:', response.filter, 'equipment-mapper');
      if (response.filter.brand) updates.filterManufacturer = response.filter.brand;
      if (response.filter.model) updates.filterModel = response.filter.model;
      if (response.filter.serialNumber) updates.filterSerialNumber = response.filter.serialNumber;
      if (response.filter.type) updates.filterSize = response.filter.type;
      
      // Determine filter type
      if (response.filter.model?.toLowerCase().includes('cartridge') ||
          response.filter.type?.toLowerCase().includes('cartridge')) {
        updates.filterType = 'cartridge';
      } else if (response.filter.model?.toLowerCase().includes('de')) {
        updates.filterType = 'DE';
      } else if (response.filter.model?.toLowerCase().includes('sand')) {
        updates.filterType = 'sand';
      }
    }
    
    if (response.heater) {
      logger.info('📝 Mapping heater data:', response.heater, 'equipment-mapper');
      if (response.heater.brand) updates.heaterManufacturer = response.heater.brand;
      if (response.heater.model) updates.heaterModel = response.heater.model;
      if (response.heater.serialNumber) updates.heaterSerialNumber = response.heater.serialNumber;
      if (response.heater.capacity) updates.heaterBTU = response.heater.capacity;
      
      // Determine heater type
      if (response.heater.model?.toLowerCase().includes('heat pump')) {
        updates.heaterType = 'heat-pump';
      } else if (response.heater.model?.toLowerCase().includes('gas')) {
        updates.heaterType = 'gas';
      } else if (response.heater.model?.toLowerCase().includes('electric')) {
        updates.heaterType = 'electric';
      }
    }
    
    if (response.sanitizer) {
      logger.info('📝 Mapping sanitizer data:', response.sanitizer, 'equipment-mapper');
      if (response.sanitizer.brand) updates.sanitizerManufacturer = response.sanitizer.brand;
      if (response.sanitizer.model) updates.sanitizerModel = response.sanitizer.model;
      if (response.sanitizer.serialNumber) updates.sanitizerSerialNumber = response.sanitizer.serialNumber;
      
      // Determine sanitizer type
      if (response.sanitizer.type === 'chlorinator' || 
          response.sanitizer.model?.toLowerCase().includes('salt')) {
        updates.sanitizerType = 'salt';
      } else if (response.sanitizer.model?.toLowerCase().includes('chlorine')) {
        updates.sanitizerType = 'chlorine';
      }
    }
    
    // Also handle legacy single equipment response
    const type = response.equipmentType?.toLowerCase();
    if (!response.pump && !response.filter && !response.heater && !response.sanitizer) {
      // Fallback to original mapping logic for single equipment
      // Map based on equipment type
      
      // Map pump info
      if (type === 'pump' || response.specifications?.horsepower) {
        if (response.brand) updates.pumpManufacturer = response.brand;
        if (response.model) updates.pumpModel = response.model;
        if (response.serialNumber) updates.pumpSerialNumber = response.serialNumber;
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
        
        // Determine sanitizer type
        if (response.model?.toLowerCase().includes('salt')) {
          updates.sanitizerType = 'salt';
        }
        
        logger.info('📝 Mapped sanitizer data:', updates, 'equipment-mapper');
      }
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
        } else if (eqType.includes('filter') && !updates.filterManufacturer && eq.brand) {
          updates.filterManufacturer = eq.brand;
          updates.filterModel = eq.model || '';
        } else if (eqType.includes('heater') && !updates.heaterManufacturer && eq.brand) {
          updates.heaterManufacturer = eq.brand;
          updates.heaterModel = eq.model || '';
        } else if (eqType.includes('sanitizer') && !updates.sanitizerManufacturer && eq.brand) {
          updates.sanitizerManufacturer = eq.brand;
          updates.sanitizerModel = eq.model || '';
        }
      });
    }
    
    // Update state with all mapped data
    const updatedData = { ...this.equipmentData, ...updates };
    this.setEquipmentData(updatedData);
    await this.updateEquipment(updatedData);
    
    logger.info('✅ Equipment mapping complete. Detected equipment:', 
      response.detectedEquipment?.map(eq => eq.type).join(', ') || 'none',
      'equipment-mapper'
    );
  }
}