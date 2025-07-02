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
    console.log('🎯 SurfaceAnalysisMapper.mapResponseToForm called with:', response);

    // Map material - backend already normalized it
    if (response.material) {
      console.log('📝 Setting surfaceMaterial to:', response.material.toLowerCase());
      this.setValue('surfaceMaterial' as any, response.material.toLowerCase());
    }

    // Map condition - backend already normalized it
    if (response.condition) {
      console.log('📝 Setting surfaceCondition to:', response.condition.toLowerCase());
      this.setValue('surfaceCondition' as any, response.condition.toLowerCase());
    }

    // Map surface issues - convert string severities to boolean + severity
    if (response.issues) {
      console.log('📝 Processing issues:', response.issues);
      const issues = response.issues;
      
      // Stains
      const hasStains = issues.stains && issues.stains !== 'none';
      console.log('📝 Setting surfaceIssues.stains to:', hasStains);
      this.setValue('surfaceIssues.stains' as any, hasStains);
      if (hasStains) {
        const stainSeverity = this.mapSeverity(issues.stains!);
        console.log('📝 Setting surfaceIssues.stainSeverity to:', stainSeverity);
        this.setValue('surfaceIssues.stainSeverity' as any, stainSeverity);
      }

      // Cracks
      const hasCracks = issues.cracks && issues.cracks !== 'none';
      console.log('📝 Setting surfaceIssues.cracks to:', hasCracks);
      this.setValue('surfaceIssues.cracks' as any, hasCracks);
      if (hasCracks) {
        const crackSeverity = this.mapCrackSeverity(issues.cracks!);
        console.log('📝 Setting surfaceIssues.crackSeverity to:', crackSeverity);
        this.setValue('surfaceIssues.crackSeverity' as any, crackSeverity);
      }

      // Roughness - Direct value mapping (no checkbox)
      if (issues.roughness) {
        console.log('📝 Setting surfaceIssues.roughness to:', issues.roughness);
        this.setValue('surfaceIssues.roughness' as any, issues.roughness.toLowerCase());
      } else {
        // Default to smooth if not specified
        console.log('📝 Setting surfaceIssues.roughness to default: smooth');
        this.setValue('surfaceIssues.roughness' as any, 'smooth');
      }

      // Discoloration
      const hasDiscoloration = issues.discoloration && issues.discoloration !== 'none';
      console.log('📝 Setting surfaceIssues.discoloration to:', hasDiscoloration);
      this.setValue('surfaceIssues.discoloration' as any, hasDiscoloration);
      if (hasDiscoloration) {
        const discolorationSeverity = this.mapDiscolorationSeverity(issues.discoloration!);
        console.log('📝 Setting surfaceIssues.discolorationSeverity to:', discolorationSeverity);
        this.setValue('surfaceIssues.discolorationSeverity' as any, discolorationSeverity);
      }

      // Etching
      const hasEtching = issues.etching && issues.etching !== 'none';
      console.log('📝 Setting surfaceIssues.etching to:', hasEtching);
      this.setValue('surfaceIssues.etching' as any, hasEtching);

      // Scaling
      const hasScaling = issues.scaling && issues.scaling !== 'none';
      console.log('📝 Setting surfaceIssues.scaling to:', hasScaling);
      this.setValue('surfaceIssues.scaling' as any, hasScaling);

      // Chipping
      const hasChipping = issues.chipping && issues.chipping !== 'none';
      console.log('📝 Setting surfaceIssues.chipping to:', hasChipping);
      this.setValue('surfaceIssues.chipping' as any, hasChipping);

      // Hollow spots
      const hasHollowSpots = issues.hollow_spots && issues.hollow_spots !== 'none';
      console.log('📝 Setting surfaceIssues.hollowSpots to:', hasHollowSpots);
      this.setValue('surfaceIssues.hollowSpots' as any, hasHollowSpots);

      // Set hasVisibleDamage if any issue is detected
      const hasAnyDamage = Object.values(issues).some(
        issue => issue && issue !== 'none' && issue !== 'smooth'
      );
      console.log('📝 Setting hasVisibleDamage to:', hasAnyDamage);
      this.setValue('hasVisibleDamage' as any, hasAnyDamage);
    }

    // Add recommendations to notes if available
    if (response.recommendations && response.recommendations.length > 0) {
      const recommendationsText = `AI Recommendations:\n${response.recommendations.join('\n')}`;
      console.log('📝 Setting notes with recommendations:', recommendationsText);
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