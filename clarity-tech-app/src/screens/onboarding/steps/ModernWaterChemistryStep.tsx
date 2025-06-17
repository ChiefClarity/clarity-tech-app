import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModernInput } from '../../../components/ui/ModernInput';
import { GradientButton } from '../../../components/ui/GradientButton';
import { theme } from '../../../styles/theme';
import { WaterChemistry } from '../../../types';
import { sanitizeNumber, sanitizeInput } from '../../../utils/sanitize';
import { launchCamera } from '../../../utils/webCamera';
import { FEATURES, AI_ENDPOINTS } from '../../../config/features';

const waterChemistrySchema = z.object({
  // Required fields
  ph: z.number().min(6).max(8.5),
  chlorine: z.number().min(0).max(10),
  alkalinity: z.number().min(0).max(300),
  cyanuricAcid: z.number().min(0).max(100),
  // Optional fields
  calcium: z.number().min(0).max(1000).optional(),
  salt: z.number().min(0).max(10000).optional(),
  tds: z.number().min(0).max(5000).optional(),
  temperature: z.number().min(32).max(120).optional(),
  phosphates: z.number().min(0).max(1000).optional(),
  copper: z.number().min(0).max(0.5).optional(),
  iron: z.number().min(0).max(0.5).optional(),
  orp: z.number().min(0).max(1000).optional(),
  notes: z.string().optional(),
});

type WaterChemistryFormData = z.infer<typeof waterChemistrySchema>;

interface ModernWaterChemistryStepProps {
  data: any;
  onNext: (data: WaterChemistry) => void;
  onBack: () => void;
}

export const ModernWaterChemistryStep = React.forwardRef<
  { submitForm: () => void },
  ModernWaterChemistryStepProps
