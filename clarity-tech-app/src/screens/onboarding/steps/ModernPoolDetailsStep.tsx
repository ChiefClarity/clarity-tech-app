import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModernInput } from '../../../components/ui/ModernInput';
import { GradientButton } from '../../../components/ui/GradientButton';
import { theme } from '../../../styles/theme';
import { PoolDetails } from '../../../types';
import { sanitizeNumber, sanitizeInput } from '../../../utils/sanitize';
import { FEATURES, AI_ENDPOINTS } from '../../../config/features';

const poolDetailsSchema = z.object({
  shape: z.preprocess(
    (val) => {
      console.log('🔍 [DEBUG] z.preprocess shape input:', val);
      const result = (!val || val === '') ? 'rectangle' : val;
      console.log('🔍 [DEBUG] z.preprocess shape output:', result);
      return result;
    },
    z.enum(['rectangle', 'oval', 'circle', 'kidney', 'freeform', 'other'] as const)
  ),
  length: z.number().min(1, 'Length is required'),
  width: z.number().min(1, 'Width is required'),
  shallowEndDepth: z.number().min(0.5, 'Shallow depth is required'),
  deepEndDepth: z.number().min(1, 'Deep depth is required'),
  avgDepth: z.number().optional(),
  surfaceArea: z.number().optional(),
  volume: z.number().optional(),
  type: z.enum(['inground', 'above_ground']).default('inground'),
  surfaceMaterial: z.enum(['plaster', 'pebble', 'tile', 'vinyl', 'fiberglass', 'other']).default('plaster'),
  surfaceCondition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  surfaceStains: z.boolean().default(false),
  features: z.array(z.string()).default([]),
  environment: z.object({
    nearbyTrees: z.boolean().default(false),
    treeType: z.string().optional(),
    deckMaterial: z.string().default('concrete'),
    fenceType: z.string().default('none'),
  }).default({
    nearbyTrees: false,
    deckMaterial: 'concrete',
    fenceType: 'none',
  }),
  // Environment factors (legacy fields for backward compatibility)
  sunExposure: z.enum(['full', 'partial', 'shade']).optional(),
  treeTypes: z.string().optional(),
  deckMaterial: z.string().optional(),
  notes: z.string().optional(),
});

type PoolDetailsFormData = z.infer<typeof poolDetailsSchema>;

interface ModernPoolDetailsStepProps {
  data: any;
  onNext: (data: PoolDetails) => void;
  onBack: () => void;
}

const POOL_SHAPES = [
  { value: 'rectangle', label: 'Rectangle', icon: 'square-outline' },
  { value: 'oval', label: 'Oval', icon: 'ellipse-outline' },
  { value: 'circle', label: 'Circle', icon: 'radio-button-off-outline' },
  { value: 'kidney', label: 'Kidney', icon: 'leaf-outline' },
  { value: 'freeform', label: 'Freeform', icon: 'brush-outline' },
  { value: 'other', label: 'Other', icon: 'help-outline' },
];

const SUN_EXPOSURE_OPTIONS = [
  { value: 'full', label: 'Full Sun', icon: 'sunny', description: '6+ hours direct sunlight' },
  { value: 'partial', label: 'Partial Sun', icon: 'partly-sunny', description: '3-6 hours direct sunlight' },
  { value: 'shade', label: 'Mostly Shade', icon: 'cloudy', description: 'Less than 3 hours direct sunlight' },
];

export const ModernPoolDetailsStep = React.forwardRef<
  { submitForm: () => void },
  ModernPoolDetailsStepProps
