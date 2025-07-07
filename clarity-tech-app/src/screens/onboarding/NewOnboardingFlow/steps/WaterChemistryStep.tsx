import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { debounce } from 'lodash';

import { EnhancedFloatingInput } from '../../../../components/ui/EnhancedFloatingInput';
import { AIPhotoAnalyzer } from '../../../../components/ui/AIPhotoAnalyzer';
import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';
import { aiService } from '../../../../services/api/ai';
import { FEATURES } from '../../../../config/features';
import { Alert } from 'react-native';

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
  orp: z.coerce.number().optional(),
  hasSaltCell: z.boolean().optional(),
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
  { key: 'orp', label: 'ORP', unit: 'mV', min: 650, max: 750, ideal: '700-720', optional: true },
];

export const WaterChemistryStep: React.FC = () => {
  const { session, updateWaterChemistry, nextStep } = useOnboarding();
  // All fields are always visible now
  const [analysisResult, setAnalysisResult] = useState<{
    success: boolean;
    confidence?: number;
    message?: string;
  } | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string | null>(null);
  const [measuredFields, setMeasuredFields] = useState<string[]>([]);
  
  const { control, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm<WaterChemistryData>({
    resolver: zodResolver(waterChemistrySchema),
    defaultValues: {
      chlorine: session?.waterChemistry?.chlorine ?? 0,
      ph: session?.waterChemistry?.ph ?? 0,
      alkalinity: session?.waterChemistry?.alkalinity ?? 0,
      cyanuricAcid: session?.waterChemistry?.cyanuricAcid ?? 0,
      calcium: session?.waterChemistry?.calcium,
      salt: session?.waterChemistry?.salt,
      tds: session?.waterChemistry?.tds,
      temperature: session?.waterChemistry?.temperature,
      phosphates: session?.waterChemistry?.phosphates,
      copper: session?.waterChemistry?.copper,
      iron: session?.waterChemistry?.iron,
      orp: session?.waterChemistry?.orp ?? 0,
      hasSaltCell: session?.waterChemistry?.hasSaltCell ?? false,
      notes: session?.waterChemistry?.notes || '',
    },
  });
  
  const values = watch(['notes', 'hasSaltCell']); // Add explicit watch for notes
  
  // Load existing data when session updates
  useEffect(() => {
    if (session?.waterChemistry) {
      reset(session.waterChemistry);
      // All fields are always visible now
    }
  }, [session?.waterChemistry, reset]);
  
  const onSubmit = async (data: WaterChemistryData) => {
    try {
      // Ensure notes are included in the data
      const submissionData = {
        ...data,
        notes: data.notes || '', // Ensure it's never undefined
      };
      await updateWaterChemistry(submissionData);
      // Navigation is handled by NavigationButtons component
    } catch (err) {
      webAlert.alert('Error', 'Failed to save water chemistry data');
    }
  };
  
  // Auto-save on blur
  const handleBlur = async (field: string, value: string | boolean) => {
    let finalValue: any = value;
    
    // Handle numeric values
    if (typeof value === 'string' && field !== 'notes') {
      finalValue = parseFloat(value) || 0;
      setValue(field as keyof WaterChemistryData, finalValue);
    } else {
      setValue(field as keyof WaterChemistryData, value as any);
    }
    
    // Get ALL current form values
    const allValues = getValues();
    
    // Save to context with all values
    try {
      await updateWaterChemistry({
        ...allValues,
        [field]: finalValue,
      });
      
    } catch (error) {
      console.error('Failed to save water chemistry:', error);
    }
  };
  
  // Handle notes change with debounce for auto-save
  const handleNotesChange = useCallback(
    debounce(async (value: string) => {
      const allValues = getValues();
      try {
        await updateWaterChemistry({
          ...allValues,
          notes: value || '',
        });
      } catch (error) {
        console.error('Failed to save notes:', error);
      }
    }, 500),
    [getValues, updateWaterChemistry]
  );
  
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
              if (photos.length === 0) return;
              
              try {
                setAnalyzingImage(true);
                setCompressionProgress('Processing image...');
                console.log('📸 Starting AI analysis of test strip...');
                
                // Get session ID from onboarding context
                const sessionId = session?.id || `session-${Date.now()}`;
                
                // Convert to base64 if needed
                let imageData = photos[0];
                if (!imageData.startsWith('data:')) {
                  // If it's a blob URL, fetch and convert
                  const response = await fetch(imageData);
                  const blob = await response.blob();
                  const reader = new FileReader();
                  imageData = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                }
                
                setCompressionProgress('Compressing image for optimal AI analysis...');
                
                // Call AI service with sessionId (compression happens inside the service)
                const result = await aiService.analyzeTestStrip(imageData, sessionId);
                
                if (result.success && result.data) {
                  console.log('✅ AI Analysis successful:', result.data);
                  
                  const { readings } = result.data;
                  
                  // Map API field names to form field names and display labels
                  const fieldMappings: { [key: string]: { apiField: keyof typeof readings, label: string } } = {
                    chlorine: { apiField: 'freeChlorine', label: 'Free Chlorine' },
                    ph: { apiField: 'ph', label: 'pH' },
                    alkalinity: { apiField: 'alkalinity', label: 'Total Alkalinity' },
                    cyanuricAcid: { apiField: 'cyanuricAcid', label: 'Cyanuric Acid' },
                    calcium: { apiField: 'calcium', label: 'Calcium Hardness' },
                    salt: { apiField: 'salt', label: 'Salt Level' },
                    copper: { apiField: 'copper', label: 'Copper' },
                    iron: { apiField: 'iron', label: 'Iron' },
                    phosphates: { apiField: 'phosphates', label: 'Phosphates' },
                  };
                  
                  // Clear measured fields and determine which chemicals were detected
                  setMeasuredFields([]);
                  const detectedChemicals: string[] = [];
                  
                  // Update form - only non-null values
                  Object.entries(fieldMappings).forEach(([formField, { apiField, label }]) => {
                    const value = readings[apiField];
                    if (value !== null && value !== undefined) {
                      setValue(formField as keyof WaterChemistryData, value);
                      // Mark this field as measured
                      setMeasuredFields(prev => [...prev, formField]);
                      detectedChemicals.push(label);
                    }
                  });
                  
                  // Show what was detected
                  if (detectedChemicals.length > 0) {
                    Alert.alert(
                      'Test Strip Analyzed',
                      `Detected chemicals on your test strip:\n${detectedChemicals.map(c => `• ${c}`).join('\n')}`,
                      [{ text: 'OK' }]
                    );
                  }
                  
                  // Save the image URL if provided
                  if (result.data.imageUrl) {
                    setValue('testStripImageUrl' as any, result.data.imageUrl);
                  }
                  
                  // Visual indicator for which fields were measured
                  setAnalysisResult({
                    success: true,
                    confidence: result.data.analysis?.confidence,
                    message: `Successfully analyzed ${detectedChemicals.length} parameters`
                  });
                } else {
                  const errorMsg = result.error || 'Unable to analyze test strip';
                  console.error('❌ AI Analysis failed:', errorMsg);
                  Alert.alert('Analysis Failed', errorMsg);
                }
              } catch (error) {
                console.error('❌ AI Analysis error:', error);
                Alert.alert('Error', 'Failed to analyze image. Please check your connection.');
              } finally {
                setAnalyzingImage(false);
                setCompressionProgress(null);
              }
            }}
          />
        </View>

        {compressionProgress && (
          <View style={styles.compressionProgress}>
            <Text style={styles.compressionProgressText}>{compressionProgress}</Text>
          </View>
        )}

        {analysisResult && (
          <View style={[
            styles.analysisResultBanner,
            analysisResult.success ? styles.successBanner : styles.errorBanner
          ]}>
            <Ionicons 
              name={analysisResult.success ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={analysisResult.success ? theme.colors.success : theme.colors.error} 
            />
            <Text style={styles.analysisResultText}>
              {analysisResult.message}
              {analysisResult.confidence && ` - ${analysisResult.confidence}% confidence`}
            </Text>
          </View>
        )}

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
                  <EnhancedFloatingInput
                    label={`${field.label}${measuredFields.includes(field.key) ? ' ✓' : ''}`}
                    value={String(value || '')}
                    onChangeText={onChange}
                    onBlur={() => handleBlur(field.key, String(value))}
                    error={errors[field.key as keyof WaterChemistryData]?.message}
                    keyboardType="decimal-pad"
                    style={[
                      measuredFields.includes(field.key) && styles.measuredField
                    ]}
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
        
        {/* Additional Fields */}
        <View style={styles.optionalFields}>
            {CHEMISTRY_FIELDS.filter(f => f.optional).map((field) => {
              // Special handling for salt field - render with checkbox
              if (field.key === 'salt') {
                return (
                  <View key={field.key} style={styles.row}>
                    <View style={styles.halfField}>
                      <Controller
                        control={control}
                        name={field.key as keyof WaterChemistryData}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <View>
                            <EnhancedFloatingInput
                              label={`${field.label}${measuredFields.includes(field.key) ? ' ✓' : ''}`}
                              value={String(value || '')}
                              onChangeText={onChange}
                              onBlur={() => handleBlur(field.key, String(value))}
                              error={errors[field.key as keyof WaterChemistryData]?.message}
                              keyboardType="decimal-pad"
                              style={[
                                measuredFields.includes(field.key) && styles.measuredField
                              ]}
                            />
                            <View style={styles.rangeInfo}>
                              <Text style={styles.idealRange}>Ideal: {field.ideal}</Text>
                              {value !== undefined && value !== null && value !== 0 && (
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
                    <View style={styles.halfField}>
                      {/* Salt Cell Checkbox */}
                      <View style={styles.saltCellCheckbox}>
                        <Controller
                          control={control}
                          name="hasSaltCell"
                          render={({ field: { onChange, value } }) => (
                            <TouchableOpacity
                              style={styles.checkboxRow}
                              onPress={() => {
                                onChange(!value);
                                handleBlur('hasSaltCell', !value);
                              }}
                            >
                              <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                                {value && <Ionicons name="checkmark" size={16} color="white" />}
                              </View>
                              <Text style={styles.checkboxLabel}>Has Salt Cell</Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </View>
                  </View>
                );
              }
              
              // Regular rendering for other fields
              return (
                <View key={field.key} style={styles.fieldContainer}>
                  <Controller
                    control={control}
                    name={field.key as keyof WaterChemistryData}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View>
                        <EnhancedFloatingInput
                          label={`${field.label}${measuredFields.includes(field.key) ? ' ✓' : ''}`}
                          value={String(value || '')}
                          onChangeText={onChange}
                          onBlur={() => handleBlur(field.key, String(value))}
                          error={errors[field.key as keyof WaterChemistryData]?.message}
                          keyboardType="decimal-pad"
                          style={[
                            measuredFields.includes(field.key) && styles.measuredField
                          ]}
                        />
                        <View style={styles.rangeInfo}>
                          <Text style={styles.idealRange}>Ideal: {field.ideal}</Text>
                          {value !== undefined && value !== null && (field.key !== 'orp' || (field.key === 'orp' && value !== 0)) && (
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
              );
            })}
            
            {/* Notes Field */}
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <EnhancedFloatingInput
                  label="Additional Notes"
                  value={value || ''}
                  onChangeText={(text) => {
                    onChange(text);
                    handleNotesChange(text);
                  }}
                  multiline
                  numberOfLines={3}
                />
              )}
            />
          </View>
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
    marginBottom: theme.spacing.md,  // Keep this as it was (16px)
  },
  rangeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -20,       // Keep this the same
    marginBottom: 18,     // Reduced from 24px to 18px
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
  analysisResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
  },
  successBanner: {
    backgroundColor: theme.colors.success + '20',
  },
  errorBanner: {
    backgroundColor: theme.colors.error + '20',
  },
  analysisResultText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.darkBlue,
    flex: 1,
  },
  checkboxContainer: {
    paddingHorizontal: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.gray,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  checkboxLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  halfField: {
    flex: 1,
  },
  saltCellCheckbox: {
    paddingTop: 28, // Align with input field
    paddingHorizontal: theme.spacing.xs,
  },
  compressionProgress: {
    backgroundColor: theme.colors.blueGreen + '20',
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.blueGreen,
  },
  compressionProgressText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.darkBlue,
    textAlign: 'center',
  },
  measuredField: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
});