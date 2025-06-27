import { apiClient } from './client';

export const aiService = {
  async analyzeTestStrip(sessionId: string, imageBase64: string) {
    return apiClient.put(`/onboarding/sessions/${sessionId}/water-chemistry`, {
      testStripImage: imageBase64,
    });
  },

  async analyzeEquipment(sessionId: string, equipment: any[]) {
    return apiClient.put(`/onboarding/sessions/${sessionId}/equipment`, {
      equipment,
    });
  },

  async analyzePoolLocation(sessionId: string, address: string) {
    return apiClient.post(`/onboarding/sessions/${sessionId}/analyze-pool-location`, {
      address,
    });
  },

  async uploadVoiceNote(sessionId: string, audioBase64: string, category?: string) {
    return apiClient.post(`/onboarding/sessions/${sessionId}/voice-note`, {
      audio: audioBase64,
      category,
    });
  },
};