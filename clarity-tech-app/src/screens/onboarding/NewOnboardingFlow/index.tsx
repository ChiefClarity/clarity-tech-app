import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
// Web PWA - no SafeAreaView needed

import { OnboardingProvider, useOnboarding } from '../../../contexts/OnboardingContext';
import { ProgressTracker } from './components/ProgressTracker';
import { NavigationButtons } from './components/NavigationButtons';

// Import ALL existing step components - we'll update them one by one
import { CustomerInfoStep } from './steps/CustomerInfoStep';
import { WaterChemistryStep } from './steps/WaterChemistryStep';
import { PoolDetailsStep } from './steps/PoolDetailsStep';
import { EquipmentStep } from './steps/EquipmentStep';
import { VoiceNoteStep } from './steps/VoiceNoteStep';

// Import theme
import { theme } from '../../../styles/theme';
import { webAlert } from './utils/webAlert';

const STEPS = [
  { id: 'customer', title: 'Customer Info', icon: 'home-outline', component: CustomerInfoStep },
  { id: 'chemistry', title: 'Water Analysis', icon: 'flask-outline', component: WaterChemistryStep },
  { id: 'pool', title: 'Pool Profile', icon: 'location-outline', component: PoolDetailsStep },
  { id: 'equipment', title: 'Equipment Scan', icon: 'construct-outline', component: EquipmentStep },
  { id: 'voice', title: 'Voice Notes', icon: 'mic-outline', component: VoiceNoteStep },
];

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.blueGreen} />
  </View>
);

const OnboardingFlowContent: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { customerId, customerName, offerId } = route.params as any;
  
  const {
    session,
    currentStep,
    loading,
    saving,
    error,
    initializeSession,
    saveAndExit,
    completeSession,
  } = useOnboarding();
  
  // Initialize on mount
  useEffect(() => {
    initializeSession(customerId, customerName, offerId);
  }, [customerId, customerName, offerId]);
  
  // Handle browser back button / page unload for web
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session && !saving) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, saving]);
  
  const handleSaveAndExit = async () => {
    try {
      await saveAndExit();
      navigation.goBack();
    } catch (err) {
      webAlert.alert('Error', 'Failed to save progress. Please try again.');
    }
  };
  
  const handleComplete = async () => {
    try {
      await completeSession();
      webAlert.alert(
        'Success!',
        'Onboarding completed successfully. The customer will receive their report within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard' as never) }]
      );
    } catch (err) {
      webAlert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };
  
  if (!session || loading) {
    return <LoadingScreen />;
  }
  
  const CurrentStepComponent = STEPS[currentStep].component;
  
  return (
    <View style={styles.container}>
      <ProgressTracker
        steps={STEPS}
        currentStep={currentStep}
        onSaveAndExit={handleSaveAndExit}
      />
      
      <View style={styles.content}>
        <CurrentStepComponent />
      </View>
      
      <NavigationButtons
        onComplete={currentStep === STEPS.length - 1 ? handleComplete : undefined}
        saving={saving}
      />
    </View>
  );
};

export const NewOnboardingFlow: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingFlowContent />
    </OnboardingProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Slightly off-white background like old version
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});