import { Control, UseFormSetValue } from 'react-hook-form';

// Response structure from backend
interface BackendSurfaceResponse {
  material?: string;
  condition?: string;
  issues?: {
    stains?: string;
    cracks?: string;
    roughness?: string;
    discoloration?: string;
    etching?: string;
    scaling?: string;
    chipping?: string;
    hollow_spots?: string;
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
   * Maps backend surface analysis response to form fields
   */
  mapResponseToForm(response: BackendSurfaceResponse): void {
    console.log('🎯 Mapping surface analysis to form:', response);

    // Map material
    if (response.material) {
      this.setValue('surfaceMaterial' as any, response.material.toLowerCase());
    }

    // Map condition
    if (response.condition) {
      this.setValue('surfaceCondition' as any, response.condition.toLowerCase());
    }

    // Map surface issues
    if (response.issues) {
      const issues = response.issues;
      
      // Stains
      if (issues.stains && issues.stains !== 'none') {
        this.setValue('surfaceIssues.stains' as any, true);
        this.setValue('surfaceIssues.stainSeverity' as any, this.mapSeverity(issues.stains));
      } else {
        this.setValue('surfaceIssues.stains' as any, false);
      }

      // Cracks
      if (issues.cracks && issues.cracks !== 'none') {
        this.setValue('surfaceIssues.cracks' as any, true);
        this.setValue('surfaceIssues.crackSeverity' as any, this.mapCrackSeverity(issues.cracks));
      } else {
        this.setValue('surfaceIssues.cracks' as any, false);
      }

      // Roughness
      if (issues.roughness && issues.roughness !== 'smooth') {
        this.setValue('surfaceIssues.roughTexture' as any, true);
        this.setValue('surfaceRoughness' as any, this.mapRoughnessLevel(issues.roughness));
      } else {
        this.setValue('surfaceIssues.roughTexture' as any, false);
      }

      // Discoloration
      if (issues.discoloration && issues.discoloration !== 'none') {
        this.setValue('surfaceIssues.discoloration' as any, true);
        this.setValue('surfaceIssues.discolorationSeverity' as any, this.mapDiscolorationSeverity(issues.discoloration));
      } else {
        this.setValue('surfaceIssues.discoloration' as any, false);
      }

      // Etching
      if (issues.etching && issues.etching !== 'none') {
        this.setValue('surfaceIssues.etching' as any, true);
      } else {
        this.setValue('surfaceIssues.etching' as any, false);
      }

      // Scaling
      if (issues.scaling && issues.scaling !== 'none') {
        this.setValue('surfaceIssues.scaling' as any, true);
      } else {
        this.setValue('surfaceIssues.scaling' as any, false);
      }

      // Chipping
      if (issues.chipping && issues.chipping !== 'none') {
        this.setValue('surfaceIssues.chipping' as any, true);
      } else {
        this.setValue('surfaceIssues.chipping' as any, false);
      }

      // Hollow spots
      if (issues.hollow_spots && issues.hollow_spots !== 'none') {
        this.setValue('surfaceIssues.hollowSpots' as any, true);
      } else {
        this.setValue('surfaceIssues.hollowSpots' as any, false);
      }

      // Set hasVisibleDamage if any issue is detected
      const hasAnyDamage = Object.values(issues).some(
        issue => issue && issue !== 'none' && issue !== 'smooth'
      );
      this.setValue('hasVisibleDamage' as any, hasAnyDamage);
    }

    // Add recommendations to notes if available
    if (response.recommendations && response.recommendations.length > 0) {
      const recommendationsText = `AI Recommendations:\n${response.recommendations.join('\n')}`;
      this.setValue('notes' as any, recommendationsText);
    }
  }

  /**
   * Maps severity descriptions to form values
   */
  private mapSeverity(severity: string): 'light' | 'moderate' | 'heavy' {
    const normalized = severity.toLowerCase();
    if (normalized.includes('light') || normalized.includes('minor')) return 'light';
    if (normalized.includes('heavy') || normalized.includes('severe')) return 'heavy';
    return 'moderate';
  }

  /**
   * Maps crack severity to form values
   */
  private mapCrackSeverity(severity: string): 'minor' | 'major' {
    const normalized = severity.toLowerCase();
    if (normalized.includes('major') || normalized.includes('severe')) return 'major';
    return 'minor';
  }

  /**
   * Maps roughness description to numeric scale
   */
  private mapRoughnessLevel(roughness: string): number {
    const roughnessMap: { [key: string]: number } = {
      'slightly rough': 3,
      'moderately rough': 5,
      'rough': 7,
      'very rough': 9
    };
    return roughnessMap[roughness.toLowerCase()] || 5;
  }

  /**
   * Maps discoloration severity
   */
  private mapDiscolorationSeverity(severity: string): 'minor' | 'significant' {
    const normalized = severity.toLowerCase();
    if (normalized.includes('significant') || normalized.includes('severe')) return 'significant';
    return 'minor';
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