>(({ data, onNext, onBack }, ref) => {
  console.log('🔍 [DEBUG] ModernPoolDetailsStep mounted with data:', data);
  console.log('🔍 [DEBUG] Initial poolDetails shape:', data.poolDetails?.shape);
  
  const [selectedShape, setSelectedShape] = useState(data.poolDetails?.shape || 'rectangle');
  const [isAnalyzingSatellite, setIsAnalyzingSatellite] = useState(false);
  const [isAnalyzingEnvironment, setIsAnalyzingEnvironment] = useState(false);
  const [satelliteAnalyzed, setSatelliteAnalyzed] = useState(false);
  
  console.log('🔍 [DEBUG] Initial selectedShape state:', selectedShape);

  const defaultValues = data.poolDetails || {
    shape: 'rectangle',
    length: 0,
    width: 0,
    shallowEndDepth: 3,
    deepEndDepth: 8,
  };
  
  console.log('🔍 [DEBUG] useForm defaultValues:', defaultValues);
  console.log('🔍 [DEBUG] defaultValues.shape:', defaultValues.shape);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(poolDetailsSchema),
    defaultValues,
  });

  const watchedValues = watch();
  
  console.log('🔍 [DEBUG] Form initialized, current values:', getValues());
  console.log('🔍 [DEBUG] Current shape value from form:', getValues('shape'));

  // Ensure selectedShape state is synchronized with form value
  React.useEffect(() => {
    const formShape = getValues('shape');
    console.log('🔍 [DEBUG] useEffect sync - formShape:', formShape, 'selectedShape:', selectedShape);
    
    if (formShape && formShape !== selectedShape) {
      console.log('🔍 [DEBUG] Syncing selectedShape state with form value:', formShape);
      setSelectedShape(formShape);
    } else if (!formShape && selectedShape) {
      console.log('🔍 [DEBUG] Form shape is empty, setting form value to selectedShape:', selectedShape);
      setValue('shape', selectedShape);
    } else if (!formShape && !selectedShape) {
      console.log('🔍 [DEBUG] Both form and state shape are empty, setting both to rectangle');
      setValue('shape', 'rectangle');
      setSelectedShape('rectangle');
    }
  }, [getValues, selectedShape, setValue]);

  // TODO: Integrate Gemini Vision API for pool shape detection from satellite images
  const analyzeSatelliteImage = async (address: string) => {
    if (FEATURES.USE_REAL_AI) {
      try {
        const response = await fetch(AI_ENDPOINTS.ANALYZE_POOL_SATELLITE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
          timeout: FEATURES.AI_ANALYSIS_TIMEOUT,
        });
        return await response.json();
      } catch (error) {
        console.error('[API-INTEGRATION] Satellite analysis failed:', error);
        throw error;
      }
    }
    
    // Mock satellite analysis response
    return {
      shape: 'rectangle',
      length: 32,
      width: 16,
      surfaceArea: 512,
      confidence: 0.87,
      features: ['deck', 'pool', 'landscaping']
    };
  };

  // [API-INTEGRATION] Environment Analysis
  const analyzeEnvironment = async (photo: string) => {
    if (FEATURES.USE_REAL_AI) {
      try {
        const response = await fetch(AI_ENDPOINTS.ANALYZE_ENVIRONMENT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo }),
          timeout: FEATURES.AI_ANALYSIS_TIMEOUT,
        });
        return await response.json();
      } catch (error) {
        console.error('[API-INTEGRATION] Environment analysis failed:', error);
        throw error;
      }
    }
    
    // Mock environment analysis
    return {
      sunExposure: 'partial',
      treeTypes: 'Oak, Pine trees detected - moderate leaf drop expected',
      deckMaterial: 'Concrete with stamped pattern',
      confidence: 0.92
    };
  };

  const handleSatelliteAnalysis = async () => {
    const customerAddress = data.customer?.address;
    if (!customerAddress) {
      Alert.alert('Address Required', 'Customer address is needed for satellite analysis.');
      return;
    }

    setIsAnalyzingSatellite(true);
    try {
      const result = await analyzeSatelliteImage(customerAddress);
      
      // Auto-populate fields
      setSelectedShape(result.shape);
      setValue('shape', result.shape);
      setValue('length', result.length);
      setValue('width', result.width);
      setValue('surfaceArea', result.surfaceArea);
      
      // Calculate volume based on dimensions
      const avgDepth = (watchedValues.shallowEndDepth + watchedValues.deepEndDepth) / 2;
      const volume = result.surfaceArea * avgDepth * 7.48; // Convert to gallons
      setValue('volume', Math.round(volume));
      setValue('avgDepth', avgDepth);
      
      setSatelliteAnalyzed(true);
      console.log(`🛰️ [AI] Satellite analysis completed with ${Math.round(result.confidence * 100)}% confidence`);
    } catch (error) {
      Alert.alert('Analysis Failed', 'Unable to analyze satellite imagery. Please enter details manually.');
    } finally {
      setIsAnalyzingSatellite(false);
    }
  };

  const handleEnvironmentAnalysis = async () => {
    setIsAnalyzingEnvironment(true);
    try {
      // Simulate photo capture and analysis
      const result = await analyzeEnvironment('mock_photo_uri');
      
      setValue('sunExposure', result.sunExposure);
      setValue('treeTypes', result.treeTypes);
      setValue('deckMaterial', result.deckMaterial);
      
      console.log(`🌳 [AI] Environment analyzed with ${Math.round(result.confidence * 100)}% confidence`);
    } catch (error) {
      Alert.alert('Analysis Failed', 'Unable to analyze environment. Please enter details manually.');
    } finally {
      setIsAnalyzingEnvironment(false);
    }
  };

  // Auto-calculate volume when dimensions change
  React.useEffect(() => {
    const { length, width, shallowEndDepth, deepEndDepth } = watchedValues;
    if (length && width && shallowEndDepth && deepEndDepth) {
      const avgDepth = (shallowEndDepth + deepEndDepth) / 2;
      const surfaceArea = length * width;
      const volume = surfaceArea * avgDepth * 7.48; // Convert cubic feet to gallons
      
      setValue('surfaceArea', Math.round(surfaceArea));
      setValue('volume', Math.round(volume));
      setValue('avgDepth', avgDepth);
    }
  }, [watchedValues.length, watchedValues.width, watchedValues.shallowEndDepth, watchedValues.deepEndDepth, setValue]);

  const onSubmit = (formData: PoolDetailsFormData) => {
    console.log('Pool Profile onSubmit called with:', formData);
    
    // Transform form data to match PoolDetails interface
    const poolDetails: PoolDetails = {
      type: formData.type || 'inground',
      shape: formData.shape,
      length: formData.length,
      width: formData.width,
      avgDepth: formData.avgDepth || (formData.shallowEndDepth + formData.deepEndDepth) / 2,
      deepEndDepth: formData.deepEndDepth,
      shallowEndDepth: formData.shallowEndDepth,
      volume: formData.volume || 0,
      surfaceMaterial: formData.surfaceMaterial || 'plaster',
      surfaceCondition: formData.surfaceCondition || 'good',
      surfaceStains: formData.surfaceStains || false,
      features: formData.features || [],
      environment: formData.environment || {
        nearbyTrees: false,
        treeType: formData.treeTypes ? sanitizeInput(formData.treeTypes) : undefined,
        deckMaterial: formData.deckMaterial ? sanitizeInput(formData.deckMaterial) : 'concrete',
        fenceType: 'none',
      },
    };
    
    console.log('Pool Profile calling onNext with transformed data:', poolDetails);
    onNext(poolDetails);
  };

  const onError = (errors: any) => {
    console.error('Pool Profile form validation errors:', errors);
  };

  const parseNumber = (value: string) => {
    const sanitized = sanitizeNumber(value);
    return sanitized !== null ? sanitized : 0;
  };

  // Expose submitForm to parent via ref
  React.useImperativeHandle(ref, () => ({
    submitForm: () => {
      console.log('🔍 [DEBUG] Pool Details submitForm called via ref');
      console.log('🔍 [DEBUG] Current form values at submit:', getValues());
      console.log('🔍 [DEBUG] Current shape value at submit:', getValues('shape'));
      console.log('🔍 [DEBUG] Current selectedShape state at submit:', selectedShape);
      console.log('🔍 [DEBUG] Form errors:', errors);
      console.log('🔍 [DEBUG] About to call handleSubmit with onSubmit and onError');
      
      // Ensure shape has a value before validation
      const currentShape = getValues('shape');
      if (!currentShape) {
        console.log('🔍 [DEBUG] Shape is undefined/null, setting to rectangle');
        setValue('shape', 'rectangle');
      }
      
      return handleSubmit(onSubmit, onError)();
    },
    getCurrentData: () => watch(), // Returns current form values
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Pool Profile</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered pool analysis and measurements
        </Text>
      </LinearGradient>

      {/* AI Satellite Analysis */}
      <View style={styles.analysisCard}>
        <View style={styles.analysisHeader}>
          <Ionicons name="globe" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.analysisTitle}>AI Satellite Analysis</Text>
        </View>
        <Text style={styles.analysisDescription}>
          Automatically detect pool dimensions and shape from satellite imagery
        </Text>
        
        <TouchableOpacity
          style={[styles.analysisButton, satelliteAnalyzed && styles.analysisButtonCompleted]}
          onPress={handleSatelliteAnalysis}
          disabled={isAnalyzingSatellite}
        >
          <LinearGradient
            colors={satelliteAnalyzed ? ['#10B981', '#059669'] : ['#3B82F6', '#1D4ED8']}
            style={styles.analysisButtonGradient}
          >
            {isAnalyzingSatellite ? (
              <Ionicons name="sync" size={20} color="white" />
            ) : satelliteAnalyzed ? (
              <Ionicons name="checkmark-circle" size={20} color="white" />
            ) : (
              <Ionicons name="globe" size={20} color="white" />
            )}
            <Text style={styles.analysisButtonText}>
              {isAnalyzingSatellite ? 'Analyzing...' : satelliteAnalyzed ? 'Analysis Complete' : 'Analyze Pool'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Pool Shape Selection */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Pool Shape</Text>
        <View style={styles.shapeGrid}>
          {POOL_SHAPES.map((shape) => (
            <TouchableOpacity
              key={shape.value}
              style={[
                styles.shapeOption,
                selectedShape === shape.value && styles.shapeOptionSelected,
              ]}
              onPress={() => {
                setSelectedShape(shape.value);
                setValue('shape', shape.value);
              }}
            >
              <Ionicons
                name={shape.icon as any}
                size={24}
                color={selectedShape === shape.value ? theme.colors.blueGreen : theme.colors.gray}
              />
              <Text style={[
                styles.shapeLabel,
                selectedShape === shape.value && styles.shapeLabelSelected,
              ]}>
                {shape.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pool Dimensions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Pool Dimensions</Text>
        
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="length"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Length (ft)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseNumber(text))}
                  onBlur={onBlur}
                  error={errors.length?.message as string}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="width"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Width (ft)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseNumber(text))}
                  onBlur={onBlur}
                  error={errors.width?.message as string}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="shallowEndDepth"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Shallow End (ft)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseNumber(text))}
                  onBlur={onBlur}
                  error={errors.shallowEndDepth?.message as string}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="deepEndDepth"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Deep End (ft)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseNumber(text))}
                  onBlur={onBlur}
                  error={errors.deepEndDepth?.message as string}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
        </View>

        {/* Auto-calculated fields */}
        <View style={styles.calculatedSection}>
          <View style={styles.calculatedHeader}>
            <Ionicons name="calculator" size={16} color={theme.colors.blueGreen} />
            <Text style={styles.calculatedTitle}>Auto-Calculated</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="surfaceArea"
                render={({ field: { value } }) => (
                  <ModernInput
                    label="Surface Area (sq ft)"
                    value={value?.toString() || '0'}
                    editable={false}
                    style={styles.calculatedInput}
                  />
                )}
              />
            </View>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="volume"
                render={({ field: { value } }) => (
                  <ModernInput
                    label="Volume (gallons)"
                    value={value?.toString() || '0'}
                    editable={false}
                    style={styles.calculatedInput}
                  />
                )}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Environment Analysis */}
      <View style={styles.sectionCard}>
        <View style={styles.analysisHeader}>
          <Ionicons name="leaf" size={20} color={theme.colors.success} />
          <Text style={styles.sectionTitle}>Environment & Deck</Text>
        </View>
        
        <TouchableOpacity
          style={styles.analysisButton}
          onPress={handleEnvironmentAnalysis}
          disabled={isAnalyzingEnvironment}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.analysisButtonGradient}
          >
            {isAnalyzingEnvironment ? (
              <Ionicons name="sync" size={20} color="white" />
            ) : (
              <Ionicons name="camera" size={20} color="white" />
            )}
            <Text style={styles.analysisButtonText}>
              {isAnalyzingEnvironment ? 'Analyzing...' : 'Analyze Environment'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sun Exposure */}
        <Text style={styles.fieldLabel}>Sun Exposure</Text>
        <View style={styles.sunExposureGrid}>
          {SUN_EXPOSURE_OPTIONS.map((option) => (
            <Controller
              key={option.value}
              control={control}
              name="sunExposure"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={[
                    styles.sunOption,
                    value === option.value && styles.sunOptionSelected,
                  ]}
                  onPress={() => onChange(option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={value === option.value ? theme.colors.warning : theme.colors.gray}
                  />
                  <Text style={[
                    styles.sunLabel,
                    value === option.value && styles.sunLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.sunDescription}>{option.description}</Text>
                </TouchableOpacity>
              )}
            />
          ))}
        </View>

        {/* Tree Types */}
        <Controller
          control={control}
          name="treeTypes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Tree Types & Vegetation"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={2}
            />
          )}
        />

        {/* Deck Material */}
        <Controller
          control={control}
          name="deckMaterial"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Deck Material"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </View>

    </ScrollView>
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
  analysisCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  analysisTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.sm,
  },
  analysisDescription: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.lg,
    lineHeight: 18,
  },
  analysisButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  analysisButtonCompleted: {
    opacity: 0.8,
  },
  analysisButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  analysisButtonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.lg,
  },
  shapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  shapeOption: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shapeOptionSelected: {
    backgroundColor: 'rgba(46, 125, 139, 0.05)',
    borderColor: theme.colors.blueGreen,
  },
  shapeLabel: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '500',
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  shapeLabelSelected: {
    color: theme.colors.blueGreen,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.sm,
  },
  halfField: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  calculatedSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  calculatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  calculatedTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.blueGreen,
    marginLeft: theme.spacing.sm,
  },
  calculatedInput: {
    backgroundColor: '#F9FAFB',
    color: theme.colors.gray,
  },
  fieldLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
  },
  sunExposureGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  sunOption: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sunOptionSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: theme.colors.warning,
  },
  sunLabel: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '500',
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  sunLabelSelected: {
    color: theme.colors.warning,
    fontWeight: '600',
  },
  sunDescription: {
    fontSize: 10,
    color: theme.colors.gray,
    textAlign: 'center',
    marginTop: 2,
  },
});