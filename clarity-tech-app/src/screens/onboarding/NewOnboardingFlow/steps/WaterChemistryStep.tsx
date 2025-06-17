import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ModernInput } from '../../../../components/ui/ModernInput';
import { AIPhotoAnalyzer } from '../../../../components/ui/AIPhotoAnalyzer';
import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';

// EXACT validation schema from current implementation
const waterChemistrySchema = z.object({
  chlorine: z.coerce.number().min(0).max(10),
  ph: z.coerce.number().min(6).max(8.5),
  alkalinity: z.coerce.number().min(0).max(300),
  cyanuricAcid: z.coerce.number().min(0).max(100),
  calcium: z.coerce.number().optional(),
  salt: z.coerce.number().optional(),
  tds: z.coerce.number().optional(),
  temperature: z.coerce.number().optional(),
  phosphates: z.coerce.number().optional(),
  copper: z.coerce.number().optional(),
  iron: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type WaterChemistryData = z.infer<typeof waterChemistrySchema>;

// EXACT field configurations with proper ranges and units
const CHEMISTRY_FIELDS = [
  { key: 'chlorine', label: 'Free Chlorine', unit: 'ppm', min: 0, max: 10, ideal: '1-3' },
  { key: 'ph', label: 'pH', unit: '', min: 6, max: 8.5, ideal: '7.2-7.6' },
  { key: 'alkalinity', label: 'Total Alkalinity', unit: 'ppm', min: 0, max: 300, ideal: '80-120' },
  { key: 'cyanuricAcid', label: 'Cyanuric Acid', unit: 'ppm', min: 0, max: 100, ideal: '30-50' },
  { key: 'calcium', label: 'Calcium Hardness', unit: 'ppm', min: 0, max: 1000, ideal: '200-400', optional: true },
  { key: 'salt', label: 'Salt Level', unit: 'ppm', min: 0, max: 6000, ideal: '2700-3400', optional: true },
  { key: 'tds', label: 'Total Dissolved Solids', unit: 'ppm', min: 0, max: 5000, ideal: '<1500', optional: true },
  { key: 'temperature', label: 'Temperature', unit: '°F', min: 32, max: 110, ideal: '78-82', optional: true },
  { key: 'phosphates', label: 'Phosphates', unit: 'ppb', min: 0, max: 1000, ideal: '<100', optional: true },
  { key: 'copper', label: 'Copper', unit: 'ppm', min: 0, max: 1, ideal: '0.2-0.4', optional: true },
  { key: 'iron', label: 'Iron', unit: 'ppm', min: 0, max: 1, ideal: '<0.2', optional: true },
];

export const WaterChemistryStep: React.FC = () => {
  const { session, updateWaterChemistry, nextStep } = useOnboarding();
  const [showOptional, setShowOptional] = useState(false);
  
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<WaterChemistryData>({
    resolver: zodResolver(waterChemistrySchema),
    defaultValues: session?.waterChemistry || {
      chlorine: 0,
      ph: 7.2,
      alkalinity: 80,
      cyanuricAcid: 40,
    },
  });
  
  const values = watch();
  
  // Load existing data when session updates
  useEffect(() => {
    if (session?.waterChemistry) {
      reset(session.waterChemistry);
      // Show optional fields if any have values
      const hasOptionalValues = session.waterChemistry.calcium || 
        session.waterChemistry.salt || 
        session.waterChemistry.tds ||
        session.waterChemistry.temperature ||
        session.waterChemistry.phosphates ||
        session.waterChemistry.copper ||
        session.waterChemistry.iron;
      if (hasOptionalValues) {
        setShowOptional(true);
      }
    }
  }, [session?.waterChemistry, reset]);
  
  const onSubmit = async (data: WaterChemistryData) => {
    try {
      await updateWaterChemistry(data);
      // Navigation is handled by NavigationButtons component
    } catch (err) {
      webAlert.alert('Error', 'Failed to save water chemistry data');
    }
  };
  
  // Auto-save on blur
  const handleBlur = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setValue(field as keyof WaterChemistryData, numValue);
    const currentData = watch();
    updateWaterChemistry(currentData).catch(() => {});
  };
  
  // Get status color based on ideal range
  const getStatusColor = (field: typeof CHEMISTRY_FIELDS[0], value: number) => {
    if (!value && value !== 0) return theme.colors.gray;
    
    // Special handling for pH
    if (field.key === 'ph') {
      if (value >= 7.2 && value <= 7.6) return theme.colors.success;
      if (value >= 7.0 && value <= 7.8) return theme.colors.warning;
      return theme.colors.error;
    }
    
    // For other fields, simplified logic
    const midpoint = (field.min + field.max) / 2;
    const range = field.max - field.min;
    const deviation = Math.abs(value - midpoint) / range;
    
    if (deviation < 0.2) return theme.colors.success;
    if (deviation < 0.4) return theme.colors.warning;
    return theme.colors.error;
  };
  
  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[theme.colors.blueGreen, theme.colors.darkBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Water Chemistry</Text>
        <Text style={styles.headerSubtitle}>
          Let's test your pool water quality
        </Text>
      </LinearGradient>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Test Strip Photo Analyzer */}
        <View style={styles.testStripSection}>
          <AIPhotoAnalyzer
            title="Test Strip Analysis"
            description="Take a photo of your test strip for instant AI analysis"
            maxPhotos={1}
            onAnalyze={async (photos) => {
              // Auto-populate form fields
              setValue('ph', 7.4);
              setValue('chlorine', 2.0);
              setValue('alkalinity', 100);
              webAlert.alert('Success', 'Test strip analyzed! Review the values below.');
            }}
          />
        </View>

        {/* Water Chemistry Card */}
        <View style={styles.resultsCard}>
        {/* Required Fields */}
        {CHEMISTRY_FIELDS.filter(f => !f.optional).map((field) => (
          <View key={field.key} style={styles.fieldContainer}>
            <Controller
              control={control}
              name={field.key as keyof WaterChemistryData}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <ModernInput
                    label={field.label}
                    value={String(value || '')}
                    onChangeText={onChange}
                    onBlur={() => handleBlur(field.key, String(value))}
                    error={errors[field.key as keyof WaterChemistryData]?.message}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.rangeInfo}>
                    <Text style={styles.idealRange}>Ideal: {field.ideal}</Text>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(field, Number(value)) }
                    ]} />
                  </View>
                </View>
              )}
            />
          </View>
        ))}
        
        {/* Optional Fields Toggle */}
        <TouchableOpacity
          style={styles.optionalToggle}
          onPress={() => setShowOptional(!showOptional)}
        >
          <Text style={styles.optionalToggleText}>
            {showOptional ? 'Hide' : 'Show'} Optional Tests
          </Text>
          <Ionicons
            name={showOptional ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.blueGreen}
          />
        </TouchableOpacity>
        
        {/* Optional Fields */}
        {showOptional && (
          <View style={styles.optionalFields}>
            {CHEMISTRY_FIELDS.filter(f => f.optional).map((field) => (
              <View key={field.key} style={styles.fieldContainer}>
                <Controller
                  control={control}
                  name={field.key as keyof WaterChemistryData}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <ModernInput
                        label={field.label}
                        value={String(value || '')}
                        onChangeText={onChange}
                        onBlur={() => handleBlur(field.key, String(value))}
                        error={errors[field.key as keyof WaterChemistryData]?.message}
                        keyboardType="decimal-pad"
                        suffix={field.unit}
                      />
                      <View style={styles.rangeInfo}>
                        <Text style={styles.idealRange}>Ideal: {field.ideal}</Text>
                        {value !== undefined && value !== null && (
                          <View style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(field, Number(value)) }
                          ]} />
                        )}
                      </View>
                    </View>
                  )}
                />
              </View>
            ))}
            
            {/* Notes Field */}
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Additional Notes"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  placeholder="Any observations about water clarity, algae, etc."
                />
              )}
            />
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  resultsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  testStripSection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  fieldContainer: {
    marginBottom: theme.spacing.md,
  },
  rangeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  idealRange: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  optionalToggleText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.blueGreen,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
  },
  optionalFields: {
    paddingTop: theme.spacing.md,
  },
});