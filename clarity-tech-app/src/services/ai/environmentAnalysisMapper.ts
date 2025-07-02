import { Control, UseFormSetValue } from 'react-hook-form';
import { logger } from '../../utils/logger';

interface BackendEnvironmentResponse {
  vegetation?: {
    treesPresent?: boolean;
    treeCount?: number;
    treeTypes?: string[];
    proximityToPool?: string;
    overhangRisk?: string;
    debrisRisk?: string;
  };
  groundConditions?: {
    surfaceType?: string;
    drainage?: string;
    erosionRisk?: string;
    sprinklersPresent?: boolean;
  };
  environmentalFactors?: {
    sunExposure?: string;
    windExposure?: string;
    privacyLevel?: string;
  };
  maintenanceChallenges?: string[];
  recommendations?: string[];
}

export class EnvironmentAnalysisMapper<T extends Record<string, any>> {
  private setValue: UseFormSetValue<T>;
  private control: Control<T>;

  constructor(setValue: UseFormSetValue<T>, control: Control<T>) {
    this.setValue = setValue;
    this.control = control;
  }

  mapResponseToForm(response: BackendEnvironmentResponse): void {
    logger.info('🌳 Mapping environment analysis to form:', response, 'environment-mapper');

    // Map vegetation
    if (response.vegetation) {
      const veg = response.vegetation;
      
      // Trees
      if (veg.treesPresent !== undefined) {
        this.setValue('nearbyTrees' as any, veg.treesPresent);
        logger.info(`📝 Set nearbyTrees to: ${veg.treesPresent}`, 'environment-mapper');
      }
      
      // Tree types
      if (veg.treeTypes && veg.treeTypes.length > 0) {
        const treeTypesString = veg.treeTypes.join(', ');
        this.setValue('treeTypes' as any, treeTypesString);
        logger.info(`📝 Set treeTypes to: ${treeTypesString}`, 'environment-mapper');
      }
    }
    
    // Map ground conditions
    if (response.groundConditions) {
      const ground = response.groundConditions;
      
      // Surface type
      if (ground.surfaceType) {
        this.setValue('grassOrDirt' as any, ground.surfaceType);
        logger.info(`📝 Set grassOrDirt to: ${ground.surfaceType}`, 'environment-mapper');
      }
      
      // Sprinklers
      if (ground.sprinklersPresent !== undefined) {
        this.setValue('sprinklerSystem' as any, ground.sprinklersPresent);
        logger.info(`📝 Set sprinklerSystem to: ${ground.sprinklersPresent}`, 'environment-mapper');
      }
    }

    logger.info('✅ Environment mapping complete', 'environment-mapper');
  }
}