import React, { createContext, useContext, useState } from 'react';

interface OnboardingContextType {
  updateOnboarding: (data: any) => void;
  onboardingData: any;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState({});

  const updateOnboarding = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  return (
    <OnboardingContext.Provider value={{ updateOnboarding, onboardingData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};