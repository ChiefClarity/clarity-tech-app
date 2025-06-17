import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_CUSTOMER, MOCK_POOL_DATA, MOCK_WATER_DATA } from '../../mocks/testData';

import { theme } from '../../styles/theme';
import { OnboardingData, Customer, WaterChemistry, Equipment, PoolDetails } from '../../types';
import { offlineStorage } from '../../services/storage/offline';
import { syncQueue } from '../../services/storage/queue';
import { API_ENDPOINTS } from '../../constants/api';

// Import step components
import { ModernCustomerInfoStep } from './steps/ModernCustomerInfoStep';
import { ModernWaterChemistryStep } from './steps/ModernWaterChemistryStep';
import { ModernEquipmentStep } from './steps/ModernEquipmentStep';
import { ModernPoolDetailsStep } from './steps/ModernPoolDetailsStep';
import { ModernVoiceNoteStep } from './steps/ModernVoiceNoteStep';
import { ModernCompletionStep } from './steps/ModernCompletionStep';

interface OnboardingStep {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  time: string;
  component: React.ComponentType<any>;
}

export const ModernOnboardingFlowScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [currentStep, setCurrentStep] = useState(0);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  
  // Refs for ALL steps - consistent pattern
  type StepRef = { submitForm: () => void; getCurrentData?: () => any };
  const stepRefs = [
    useRef<StepRef>(null), // Step 0: Customer Info
    useRef<StepRef>(null), // Step 1: Water Analysis  
    useRef<StepRef>(null), // Step 2: Pool Details
    useRef<StepRef>(null), // Step 3: Equipment
    useRef<StepRef>(null), // Step 4: Voice Notes
    useRef<StepRef>(null), // Step 5: Complete
  ];

  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    customer: {} as Customer,
    waterChemistry: {} as WaterChemistry,
    equipment: [],
    poolDetails: {} as PoolDetails,
    photos: [],
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  });

  const steps: OnboardingStep[] = [
    { id: 0, name: 'Quick Start', icon: 'home-outline', time: '2 min', component: ModernCustomerInfoStep },
    { id: 1, name: 'Water Analysis', icon: 'flask-outline', time: '5 min', component: ModernWaterChemistryStep },
    { id: 2, name: 'Pool Profile', icon: 'location-outline', time: '4 min', component: ModernPoolDetailsStep },
    { id: 3, name: 'Equipment Scan', icon: 'construct-outline', time: '6 min', component: ModernEquipmentStep },
    { id: 4, name: 'Voice Notes', icon: 'mic-outline', time: '3 min', component: ModernVoiceNoteStep },
    { id: 5, name: 'Complete', icon: 'checkmark-circle-outline', time: '1 min', component: ModernCompletionStep },
  ];

  // Initialize data from route params or saved progress
  useEffect(() => {
    const initializeData = async () => {
      const params = route.params as any;
      console.log('🔴 ONBOARDING PARAMS:', params);
      console.log('🔴 TEST MODE:', params?.testMode);
      const currentOfferId = params?.offerId;
      const customerId = params?.customerId;
      
      if (currentOfferId || params?.testMode) {
        setOfferId(currentOfferId);
        setCustomerName(params?.customerName || 'Customer');
        
        // Try to load saved progress first
        try {
          const sessionKey = `onboarding_session_${customerId || currentOfferId}`;
          const savedSession = await AsyncStorage.getItem(sessionKey);
          
          if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            
            Alert.alert(
              'Resume Session',
              'Would you like to continue where you left off?',
              [
                { 
                  text: 'Start Over', 
                  onPress: async () => {
                    await AsyncStorage.removeItem(sessionKey);
                    initializeFromParams(params);
                  }
                },
                { 
                  text: 'Continue', 
                  onPress: () => {
                    // Restore form data
                    let restoredFormData = sessionData.formData;
                    
                    // If we saved equipment step data, merge it back
                    if (sessionData.equipmentStepData) {
                      restoredFormData = {
                        ...restoredFormData,
                        equipmentStepData: sessionData.equipmentStepData
                      };
                    }
                    
                    setFormData(restoredFormData);
                    setCurrentStep(sessionData.currentStep);
                    console.log(`📱 [ONBOARDING] Resumed from step ${sessionData.currentStep + 1}`);
                  }
                },
              ],
              { cancelable: false }
            );
            return;
          }
        } catch (error) {
          console.error('Failed to load saved session:', error);
        }
        
        // Initialize from params if no saved session
        initializeFromParams(params);
      } else if (params?.testMode) {
        // In test mode without offerId, initialize with test data
        console.log('🔴 TEST MODE: Initializing with test data');
        initializeFromParams(params);
      }
    };
    
    initializeData();
  }, [route.params]);

  const initializeFromParams = (params: any) => {
    console.log('🔴 initializeFromParams called with:', params);
    
    // Check if we have a full customer object (test mode)
    if (params?.customer) {
      console.log('🔴 Using test customer data:', params.customer);
      setFormData(prev => ({
        ...prev,
        customer: params.customer,
        customerId: params.customer.id || params.customerId,
      }));
    }
    // Otherwise, pre-fill customer data from offer params
    else if (params?.customerName && params?.customerAddress) {
      const [firstName, ...lastNameParts] = params.customerName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const prefilledCustomer: Partial<Customer> = {
        firstName: firstName || '',
        lastName: lastName || '',
        address: params.customerAddress || '',
        email: '',
        phone: '',
        city: '',
        state: '',
        zipCode: '',
        notes: '',
      };
      
      setFormData(prev => ({
        ...prev,
        customer: { ...prefilledCustomer, id: params.customerId || Date.now().toString() } as Customer,
        customerId: params.customerId,
      }));
      
      console.log(`📝 [ONBOARDING] Pre-filled customer data:`, prefilledCustomer);
    }
  };

  const saveProgress = async (data: Partial<OnboardingData>, step: number) => {
    if (!offerId) return;
    
    try {
      const progressData = {
        formData: data,
        currentStep: step,
        lastSaved: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `onboarding_${offerId}_progress`,
        JSON.stringify(progressData)
      );
      
      console.log(`💾 [ONBOARDING] Progress saved for step ${step + 1}`);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleStepPress = (stepId: number) => {
    if (stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  const handleNext = async (stepData: any) => {
    console.log(`🚀 [ONBOARDING] Step ${currentStep + 1} completed:`, steps[currentStep].name);
    console.log('Navigating from', steps[currentStep].name, 'to', steps[currentStep + 1]?.name);
    console.log('Current step:', currentStep);
    console.log('Next step should be:', currentStep + 1);
    console.log('Step data received:', stepData);
    
    try {
      const updatedData = { ...formData };
      switch (currentStep) {
        case 0:
          updatedData.customer = stepData;
          break;
        case 1:
          updatedData.waterChemistry = stepData;
          break;
        case 2:
          console.log('Received from Pool Profile:', stepData);
          updatedData.poolDetails = stepData;
          break;
        case 3:
          updatedData.equipment = stepData;
          console.log('Equipment data saved, moving to Voice Notes');
          break;
        case 4:
          updatedData.voiceNoteUri = stepData.voiceNoteUri;
          break;
        case 5:
          // Complete step - finalize submission
          break;
      }
      
      setFormData(updatedData);

      // Auto-save progress after each step
      if (offerId) {
        await saveProgress(updatedData, currentStep === steps.length - 1 ? currentStep : currentStep + 1);
      }

      if (currentStep === steps.length - 1) {
        await submitOnboarding(updatedData);
      } else {
        const nextStep = currentStep + 1;
        console.log('Setting currentStep to:', nextStep);
        setCurrentStep(nextStep);
        // Scroll to top when changing steps
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.scrollTo) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Navigation failed:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Navigation Error', 'Failed to proceed to the next step. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      Alert.alert(
        'Exit Onboarding',
        'Are you sure you want to exit? Your progress will be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            onPress: async () => {
              if (offerId) {
                await saveProgress(formData, currentStep);
              }
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAndExit = async () => {
    console.log('🔴 SAVE & EXIT CLICKED');
    try {
      // Get current form data from the active step
      const currentStepData = await getCurrentStepData();
      console.log('🔴 Current step data:', currentStepData);
      
      // Merge current step data with existing form data
      const updatedFormData = {
        ...formData,
        [getCurrentStepKey()]: currentStepData,
      };
      
      // Save to AsyncStorage
      const sessionData = {
        customerId: formData.customerId || offerId,
        currentStep,
        timestamp: new Date().toISOString(),
        formData: updatedFormData,
        // Save equipment step's raw data separately if on equipment step
        equipmentStepData: currentStep === 3 ? currentStepData : undefined,
      };
      console.log('🔴 Saving session data:', sessionData);
      
      const sessionKey = `onboarding_session_${formData.customerId || offerId}`;
      console.log('🔴 Session key:', sessionKey);
      
      await AsyncStorage.setItem(
        sessionKey,
        JSON.stringify(sessionData)
      );
      
      // Show confirmation
      Alert.alert(
        'Progress Saved',
        'Your onboarding progress has been saved.',
        [
          { 
            text: 'Exit', 
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('🔴 Failed to save progress:', error);
      Alert.alert('Error', `Failed to save progress: ${error}`);
    }
  };

  // Helper to get current step data
  const getCurrentStepData = async () => {
    const currentRef = stepRefs[currentStep];
    console.log('🔴 getCurrentStepData - currentStep:', currentStep);
    console.log('🔴 getCurrentStepData - currentRef:', currentRef);
    console.log('🔴 getCurrentStepData - currentRef.current:', currentRef?.current);
    
    if (currentRef?.current?.getCurrentData) {
      const data = await currentRef.current.getCurrentData();
      console.log('🔴 getCurrentStepData - retrieved data:', data);
      return data;
    }
    console.log('🔴 getCurrentStepData - no getCurrentData method found');
    return {};
  };

  // Helper to get current step key for data storage
  const getCurrentStepKey = () => {
    const stepKeys = ['customer', 'waterChemistry', 'poolDetails', 'equipment', 'voiceNote', 'completion'];
    return stepKeys[currentStep] || 'unknown';
  };

  const submitOnboarding = async (data: Partial<OnboardingData>) => {
    try {
      await syncQueue.addToQueue({
        type: 'create',
        endpoint: API_ENDPOINTS.ONBOARDING.CREATE,
        data: data,
      });

      // Clear saved progress after successful submission
      if (offerId) {
        await AsyncStorage.removeItem(`onboarding_${offerId}_progress`);
      }

      Alert.alert(
        'Success!',
        'Onboarding has been created and will sync when online.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save onboarding. Please try again.');
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const getCurrentStepComponent = () => {
    const StepComponent = steps[currentStep].component;
    console.log('Rendering step:', currentStep, steps[currentStep].name, 'with data:', formData);
    
    // ALL steps now use refs - consistent pattern
    return (
      <StepComponent
        ref={stepRefs[currentStep]}
        data={formData}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={(data: any) => handleNext(data)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Mobile Header with Progress */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.stepTitle}>{steps[currentStep].name}</Text>
          <Text style={styles.stepCounter}>Step {currentStep + 1} of {steps.length}</Text>
        </View>
        
        <TouchableOpacity onPress={handleSaveAndExit} style={styles.saveButton}>
          <Ionicons name="save-outline" size={16} color={theme.colors.gray} />
          <Text style={styles.saveButtonText}>Save & Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.stepsIndicator}>
          {steps.map((_, index) => {
            const status = getStepStatus(index);
            return (
              <View key={index} style={styles.stepDotContainer}>
                <View style={[
                  styles.stepDot,
                  status === 'completed' && styles.stepDotCompleted,
                  status === 'current' && styles.stepDotCurrent,
                ]}>
                  {status === 'completed' && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
                {index < steps.length - 1 && (
                  <View style={[
                    styles.stepConnector,
                    status === 'completed' && styles.stepConnectorCompleted
                  ]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Main Content - Full Width */}
      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        key={currentStep}
      >
        <View style={styles.contentContainer}>
          {getCurrentStepComponent()}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.navButton, styles.backNavButton]}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={16} color={currentStep === 0 ? theme.colors.gray : theme.colors.blueGreen} />
          <Text style={[styles.navButtonText, styles.backButtonText, 
            currentStep === 0 && { color: theme.colors.gray }]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        {/* Continue button - consistent pattern for ALL steps */}
        <TouchableOpacity
          onPress={() => {
            console.log('Continue button clicked on step:', currentStep, steps[currentStep].name);
            console.log('Calling ref.current?.submitForm() for step:', currentStep);
            stepRefs[currentStep].current?.submitForm();
          }}
          style={[styles.navButton, styles.nextButton]}
        >
          <Text style={[styles.navButtonText, { color: 'white' }]}>
            {currentStep === steps.length - 1 ? 'Complete' : 'Continue'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Dev Menu Button - Only in development */}
      {__DEV__ && (
        <TouchableOpacity 
          style={styles.devButton}
          onPress={() => {
            Alert.alert(
              'Dev Options',
              'Choose an action',
              [
                { 
                  text: 'Fill All Fields', 
                  onPress: () => {
                    // Fill customer data
                    const testData = {
                      ...formData,
                      customer: {
                        id: MOCK_CUSTOMER.id,
                        firstName: MOCK_CUSTOMER.firstName,
                        lastName: MOCK_CUSTOMER.lastName,
                        email: MOCK_CUSTOMER.email,
                        phone: MOCK_CUSTOMER.phone,
                        address: MOCK_CUSTOMER.address,
                        city: MOCK_CUSTOMER.city,
                        state: MOCK_CUSTOMER.state,
                        zipCode: MOCK_CUSTOMER.zipCode,
                      } as Customer,
                      waterChemistry: MOCK_WATER_DATA,
                      poolDetails: MOCK_POOL_DATA,
                    };
                    setFormData(testData);
                    Alert.alert('Success', 'Test data filled!');
                  }
                },
                { 
                  text: 'Skip to Water Chemistry', 
                  onPress: () => setCurrentStep(1) 
                },
                { 
                  text: 'Skip to Pool Details', 
                  onPress: () => setCurrentStep(2) 
                },
                { 
                  text: 'Skip to Equipment', 
                  onPress: () => setCurrentStep(3) 
                },
                { 
                  text: 'Skip to Voice Note', 
                  onPress: () => setCurrentStep(4) 
                },
                { 
                  text: 'Clear All Data', 
                  onPress: () => {
                    setFormData({
                      customer: {} as Customer,
                      waterChemistry: {} as WaterChemistry,
                      equipment: [],
                      poolDetails: {} as PoolDetails,
                      photos: [],
                      syncStatus: 'pending',
                      createdAt: new Date().toISOString(),
                    });
                    setCurrentStep(0);
                    Alert.alert('Cleared', 'All data cleared!');
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Text style={styles.devButtonText}>DEV</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Changed to white background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '700',
    color: theme.colors.darkBlue,
  },
  stepCounter: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.blueGreen + '20',
  },
  saveButtonText: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
    color: theme.colors.blueGreen,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stepsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepDotCurrent: {
    backgroundColor: theme.colors.blueGreen,
    borderWidth: 3,
    borderColor: theme.colors.blueGreen + '40',
  },
  stepConnector: {
    width: 32,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  stepConnectorCompleted: {
    backgroundColor: theme.colors.success,
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: theme.spacing.lg, // Extra padding for mobile
  },
  navButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44, // Mobile touch target
  },
  backNavButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextButton: {
    backgroundColor: theme.colors.blueGreen,
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginHorizontal: theme.spacing.xs,
  },
  backButtonText: {
    color: theme.colors.blueGreen,
  },
  devButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'red',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },
  devButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});