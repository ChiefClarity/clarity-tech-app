import { aiAnalysisStorage, CustomerAIAnalysis } from '../aiAnalysis/asyncStorage';

class AIReportService {
  async generateComprehensiveReport(customerId: string): Promise<any> {
    const analysis = await aiAnalysisStorage.getCustomerAnalysis(customerId);
    if (!analysis) {
      throw new Error('No analysis data found for customer');
    }

    return {
      summary: this.generateSummary(analysis),
      poolHealth: this.calculatePoolHealth(analysis),
      recommendations: this.generateRecommendations(analysis),
      pricingFactors: this.extractPricingFactors(analysis),
      detailedAnalysis: {
        surface: this.processSurfaceAnalysis(analysis),
        environment: this.processEnvironmentAnalysis(analysis),
        maintenance: this.generateMaintenanceSchedule(analysis)
      }
    };
  }

  private generateSummary(analysis: CustomerAIAnalysis): string {
    const latestSurface = analysis.analyses.pool.surface[analysis.analyses.pool.surface.length - 1];
    const latestEnvironment = analysis.analyses.environment[analysis.analyses.environment.length - 1];
    
    return `Pool surface is ${latestSurface?.material.detected || 'unknown'} in ${latestSurface?.overallHealthScore > 70 ? 'good' : 'fair'} condition. ` +
           `Environment shows ${latestEnvironment?.trees.detected ? `${latestEnvironment.trees.count} trees nearby` : 'minimal foliage'}.`;
  }

  private calculatePoolHealth(analysis: CustomerAIAnalysis): number {
    const surfaceScore = analysis.analyses.pool.surface[0]?.overallHealthScore || 75;
    const environmentImpact = this.calculateEnvironmentImpact(analysis);
    
    return Math.round(surfaceScore * (1 - environmentImpact / 100));
  }

  private calculateEnvironmentImpact(analysis: CustomerAIAnalysis): number {
    const env = analysis.analyses.environment[0];
    if (!env) return 10;
    
    let impact = 0;
    if (env.trees.detected) impact += env.trees.count * 2;
    if (!env.screenEnclosure.detected) impact += 15;
    impact += (100 - env.sunExposure.hoursPerDay * 10);
    
    return Math.min(impact, 50);
  }

  private generateRecommendations(analysis: CustomerAIAnalysis): string[] {
    const recommendations: string[] = [];
    const surface = analysis.analyses.pool.surface[0];
    const env = analysis.analyses.environment[0];
    
    if (surface?.issues.cracks.detected) {
      recommendations.push('Address surface cracks to prevent water loss');
    }
    
    if (env?.trees.overhangRisk > 0.5) {
      recommendations.push('Trim overhanging branches to reduce debris');
    }
    
    return recommendations;
  }

  private extractPricingFactors(analysis: CustomerAIAnalysis): any {
    // Extract factors that affect pricing
    return {
      surfaceCondition: analysis.analyses.pool.surface[0]?.overallHealthScore || 75,
      maintenanceDifficulty: this.calculateEnvironmentImpact(analysis),
      specialRequirements: analysis.analyses.voiceNotes[0]?.pricingFactors || []
    };
  }

  private processSurfaceAnalysis(analysis: CustomerAIAnalysis): any {
    // Detailed surface analysis for report
    return analysis.analyses.pool.surface[0];
  }

  private processEnvironmentAnalysis(analysis: CustomerAIAnalysis): any {
    // Detailed environment analysis for report
    return analysis.analyses.environment[0];
  }

  private generateMaintenanceSchedule(analysis: CustomerAIAnalysis): any {
    // Generate maintenance recommendations based on analysis
    return {
      frequency: 'weekly',
      specialAttention: [],
      seasonalAdjustments: []
    };
  }
}

export const aiReportService = new AIReportService();