import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Haptics removed for web compatibility

import { Header } from '../../components/common/Header';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { theme } from '../../styles/theme';
import { OnboardingData, Customer, WaterChemistry, Equipment, PoolDetails } from '../../types';
import { offlineStorage } from '../../services/storage/offline';
import { syncQueue } from '../../services/storage/queue';
import { API_ENDPOINTS } from '../../constants/api';

import { CustomerInfoStep } from './CustomerInfoStep';
import { WaterChemistryStep } from './WaterChemistryStep';
import { EquipmentStep } from './EquipmentStep';
import { PoolDetailsStep } from './PoolDetailsStep';
import { VoiceNoteStep } from './VoiceNoteStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OnboardingFlowScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [offerId, setOfferId] = useState<string | null>(null);
  
  console.log(`🚀 [ONBOARDING] Rendering OnboardingFlowScreen - Step ${currentStep + 1} of ${5}`);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    customer: {} as Customer,
    waterChemistry: {} as WaterChemistry,
    equipment: [],
    poolDetails: {} as PoolDetails,
    photos: [],
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  });

  // Initialize form data from route params or saved progress
  useEffect(() => {
    const initializeData = async () => {
      const params = route.params as any;
      const currentOfferId = params?.offerId;
      
      if (currentOfferId) {
        setOfferId(currentOfferId);
        
        // Try to load saved progress first
        try {
          const savedProgress = await AsyncStorage.getItem(`onboarding_${currentOfferId}_progress`);
          if (savedProgress) {
            const progressData = JSON.parse(savedProgress);
            setFormData(progressData.formData);
            setCurrentStep(progressData.currentStep);
            console.log(`📱 [ONBOARDING] Resumed from step ${progressData.currentStep + 1}`);
            return;
          }
        } catch (error) {
          console.error('Failed to load saved progress:', error);
        }
        
        // Pre-fill customer data from offer params
        if (params?.customerName && params?.customerAddress) {
          const [firstName, ...lastNameParts] = params.customerName.split(' ');
          const lastName = lastNameParts.join(' ');
          
          const prefilledCustomer: Partial<Customer> = {
            firstName: firstName || '',
            lastName: lastName || '',
            address: params.customerAddress || '',
            // These fields will need to be filled by the tech
            email: '',
            phone: '',
            city: '',
            state: '',
            zipCode: '',
            notes: '',
          };
          
          setFormData(prev => ({
            ...prev,
            customer: prefilledCustomer,
            customerId: params.customerId,
          }));
          
          console.log(`📝 [ONBOARDING] Pre-filled customer data:`, prefilledCustomer);
        }
      }
    };
    
    initializeData();
  }, [route.params]);

  const steps = [
    { title: 'Customer Info', component: CustomerInfoStep, icon: 'person-outline' as const },
    { title: 'Water Chemistry', component: WaterChemistryStep, icon: 'flask-outline' as const },
    { title: 'Equipment', component: EquipmentStep, icon: 'construct-outline' as const },
    { title: 'Pool Details', component: PoolDetailsStep, icon: 'home-outline' as const },
    { title: 'Voice Note', component: VoiceNoteStep, icon: 'mic-outline' as const },
  ];

  const progress = (currentStep + 1) / steps.length;

  const handleBack = () => {
    if (currentStep === 0) {
      Alert.alert(
        'Exit Onboarding',
        'Are you sure you want to exit? Your progress will be saved as a draft.',
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
      scrollViewRef.current?.scrollTo({ x: (currentStep - 1) * SCREEN_WIDTH, animated: true });
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

  const handleSaveAndExit = async () => {
    if (offerId) {
      await saveProgress(formData, currentStep);
    }
    Alert.alert(
      'Progress Saved',
      'Your onboarding progress has been saved. You can continue later.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleNext = async (stepData: any) => {
    console.log(`🚀 [ONBOARDING] Step ${currentStep + 1} completed:`, steps[currentStep].title);
    console.log(`📝 [ONBOARDING] Step data received:`, stepData);
    
    // Haptic feedback not available on web
    
    // Update form data based on current step
    const updatedData = { ...formData };
    switch (currentStep) {
      case 0:
        updatedData.customer = stepData;
        console.log(`👤 [ONBOARDING] Customer data updated:`, stepData);
        break;
      case 1:
        updatedData.waterChemistry = stepData;
        console.log(`🧪 [ONBOARDING] Water chemistry data updated:`, stepData);
        break;
      case 2:
        updatedData.equipment = stepData;
        console.log(`⚙️ [ONBOARDING] Equipment data updated:`, stepData);
        break;
      case 3:
        updatedData.poolDetails = stepData;
        console.log(`🏊 [ONBOARDING] Pool details data updated:`, stepData);
        break;
      case 4:
        updatedData.voiceNoteUri = stepData.voiceNoteUri;
        console.log(`🎙️ [ONBOARDING] Voice note data updated:`, stepData);
        break;
    }
    
    setFormData(updatedData);
    console.log(`📊 [ONBOARDING] Complete form data:`, updatedData);

    // Auto-save progress after each step
    if (offerId) {
      await saveProgress(updatedData, currentStep === steps.length - 1 ? currentStep : currentStep + 1);
    }

    if (currentStep === steps.length - 1) {
      // Final step - submit the onboarding
      await submitOnboarding(updatedData);
    } else {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * SCREEN_WIDTH, animated: true });
    }
  };

  const submitOnboarding = async (data: Partial<OnboardingData>) => {
    try {
      // Add to sync queue for offline support
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

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={steps[currentStep].title}
        subtitle={`Step ${currentStep + 1} of ${steps.length}`}
        onBack={handleBack}
        rightButton={{
          title: 'Save & Exit',
          onPress: handleSaveAndExit,
        }}
      />
      
      {/* DEBUG PANEL - Temporary for testing */}
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>🛠️ Debug Panel (Testing)</Text>
        <View style={styles.debugButtons}>
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log(`⏭️ [DEBUG] Skipping step ${currentStep + 1}: ${steps[currentStep].title}`);
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
                scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * SCREEN_WIDTH, animated: true });
              }
            }}
          >
            <Text style={styles.debugButtonText}>Skip Step</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log(`📊 [DEBUG] Current form data:`, formData);
              Alert.alert('Debug Data', JSON.stringify(formData, null, 2));
            }}
          >
            <Text style={styles.debugButtonText}>Show Data</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <StepIndicator
        steps={steps.map(step => ({ title: step.title, icon: step.icon }))}
        currentStep={currentStep}
      />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <CurrentStepComponent
              data={formData}
              onNext={handleNext}
              onBack={handleBack}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  debugPanel: {
    backgroundColor: '#f0f0f0',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: theme.spacing.xs,
  },
  debugButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  debugButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: SCREEN_WIDTH,
  },
});