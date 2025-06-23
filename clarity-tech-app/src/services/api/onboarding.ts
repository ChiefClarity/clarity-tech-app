import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { OnboardingData, ApiResponse, WaterChemistry, Equipment } from '../../types';
import { FEATURES } from '../../config/featureFlags';

export interface OnboardingSession {
  id: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  data: Partial<OnboardingData>;
}

export interface SessionsResponse {
  sessions: OnboardingSession[];
}

export interface PhotoUploadResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

export interface VoiceNoteUploadResponse {
  id: string;
  url: string;
  duration?: number;
}

export const onboardingService = {
  async getTechnicianSessions(technicianId: string): Promise<ApiResponse<SessionsResponse>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      return apiClient.get<SessionsResponse>(API_ENDPOINTS.ONBOARDING.GET_SESSIONS);
    } else {
      // Mock implementation
      return {
        success: true,
        data: {
          sessions: []
        }
      };
    }
  },

  async getSession(sessionId: string): Promise<ApiResponse<OnboardingSession>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      return apiClient.get<OnboardingSession>(`${API_ENDPOINTS.ONBOARDING.GET_SESSION}/${sessionId}`);
    } else {
      // Mock implementation
      return {
        success: false,
        error: 'Session not found'
      };
    }
  },

  async startSession(sessionId: string): Promise<ApiResponse<OnboardingSession>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      const endpoint = API_ENDPOINTS.ONBOARDING.START_SESSION.replace(':id', sessionId);
      return apiClient.post<OnboardingSession>(endpoint);
    } else {
      // Mock implementation
      return {
        success: true,
        data: {
          id: sessionId,
          customerId: 'mock-customer',
          customerName: 'Mock Customer',
          technicianId: 'mock-tech',
          status: 'in_progress',
          startedAt: new Date(),
          data: {}
        }
      };
    }
  },

  async updateWaterChemistry(sessionId: string, data: WaterChemistry): Promise<ApiResponse<OnboardingSession>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      const endpoint = API_ENDPOINTS.ONBOARDING.WATER_CHEMISTRY.replace(':id', sessionId);
      return apiClient.post<OnboardingSession>(endpoint, data);
    } else {
      // Mock implementation with offline storage
      const stored = await this.getOfflineSession(sessionId);
      if (stored) {
        stored.data.waterChemistry = data;
        await this.saveOfflineSession(sessionId, stored);
      }
      return { success: true, data: stored as OnboardingSession };
    }
  },

  async updateEquipment(sessionId: string, equipment: Equipment[]): Promise<ApiResponse<OnboardingSession>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      const endpoint = API_ENDPOINTS.ONBOARDING.EQUIPMENT.replace(':id', sessionId);
      return apiClient.post<OnboardingSession>(endpoint, { equipment });
    } else {
      // Mock implementation with offline storage
      const stored = await this.getOfflineSession(sessionId);
      if (stored) {
        stored.data.equipment = equipment;
        await this.saveOfflineSession(sessionId, stored);
      }
      return { success: true, data: stored as OnboardingSession };
    }
  },

  async updatePoolDetails(sessionId: string, details: any): Promise<ApiResponse<OnboardingSession>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      const endpoint = API_ENDPOINTS.ONBOARDING.POOL_DETAILS.replace(':id', sessionId);
      return apiClient.post<OnboardingSession>(endpoint, details);
    } else {
      // Mock implementation with offline storage
      const stored = await this.getOfflineSession(sessionId);
      if (stored) {
        stored.data = { ...stored.data, ...details };
        await this.saveOfflineSession(sessionId, stored);
      }
      return { success: true, data: stored as OnboardingSession };
    }
  },

  async uploadPhoto(sessionId: string, photo: FormData): Promise<ApiResponse<PhotoUploadResponse>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      const endpoint = API_ENDPOINTS.ONBOARDING.UPLOAD_PHOTO.replace(':id', sessionId);
      return apiClient.upload<PhotoUploadResponse>(endpoint, photo);
    } else {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        data: {
          id: `photo-${Date.now()}`,
          url: 'https://example.com/photo.jpg',
          thumbnailUrl: 'https://example.com/photo-thumb.jpg'
        }
      };
    }
  },

  async uploadVoiceNote(sessionId: string, audio: FormData): Promise<ApiResponse<VoiceNoteUploadResponse>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      const endpoint = API_ENDPOINTS.ONBOARDING.UPLOAD_VOICE.replace(':id', sessionId);
      return apiClient.upload<VoiceNoteUploadResponse>(endpoint, audio);
    } else {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        success: true,
        data: {
          id: `voice-${Date.now()}`,
          url: 'https://example.com/voice.mp3',
          duration: 45
        }
      };
    }
  },

  async completeSession(sessionId: string): Promise<ApiResponse<OnboardingSession>> {
    if (FEATURES.USE_REAL_ONBOARDING) {
      const endpoint = API_ENDPOINTS.ONBOARDING.COMPLETE.replace(':id', sessionId);
      return apiClient.post<OnboardingSession>(endpoint);
    } else {
      // Mock implementation
      const stored = await this.getOfflineSession(sessionId);
      if (stored) {
        stored.status = 'completed';
        stored.completedAt = new Date();
        await this.saveOfflineSession(sessionId, stored);
      }
      return { success: true, data: stored as OnboardingSession };
    }
  },

  // Offline storage helpers
  async getOfflineSession(sessionId: string): Promise<OnboardingSession | null> {
    try {
      const stored = localStorage.getItem(`onboarding_session_${sessionId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async saveOfflineSession(sessionId: string, session: OnboardingSession): Promise<void> {
    try {
      localStorage.setItem(`onboarding_session_${sessionId}`, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save offline session:', error);
    }
  },

  async getAllOfflineSessions(): Promise<OnboardingSession[]> {
    const sessions: OnboardingSession[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('onboarding_session_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            sessions.push(JSON.parse(stored));
          }
        }
      }
    } catch (error) {
      console.error('Failed to get offline sessions:', error);
    }
    return sessions;
  }
};