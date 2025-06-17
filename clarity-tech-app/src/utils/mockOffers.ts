import { Offer } from '../types';

// Utility to generate mock offers for testing
export const generateMockOffers = (): Offer[] => {
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  
  return [
    {
      id: 'offer-1',
      customerId: 'customer-1',
      customerName: 'John Smith',
      address: '123 Ocean Drive, Miami FL 33101',
      poolSize: '15,000 gal',
      suggestedDay: 'Tuesday',
      routeProximity: 0.5,
      nextAvailableDate: new Date(2024, 5, 18), // June 18, 2024
      expiresAt: thirtyMinutesFromNow,
      offeredAt: now,
    },
    {
      id: 'offer-2',
      customerId: 'customer-2',
      customerName: 'Sarah Johnson',
      address: '456 Palm Avenue, Miami FL 33102',
      poolSize: '20,000 gal',
      suggestedDay: 'Thursday',
      routeProximity: 1.2,
      nextAvailableDate: new Date(2024, 5, 20), // June 20, 2024
      expiresAt: new Date(now.getTime() + 25 * 60 * 1000), // 25 minutes from now
      offeredAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      id: 'offer-3',
      customerId: 'customer-3',
      customerName: 'Mike Rodriguez',
      address: '789 Coral Street, Miami FL 33103',
      poolSize: '12,000 gal',
      suggestedDay: 'Wednesday',
      routeProximity: 2.1,
      nextAvailableDate: new Date(2024, 5, 19), // June 19, 2024
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes from now
      offeredAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
    },
  ];
};

// Helper to add mock offers to the context for testing
export const addMockOffersToContext = async (addOffer: (offer: Offer) => Promise<void>) => {
  const mockOffers = generateMockOffers();
  
  for (const offer of mockOffers) {
    try {
      await addOffer(offer);
    } catch (error) {
      console.error('Failed to add mock offer:', offer.id, error);
    }
  }
  
  console.log(`Added ${mockOffers.length} mock offers for testing`);
};