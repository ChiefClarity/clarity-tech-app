import { Control, UseFormSetValue } from 'react-hook-form';
import { logger } from '../../utils/logger';

interface BackendDeckResponse {
  material?: string;
  condition?: string;
  cleanliness?: string;
  issues?: {
    cracks?: boolean;
    stains?: boolean;
    algaeGrowth?: boolean;
    unevenSurfaces?: boolean;
    drainageIssues?: boolean;
  };
  safetyConcerns?: string[];
  maintenanceNeeded?: string[];
  recommendations?: string[];
}

export class DeckAnalysisMapper<T extends Record<string, any>> {
  private setValue: UseFormSetValue<T>;
  private control: Control<T>;

  constructor(setValue: UseFormSetValue<T>, control: Control<T>) {
    this.setValue = setValue;
    this.control = control;
  }

  mapResponseToForm(response: BackendDeckResponse): void {
    logger.info('🏗️ Mapping deck analysis to form:', response, 'deck-mapper');

    // Map material
    if (response.material) {
      const material = response.material.replace(' ', ' ').toLowerCase();
      this.setValue('deckMaterial' as any, material);
      logger.info(`📝 Set deckMaterial to: ${material}`, 'deck-mapper');
    }

    // Map cleanliness
    if (response.cleanliness) {
      this.setValue('deckCleanliness' as any, response.cleanliness.toLowerCase());
      logger.info(`📝 Set deckCleanliness to: ${response.cleanliness}`, 'deck-mapper');
    }

    logger.info('✅ Deck mapping complete', 'deck-mapper');
  }
}