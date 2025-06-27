import { apiClient } from './client';

export interface AIHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  authentication: {
    method: string;
    secure: boolean;
    recommendation: string;
  };
  providers: {
    gemini: {
      configured: boolean;
      authMethod: string;
      recommendation: string;
    };
    claude: {
      configured: boolean;
      recommendation: string;
    };
  };
  recommendations: string[];
}

export const aiHealthService = {
  async checkHealth(): Promise<AIHealthStatus | null> {
    try {
      const response = await apiClient.get<AIHealthStatus>('/ai/health');
      return response.data || null;
    } catch (error) {
      console.error('Failed to check AI health:', error);
      return null;
    }
  },

  async performHealthCheckWithAlert(): Promise<void> {
    const health = await this.checkHealth();
    
    if (!health) {
      console.warn('⚠️  Unable to verify AI service health');
      return;
    }

    // Log health status
    console.log('🏥 AI Service Health:', {
      status: health.status,
      authentication: health.authentication.method,
      secure: health.authentication.secure,
      providers: {
        gemini: health.providers.gemini.configured ? '✅' : '❌',
        claude: health.providers.claude.configured ? '✅' : '❌'
      }
    });

    // Alert if there are critical issues
    if (!health.providers.gemini.configured && !health.providers.claude.configured) {
      console.error('❌ CRITICAL: No AI providers are configured!');
    } else if (!health.authentication.secure) {
      console.warn('⚠️  AI service is using less secure authentication method');
    }
  }
};