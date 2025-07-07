import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';

// Component imports
import { SurfaceAnalysis } from './components/SurfaceAnalysis';
import { EnvironmentAnalysis } from './components/EnvironmentAnalysis';
import { aiAnalysisStorage } from '../../../../services/aiAnalysis/asyncStorage';

interface PoolDetailsStepProps {
  session?: any;
  onNext?: () => void;
}

export const PoolDetailsStep: React.FC<PoolDetailsStepProps> = ({ session, onNext }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      surfaceType: '',
      surfaceCondition: '',
      // Add other pool details fields as needed
    }
  });

  const onSubmit = async (data: any) => {
    // Process form data
    console.log('Pool details submitted:', data);
    
    // Proceed to next step
    onNext?.();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pool Details</Text>
        
        {/* Surface Analysis Section */}
        <SurfaceAnalysis
          control={control}
          errors={errors}
          session={session}
        />
        
        {/* Environment Analysis Section */}
        <EnvironmentAnalysis
          session={session}
          address={session?.customerInfo?.address}
        />
        
        {/* Add other pool detail sections here */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
});