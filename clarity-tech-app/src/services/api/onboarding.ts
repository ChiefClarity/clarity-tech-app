import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { OnboardingData, ApiResponse } from '../../types';

// TODO: Integrate Claude API for report generation
// TODO: Integrate pricing algorithm API

export const onboardingService = {
  // TODO: Connect to Poolbrain API for job creation
  async create(data: OnboardingData): Promise<ApiResponse<OnboardingData>> {
    return apiClient.post<OnboardingData>(API_ENDPOINTS.ONBOARDING.CREATE, data);
  },

  async update(id: string, data: Partial<OnboardingData>): Promise<ApiResponse<OnboardingData>> {
    return apiClient.put<OnboardingData>(`${API_ENDPOINTS.ONBOARDING.UPDATE}/${id}`, data);
  },

  async list(params?: { page?: number; limit?: number }): Promise<ApiResponse<OnboardingData[]>> {
    return apiClient.get<OnboardingData[]>(API_ENDPOINTS.ONBOARDING.LIST, params);
  },

  // TODO: Implement real photo upload to S3/cloud storage
  async uploadPhoto(photo: FormData): Promise<ApiResponse<{ url: string }>> {
    return apiClient.upload<{ url: string }>(API_ENDPOINTS.ONBOARDING.UPLOAD_PHOTO, photo);
  },

  // TODO: Implement real voice note upload to S3/cloud storage
  async uploadVoiceNote(audio: FormData): Promise<ApiResponse<{ url: string }>> {
    return apiClient.upload<{ url: string }>(API_ENDPOINTS.ONBOARDING.UPLOAD_VOICE, audio);
  },
};