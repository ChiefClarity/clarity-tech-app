import { Control, UseFormSetValue } from 'react-hook-form';

// Type definitions - interface will be provided by the consuming component

interface SurfaceAnalysisResponse {
  surface_type?: string;
  material?: string;
  condition?: string;
  age_estimate?: string;
  issues_detected?: {
    stains?: {
      present: boolean;
      severity?: 'minor' | 'moderate' | 'severe';
      type?: string;
    };
    cracks?: {
      present: boolean;
      severity?: 'minor' | 'moderate' | 'severe';
      count?: number;
    };
    roughness?: {
      present: boolean;
      scale?: number; // 1-10
    };
    discoloration?: {
      present: boolean;
      severity?: 'minor' | 'moderate' | 'severe';
    };
    etching?: {
      present: boolean;
      severity?: 'minor' | 'moderate' | 'severe';
    };
    scaling?: {
      present: boolean;
      severity?: 'minor' | 'moderate' | 'severe';
    };
    chipping?: {
      present: boolean;
      severity?: 'minor' | 'moderate' | 'severe';
    };
    hollow_spots?: {
      present: boolean;
      count?: number;
    };
  };
  recommendations?: string[];
  confidence?: number;
}

export class SurfaceAnalysisMapper<T extends Record<string, any>> {
  private setValue: UseFormSetValue<T>;
  private control: Control<T>;

  constructor(setValue: UseFormSetValue<T>, control: Control<T>) {
    this.setValue = setValue;
    this.control = control;
  }

  /**
   * Maps AI surface analysis response to form fields
   */
  mapResponseToForm(response: SurfaceAnalysisResponse): void {
    console.log('🎯 Mapping surface analysis to form:', response);

    // Map basic surface fields
    if (response.surface_type) {
      this.setValue('surfaceType' as any, this.mapSurfaceType(response.surface_type));
    }

    if (response.material) {
      this.setValue('surfaceMaterial' as any, this.mapSurfaceMaterial(response.material));
    }

    if (response.condition) {
      this.setValue('surfaceCondition' as any, this.mapCondition(response.condition));
    }

    if (response.age_estimate) {
      this.setValue('surfaceAge' as any, response.age_estimate);
    }

    // Map surface issues with proper boolean values
    if (response.issues_detected) {
      const issues = response.issues_detected;
      
      // Create the surface issues object
      const surfaceIssues = {
        stains: issues.stains?.present === true,
        cracks: issues.cracks?.present === true,
        roughTexture: issues.roughness?.present === true,
        discoloration: issues.discoloration?.present === true,
        etching: issues.etching?.present === true,
        scaling: issues.scaling?.present === true,
        chipping: issues.chipping?.present === true,
        hollowSpots: issues.hollow_spots?.present === true,
      };

      // Set all surface issues at once
      this.setValue('surfaceIssues' as any, surfaceIssues);

      // Set visible damage flag if any issues are detected
      const hasAnyDamage = Object.values(surfaceIssues).some(issue => issue === true);
      this.setValue('hasVisibleDamage' as any, hasAnyDamage);

      // Set roughness scale if detected
      if (issues.roughness?.scale !== undefined) {
        this.setValue('surfaceRoughness' as any, issues.roughness.scale);
      }

      // Log what we're setting
      console.log('✅ Setting surface issues:', surfaceIssues);
      console.log('✅ Has visible damage:', hasAnyDamage);
    }

    // Add recommendations to notes if available
    if (response.recommendations && response.recommendations.length > 0) {
      const recommendationsText = `AI Recommendations:\n${response.recommendations.join('\n')}`;
      this.setValue('notes' as any, recommendationsText);
    }
  }

  /**
   * Maps AI surface type to form values
   */
  private mapSurfaceType(aiType: string): string {
    const typeMap: { [key: string]: string } = {
      'plaster': 'plaster',
      'pebble': 'pebble',
      'tile': 'tile',
      'fiberglass': 'fiberglass',
      'vinyl': 'vinyl',
      'concrete': 'concrete',
      'painted': 'painted'
    };

    const normalized = aiType.toLowerCase().trim();
    return typeMap[normalized] || 'plaster'; // Default to plaster
  }

  /**
   * Maps AI material type to form values
   */
  private mapSurfaceMaterial(aiMaterial: string): string {
    const materialMap: { [key: string]: string } = {
      'marcite': 'marcite',
      'quartz': 'quartz',
      'pebble': 'pebble',
      'glass_tile': 'glassTile',
      'ceramic_tile': 'ceramicTile',
      'natural_stone': 'naturalStone',
      'fiberglass': 'fiberglass',
      'vinyl': 'vinyl',
      'painted_concrete': 'paintedConcrete'
    };

    const normalized = aiMaterial.toLowerCase().trim();
    return materialMap[normalized] || 'marcite'; // Default to marcite
  }

  /**
   * Maps AI condition assessment to form values
   */
  private mapCondition(aiCondition: string): string {
    const conditionMap: { [key: string]: string } = {
      'excellent': 'excellent',
      'good': 'good',
      'fair': 'fair',
      'poor': 'poor',
      'needs_replacement': 'needsReplacement',
      'needs replacement': 'needsReplacement'
    };

    const normalized = aiCondition.toLowerCase().trim();
    return conditionMap[normalized] || 'good'; // Default to good
  }

  /**
   * Get severity badge props for UI display
   */
  static getSeverityBadgeProps(severity?: 'minor' | 'moderate' | 'severe') {
    switch (severity) {
      case 'severe':
        return { 
          text: 'Severe', 
          backgroundColor: '#fee2e2', 
          textColor: '#dc2626' 
        };
      case 'moderate':
        return { 
          text: 'Moderate', 
          backgroundColor: '#fef3c7', 
          textColor: '#d97706' 
        };
      case 'minor':
      default:
        return { 
          text: 'Minor', 
          backgroundColor: '#dbeafe', 
          textColor: '#2563eb' 
        };
    }
  }
}