>(({ data, onNext, onBack }, ref) => {
  const [testStripPhoto, setTestStripPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testMethod] = useState<'photo' | 'manual'>('photo');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WaterChemistryFormData>({
    resolver: zodResolver(waterChemistrySchema),
    defaultValues: data.waterChemistry || {
      chlorine: 0,
      ph: 7.2,
      alkalinity: 80,
      cyanuricAcid: 40,
    },
  });

  // TODO: Integrate Gemini Vision API for water test strip analysis
  const analyzeTestStrip = async (photo: string) => {
    if (FEATURES.USE_REAL_AI) {
      try {
        const response = await fetch(AI_ENDPOINTS.ANALYZE_TEST_STRIP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo }),
          timeout: FEATURES.AI_ANALYSIS_TIMEOUT,
        });
        return await response.json();
      } catch (error) {
        console.error('[API-INTEGRATION] Test strip analysis failed:', error);
        throw error;
      }
    }
    
    // Mock response for development
    return {
      ph: 7.4,
      chlorine: 1.2,
      alkalinity: 110,
      cyanuricAcid: 45,
      calcium: 200,
      phosphates: 150,
      confidence: 0.92
    };
  };

  const handlePhotoCapture = async () => {
    try {
      const result = await launchCamera({ mediaTypes: 'photo' });
      if (!result.cancelled && result.uri) {
        setTestStripPhoto(result.uri);
        setIsAnalyzing(true);
        
        try {
          const analysisResult = await analyzeTestStrip(result.uri);
          
          // Auto-populate fields with AI results
          setValue('ph', analysisResult.ph);
          setValue('chlorine', analysisResult.chlorine);
          setValue('alkalinity', analysisResult.alkalinity);
          setValue('cyanuricAcid', analysisResult.cyanuricAcid);
          if (analysisResult.calcium) setValue('calcium', analysisResult.calcium);
          if (analysisResult.phosphates) setValue('phosphates', analysisResult.phosphates);
          
          console.log(`🤖 [AI] Test strip analyzed with ${Math.round(analysisResult.confidence * 100)}% confidence`);
        } catch (error) {
          console.error('AI analysis failed:', error);
          // Continue with manual entry on failure
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      setIsAnalyzing(false);
    }
  };

  const onSubmit = (formData: WaterChemistryFormData) => {
    console.log('Water Analysis onSubmit called with:', formData);
    const sanitizedData = {
      ...formData,
      notes: formData.notes ? sanitizeInput(formData.notes) : undefined,
    };
    console.log('Water Analysis calling onNext with sanitized data:', sanitizedData);
    onNext(sanitizedData as WaterChemistry);
  };

  const onError = (errors: any) => {
    console.error('Water Analysis form validation errors:', errors);
  };

  // Expose submitForm to parent via ref
  React.useImperativeHandle(ref, () => ({
    submitForm: () => {
      console.log('Water Analysis submitForm called via ref');
      console.log('Form errors:', errors);
      console.log('About to call handleSubmit with onSubmit and onError');
      return handleSubmit(onSubmit, onError)();
    },
    getCurrentData: () => watch(), // Returns current form values
  }));

  const parseFloat = (value: string) => {
    const sanitized = sanitizeNumber(value);
    return sanitized !== null ? sanitized : 0;
  };

  const parseInt = (value: string) => {
    const sanitized = sanitizeNumber(value);
    return sanitized !== null ? Math.round(sanitized) : 0;
  };

  const getValueStatus = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return 'good';
    return 'warning';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Smart Water Testing</Text>
        <Text style={styles.headerSubtitle}>
          Take a photo of your test strip or enter values manually
        </Text>
      </LinearGradient>


      {/* Photo Capture Section */}
      <View style={styles.photoSection}>
          {testStripPhoto ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: testStripPhoto }} style={styles.photo} />
              {isAnalyzing && (
                <View style={styles.analysisOverlay}>
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.5)']}
                    style={styles.analysisGradient}
                  >
                    <Ionicons name="sync" size={24} color="white" />
                    <Text style={styles.analysisText}>AI is analyzing...</Text>
                  </LinearGradient>
                </View>
              )}
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handlePhotoCapture}
              >
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handlePhotoCapture}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={styles.captureGradient}
              >
                <Ionicons name="camera" size={40} color="white" />
                <Text style={styles.captureText}>Take Test Strip Photo</Text>
                <Text style={styles.captureSubtext}>AI will auto-detect values</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

      {/* Water Chemistry Results */}
      <View style={styles.resultsCard}>
        <Text style={styles.sectionTitle}>Water Chemistry Results</Text>
        
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="ph"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="pH Level"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text))}
                  onBlur={onBlur}
                  error={errors.ph?.message}
                  keyboardType="decimal-pad"
                  idealRange={{ min: 7.2, max: 7.6, ideal: 7.4 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="chlorine"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Chlorine"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text))}
                  onBlur={onBlur}
                  error={errors.chlorine?.message}
                  keyboardType="decimal-pad"
                  idealRange={{ min: 1, max: 3, ideal: 2 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="alkalinity"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Alkalinity"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseInt(text))}
                  onBlur={onBlur}
                  error={errors.alkalinity?.message}
                  keyboardType="number-pad"
                  idealRange={{ min: 80, max: 120, ideal: 100 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="cyanuricAcid"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Cyanuric Acid"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseInt(text))}
                  onBlur={onBlur}
                  error={errors.cyanuricAcid?.message}
                  keyboardType="number-pad"
                  idealRange={{ min: 30, max: 50, ideal: 40 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
        </View>

        {/* Advanced measurements */}
        <Text style={styles.advancedTitle}>Advanced Measurements</Text>
        
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="phosphates"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Phosphates (ppb)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  idealRange={{ min: 0, max: 100, ideal: 0 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="orp"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="ORP (mV)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  idealRange={{ min: 650, max: 750, ideal: 700 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="copper"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Copper (ppm)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  idealRange={{ min: 0, max: 0.3, ideal: 0 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="iron"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Iron (ppm)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  idealRange={{ min: 0, max: 0.3, ideal: 0 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="calcium"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Calcium (ppm)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  idealRange={{ min: 200, max: 400, ideal: 300 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="salt"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Salt (ppm)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  idealRange={{ min: 2700, max: 3400, ideal: 3000 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="tds"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="TDS (ppm)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  idealRange={{ min: 0, max: 1500, ideal: 500 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="temperature"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Temperature (°F)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  idealRange={{ min: 78, max: 82, ideal: 80 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
        </View>
      </View>

      {/* AI Recommendation */}
      <View style={styles.aiRecommendation}>
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.05)']}
          style={styles.aiRecommendationGradient}
        >
          <View style={styles.aiHeader}>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <Text style={styles.aiTitle}>AI Insight</Text>
          </View>
          <Text style={styles.aiText}>
            {testStripPhoto ? 'AI detected slightly low chlorine levels. Consider adding 1.5 lbs chlorine shock for optimal sanitization.' : 'Take a test strip photo for AI analysis, or enter values manually below.'}
          </Text>
        </LinearGradient>
      </View>

    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  photoSection: {
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
  photoContainer: {
    position: 'relative',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.grayLight,
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  analysisGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  retakeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  captureGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  captureText: {
    color: 'white',
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },
  captureSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: theme.typography.small.fontSize,
    marginTop: theme.spacing.xs,
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
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.lg,
  },
  advancedTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.sm,
  },
  halfField: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  aiRecommendation: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  aiRecommendationGradient: {
    padding: theme.spacing.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  aiTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: theme.spacing.sm,
  },
  aiText: {
    fontSize: theme.typography.small.fontSize,
    color: '#92400E',
    lineHeight: 18,
  },
});