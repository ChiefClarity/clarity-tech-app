import { Control, UseFormSetValue } from 'react-hook-form';
import { logger } from '../../utils/logger';

interface BackendSkimmerResponse {
  detectedSkimmerCount?: number;
  skimmers?: Array<{
    basketCondition?: string;
    lidCondition?: string;
    weirDoorCondition?: string;
    housingCondition?: string;
    visibleDamage?: boolean;
    debrisLevel?: string;
  }>;
  overallCondition?: string;
  maintenanceNeeded?: string[];
  recommendations?: string[];
}

export class SkimmerAnalysisMapper<T extends Record<string, any>> {
  private setValue: UseFormSetValue<T>;
  private control: Control<T>;

  constructor(setValue: UseFormSetValue<T>, control: Control<T>) {
    this.setValue = setValue;
    this.control = control;
  }

  mapResponseToForm(response: BackendSkimmerResponse, photoCount: number): void {
    logger.info('🏊 Mapping skimmer analysis to form:', response, 'skimmer-mapper');
    logger.info('📸 Photo count:', photoCount, 'skimmer-mapper');

    // Use photo count as skimmer count (1 photo per skimmer)
    this.setValue('skimmerCount' as any, photoCount);
    logger.info(`📝 Set skimmerCount to: ${photoCount} (based on photos)`, 'skimmer-mapper');

    // Map individual skimmer conditions
    if (response.skimmers && Array.isArray(response.skimmers)) {
      response.skimmers.forEach((skimmer, index) => {
        if (index < 10) { // Max 10 skimmers
          // Basket condition
          if (skimmer.basketCondition) {
            const fieldName = `skimmer${index + 1}BasketCondition` as any;
            this.setValue(fieldName, skimmer.basketCondition);
            logger.info(`📝 Set ${fieldName} to: ${skimmer.basketCondition}`, 'skimmer-mapper');
          }
          
          // Lid condition
          if (skimmer.lidCondition) {
            const fieldName = `skimmer${index + 1}LidCondition` as any;
            this.setValue(fieldName, skimmer.lidCondition);
            logger.info(`📝 Set ${fieldName} to: ${skimmer.lidCondition}`, 'skimmer-mapper');
          }
        }
      });
    }

    logger.info('✅ Skimmer mapping complete', 'skimmer-mapper');
  }
}