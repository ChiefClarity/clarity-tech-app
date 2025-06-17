import { MOCK_AI_RESPONSES } from '../mocks/testData';

// TODO: Replace with actual Gemini Vision API integration
export const analyzeEquipmentPhotos = async (photos: string[]): Promise<any> => {
  console.log('🤖 MOCK AI: Analyzing equipment photos...', photos.length);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock data
  return MOCK_AI_RESPONSES.equipment;
};

// TODO: Replace with actual Gemini Vision API for pool shape detection
export const analyzePoolShape = async (photos: string[]): Promise<any> => {
  console.log('🤖 MOCK AI: Analyzing pool shape...');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return MOCK_AI_RESPONSES.poolProfile;
};

// TODO: Replace with actual Claude API for voice transcription
export const transcribeVoiceNote = async (audioUri: string): Promise<string> => {
  console.log('🤖 MOCK AI: Transcribing voice note...');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return "This is a mock transcription. The pool equipment is in good condition. The pump is working well and running quietly. The filter was recently cleaned and cartridge looks good for another season. The salt cell was inspected and is producing chlorine properly. Overall the equipment pad is well organized and maintained. Customer mentioned they had algae issues last summer and prefer to maintain higher chlorine levels.";
};

// TODO: Replace with actual Claude API for report generation
export const generateOnboardingReport = async (data: any): Promise<any> => {
  console.log('🤖 MOCK AI: Generating report...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return {
    summary: "Pool Assessment Complete - 123 Test Pool Lane",
    poolCondition: "Good",
    equipmentStatus: "Functional with minor maintenance needed",
    waterQuality: "Balanced - minor adjustments recommended",
    recommendations: [
      "Replace filter cartridge within 6 months",
      "Adjust pH levels slightly",
      "Monitor salt cell production",
      "Address minor caulking wear around tile line",
      "Consider upgrading to variable speed pump timer",
    ],
    criticalIssues: [],
    pricing: { 
      monthly: 250,
      startup: 150,
      repairs: 0,
    },
    serviceFrequency: "Weekly",
    estimatedTimePerVisit: "45 minutes",
  };
};

// TODO: Replace with actual water chemistry analysis
export const analyzeWaterChemistry = async (testStripPhoto: string): Promise<any> => {
  console.log('🤖 MOCK AI: Analyzing water test strip...');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return MOCK_AI_RESPONSES.waterChemistry;
};

// TODO: Replace with actual pricing algorithm API
export const calculateServicePricing = async (poolData: any): Promise<any> => {
  console.log('🤖 MOCK AI: Calculating service pricing...');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock pricing based on pool size and features
  const basePrice = 200;
  const spaFee = poolData.poolType === 'pool-spa' ? 50 : 0;
  const sizeMultiplier = poolData.poolGallons > 20000 ? 1.2 : 1.0;
  
  const monthlyPrice = Math.round((basePrice + spaFee) * sizeMultiplier);
  
  return {
    monthly: monthlyPrice,
    weekly: Math.round(monthlyPrice / 4),
    biweekly: Math.round(monthlyPrice / 2),
    startup: 150,
  };
};

// Helper function to check if we're in test mode
export const isTestMode = () => {
  return __DEV__; // Only in development
};