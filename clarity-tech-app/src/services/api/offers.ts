import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { Offer, ApiResponse } from '../../types';
import { FEATURES } from '../../config/featureFlags';
import { mockOffers, generateNewOffer } from '../../utils/mockOffers';

export interface OffersResponse {
  offers: Offer[];
}

export interface AcceptOfferResponse {
  success: boolean;
  message?: string;
}

export interface DeclineOfferResponse {
  success: boolean;
  message?: string;
}

export interface UndoOfferResponse {
  success: boolean;
  message?: string;
}

export const offersService = {
  async fetchTechnicianOffers(technicianId: string): Promise<ApiResponse<OffersResponse>> {
    if (FEATURES.USE_REAL_OFFERS) {
      const endpoint = API_ENDPOINTS.OFFERS.GET_TECHNICIAN_OFFERS.replace(':techId', technicianId);
      return apiClient.get<OffersResponse>(endpoint);
    } else {
      // Mock implementation for development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock offers
      return {
        success: true,
        data: {
          offers: mockOffers
        }
      };
    }
  },

  async acceptOffer(offerId: string): Promise<ApiResponse<AcceptOfferResponse>> {
    if (FEATURES.USE_REAL_OFFERS) {
      const endpoint = API_ENDPOINTS.OFFERS.ACCEPT.replace(':id', offerId);
      return apiClient.post<AcceptOfferResponse>(endpoint);
    } else {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 10% failure rate for testing
      if (Math.random() < 0.1) {
        return {
          success: false,
          error: 'Network error occurred'
        };
      }
      
      return {
        success: true,
        data: {
          success: true,
          message: 'Offer accepted successfully'
        }
      };
    }
  },

  async declineOffer(offerId: string): Promise<ApiResponse<DeclineOfferResponse>> {
    if (FEATURES.USE_REAL_OFFERS) {
      const endpoint = API_ENDPOINTS.OFFERS.DECLINE.replace(':id', offerId);
      return apiClient.post<DeclineOfferResponse>(endpoint);
    } else {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate 5% failure rate for testing
      if (Math.random() < 0.05) {
        return {
          success: false,
          error: 'Network error occurred'
        };
      }
      
      return {
        success: true,
        data: {
          success: true,
          message: 'Offer declined successfully'
        }
      };
    }
  },

  async undoOfferAction(offerId: string): Promise<ApiResponse<UndoOfferResponse>> {
    if (FEATURES.USE_REAL_OFFERS) {
      const endpoint = API_ENDPOINTS.OFFERS.UNDO.replace(':id', offerId);
      return apiClient.post<UndoOfferResponse>(endpoint);
    } else {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        data: {
          success: true,
          message: 'Action undone successfully'
        }
      };
    }
  },

  // Helper to generate new offers for testing
  async generateTestOffer(): Promise<Offer> {
    return generateNewOffer();
  }
};