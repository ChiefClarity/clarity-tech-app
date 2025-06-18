import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useForm, Controller, useFormContext, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ModernInput } from '../../../../components/ui/ModernInput';
import { ModernSelect } from '../../../../components/ui/ModernSelect';
import { AIPhotoAnalyzer } from '../../../../components/ui/AIPhotoAnalyzer';
import { AIInsightsBox } from '../../../../components/common/AIInsightsBox';
import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';
import { FEATURES, AI_ENDPOINTS } from '../../../../config/features';

// Define sections
const POOL_SECTIONS = [
  { id: 'size-shape', title: 'Pool Size/Shape/Type', icon: 'water-outline' },
  { id: 'surface', title: 'Pool Surface', icon: 'brush-outline' },
  { id: 'environment', title: 'Pool Environment', icon: 'leaf-outline' },
  { id: 'skimmers', title: 'Skimmers/Drains', icon: 'filter-outline' },
  { id: 'deck', title: 'Pool Deck', icon: 'square-outline' },
];

// Pool shape options with volume calculation support
const POOL_SHAPES = [
  { value: 'rectangle', label: 'Rectangle', icon: 'square-outline' },
  { value: 'oval', label: 'Oval', icon: 'ellipse-outline' },
  { value: 'kidney', label: 'Kidney', icon: 'water-outline' },
  { value: 'freeform', label: 'Freeform', icon: 'shapes-outline' },
  { value: 'other', label: 'Other', icon: 'help-circle-outline' },
];

const SURFACE_MATERIALS = [
  { value: 'plaster', label: 'Plaster' },
  { value: 'pebble', label: 'Pebble' },
  { value: 'tile', label: 'Tile' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'fiberglass', label: 'Fiberglass' },
  { value: 'other', label: 'Other' },
];

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: theme.colors.success },
  { value: 'good', label: 'Good', color: theme.colors.blueGreen },
  { value: 'fair', label: 'Fair', color: theme.colors.warning },
  { value: 'poor', label: 'Poor', color: theme.colors.error },
];

const POOL_FEATURES = [
  { id: 'waterfall', label: 'Waterfall', icon: 'water' },
  { id: 'spa', label: 'Spa/Hot Tub', icon: 'flame' },
  { id: 'lights', label: 'Lights', icon: 'bulb' },
  { id: 'heater', label: 'Heater', icon: 'thermometer' },
  { id: 'autoCover', label: 'Auto Cover', icon: 'shield' },
  { id: 'slide', label: 'Slide', icon: 'trending-down' },
  { id: 'divingBoard', label: 'Diving Board', icon: 'arrow-down' },
];

const poolDetailsSchema = z.object({
  poolType: z.enum(['inground', 'aboveGround']),
  shape: z.enum(['rectangle', 'oval', 'kidney', 'freeform', 'other']),
  length: z.coerce.number().min(1).max(100),
  width: z.coerce.number().min(1).max(100),
  avgDepth: z.coerce.number().min(1).max(20),
  deepEndDepth: z.coerce.number().optional(),
  shallowEndDepth: z.coerce.number().optional(),
  volume: z.coerce.number().min(1),
  surfaceArea: z.coerce.number().optional(),
  surfaceMaterial: z.enum(['plaster', 'pebble', 'tile', 'vinyl', 'fiberglass', 'other']),
  surfaceCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  features: z.array(z.string()),
  nearbyTrees: z.boolean(),
  treeTypes: z.string().optional(),
  grassOrDirt: z.enum(['grass', 'dirt', 'both']).optional(),
  sprinklerSystem: z.boolean(),
  surfaceStains: z.boolean().optional(),
  stainTypes: z.string().optional(),
  deckCleanliness: z.string().optional(),
  deckMaterial: z.string().optional(),
  skimmerCount: z.number().optional(),
}).passthrough(); // Allow dynamic fields

type PoolDetailsData = z.infer<typeof poolDetailsSchema>;

// Uncontrolled input wrapper to prevent re-renders
const UncontrolledInput = ({ 
  label, 
  initialValue, 
  onBlurValue,
  ...props 
}: any) => {
  const [localValue, setLocalValue] = useState(initialValue || '');
  
  return (
    <ModernInput
      label={label}
      value={localValue}
      onChangeText={setLocalValue}
      onBlur={() => onBlurValue(localValue)}
      {...props}
    />
  );
};

// Memoized skimmer mini-section component
const SkimmerMiniSection = memo(({ index, handleFieldBlur }: { index: number; handleFieldBlur: (field: string, value: any) => void }) => {
  const { control, setValue, getValues } = useFormContext<PoolDetailsData>();
  const values = getValues();
  const basketCondition = values[`skimmer${index + 1}BasketCondition` as keyof typeof values];
  const lidCondition = values[`skimmer${index + 1}LidCondition` as keyof typeof values];
  
  return (
    <View style={styles.skimmerMiniSection}>
      <Text style={styles.miniSectionTitle}>Skimmer #{index + 1}</Text>
      
      <Controller
        control={control}
        name={`skimmer${index + 1}Functioning` as any}
        render={({ field: { onChange, value } }) => (
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => onChange(!value)}
          >
            <View style={[styles.checkbox, value && styles.checkboxChecked]}>
              {value && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>Functioning properly</Text>
          </TouchableOpacity>
        )}
      />
      
      <Text style={styles.fieldLabel}>Basket Condition</Text>
      <View style={styles.conditionGrid}>
        {CONDITION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.conditionOption,
              basketCondition === option.value && { 
                backgroundColor: option.color + '20',
                borderColor: option.color 
              },
            ]}
            onPress={() => setValue(`skimmer${index + 1}BasketCondition` as any, option.value)}
          >
            <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
            <Text style={[
              styles.conditionLabel,
              basketCondition === option.value && { 
                color: option.color, 
                fontWeight: '600' 
              }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.fieldLabel}>Lid Condition</Text>
      <View style={styles.conditionGrid}>
        {CONDITION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.conditionOption,
              lidCondition === option.value && { 
                backgroundColor: option.color + '20',
                borderColor: option.color 
              },
            ]}
            onPress={() => setValue(`skimmer${index + 1}LidCondition` as any, option.value)}
          >
            <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
            <Text style={[
              styles.conditionLabel,
              lidCondition === option.value && { 
                color: option.color, 
                fontWeight: '600' 
              }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Controller
        control={control}
        name={`skimmer${index + 1}LidModel` as any}
        render={({ field: { onChange, value } }) => (
          <UncontrolledInput
            label="Lid Model #"
            initialValue={value || ''}
            onBlurValue={(text: string) => {
              onChange(text);
              handleFieldBlur(`skimmer${index + 1}LidModel`, text);
            }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        )}
      />
    </View>
  );
});

// Pure function for pool calculations - no side effects
const calculatePoolMetrics = (values: any): { avgDepth: number; volume: number; surfaceArea: number } => {
  const { length, width, deepEndDepth, shallowEndDepth, shape } = values;
  
  let avgDepth = 0;
  let volume = 0;
  let surfaceArea = 0;
  
  // Calculate average depth
  if (deepEndDepth && shallowEndDepth) {
    avgDepth = (parseFloat(deepEndDepth) + parseFloat(shallowEndDepth)) / 2;
  }
  
  // Calculate surface area and volume
  if (length && width && avgDepth) {
    const l = parseFloat(length);
    const w = parseFloat(width);
    
    // Surface area calculation based on shape
    switch (shape) {
      case 'rectangle':
        surfaceArea = l * w;
        volume = surfaceArea * avgDepth * 7.48;
        break;
      case 'oval':
        surfaceArea = Math.PI * (l / 2) * (w / 2);
        volume = surfaceArea * avgDepth * 7.48;
        break;
      case 'round':
        const radius = l / 2;
        surfaceArea = Math.PI * radius * radius;
        volume = surfaceArea * avgDepth * 7.48;
        break;
      case 'kidney':
      case 'freeform':
        surfaceArea = l * w * 0.85;
        volume = surfaceArea * avgDepth * 7.48;
        break;
      default:
        surfaceArea = l * w;
        volume = surfaceArea * avgDepth * 7.48;
    }
  }
  
  return {
    avgDepth: Math.round(avgDepth * 10) / 10,
    volume: Math.round(volume),
    surfaceArea: Math.round(surfaceArea)
  };
};

export const PoolDetailsStep: React.FC = () => {
  const { session, updatePoolDetails, nextStep } = useOnboarding();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'size-shape',
    'surface',
    'environment',
    'skimmers',
    'deck'
  ]);
  const [skimmerCount, setSkimmerCount] = useState(0);
  const [environmentPhotos, setEnvironmentPhotos] = useState<string[]>([]);
  const [surfacePhotos, setSurfacePhotos] = useState<string[]>([]);
  const [deckPhotos, setDeckPhotos] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isAnalyzingSatellite, setIsAnalyzingSatellite] = useState(false);
  const [satelliteAnalyzed, setSatelliteAnalyzed] = useState(false);
  const [satelliteAnalysisResult, setSatelliteAnalysisResult] = useState<any>(null);
  const [calcTrigger, setCalcTrigger] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: string]: View | null }>({});
  
  const formMethods = useForm<PoolDetailsData>({
    resolver: zodResolver(poolDetailsSchema),
    defaultValues: {
      ...session?.poolDetails,
      poolType: session?.poolDetails?.poolType || session?.poolDetails?.type || undefined,
      shape: session?.poolDetails?.shape || undefined,
      length: session?.poolDetails?.length || undefined,
      width: session?.poolDetails?.width || undefined,
      avgDepth: session?.poolDetails?.avgDepth || undefined,
      deepEndDepth: session?.poolDetails?.deepEndDepth || undefined,
      shallowEndDepth: session?.poolDetails?.shallowEndDepth || undefined,
      volume: session?.poolDetails?.volume || undefined,
      surfaceArea: session?.poolDetails?.surfaceArea || undefined,
      surfaceMaterial: session?.poolDetails?.surfaceMaterial || undefined,
      surfaceCondition: session?.poolDetails?.surfaceCondition || undefined,
      features: session?.poolDetails?.features || [],
      nearbyTrees: session?.poolDetails?.environment?.nearbyTrees || false,
      treeTypes: session?.poolDetails?.environment?.treeType || '',
      sprinklerSystem: session?.poolDetails?.environment?.sprinklerSystem || false,
      surfaceStains: session?.poolDetails?.surfaceStains || false,
      stainTypes: session?.poolDetails?.stainTypes || '',
      deckCleanliness: session?.poolDetails?.deckCleanliness || '',
      skimmerCount: session?.poolDetails?.skimmerCount || 0,
    },
  });
  
  const { control, handleSubmit, reset, setValue, getValues, formState: { errors } } = formMethods;
  
  // Add field save timeout ref
  const fieldSaveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // Get current form values for display
  const getCurrentValue = (field: string) => {
    const values = getValues();
    return values[field as keyof typeof values];
  };
  
  // Custom hook for pool calculations
  const calculatedValues = useMemo(() => {
    const values = getValues();
    return calculatePoolMetrics(values);
  }, [calcTrigger]);
  
  // Load existing data
  useEffect(() => {
    if (session?.poolDetails) {
      reset(session.poolDetails);
      setSelectedFeatures(session.poolDetails.features || []);
      // Only set skimmerCount if it's not already set
      if (skimmerCount === 0 && session.poolDetails.skimmerCount > 0) {
        setSkimmerCount(session.poolDetails.skimmerCount);
      }
    }
  }, [session?.poolDetails, reset]); // Remove skimmerCount from dependencies
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };
  
  const onSubmit = async (data: PoolDetailsData) => {
    try {
      const metrics = calculatePoolMetrics(data);
      
      const dataWithFeatures = { 
        ...data,
        ...metrics,
        features: selectedFeatures,
        skimmerCount,
        ...getSkimmerData(),
      };
      
      await updatePoolDetails(dataWithFeatures);
    } catch (err) {
      webAlert.alert('Error', 'Failed to save pool details');
    }
  };
  
  const toggleFeature = (featureId: string) => {
    const updated = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter(f => f !== featureId)
      : [...selectedFeatures, featureId];
    setSelectedFeatures(updated);
    setValue('features', updated);
    handleFieldBlur('features', updated);
  };

  // Auto-save on field blur
  const handleFieldBlur = async (field: string, value: any) => {
    // Clear any pending save for this field
    if (fieldSaveTimeouts.current[field]) {
      clearTimeout(fieldSaveTimeouts.current[field]);
    }
    
    // Debounce the save per field
    fieldSaveTimeouts.current[field] = setTimeout(async () => {
      console.log(`💾 Saving ${field}:`, value);
      
      // Get ALL current form values
      const allValues = getValues();
      
      // Always calculate metrics for consistency
      const metrics = calculatePoolMetrics(allValues);
      
      // Trigger recalculation for dimension fields
      if (['length', 'width', 'deepEndDepth', 'shallowEndDepth', 'shape'].includes(field)) {
        setCalcTrigger(prev => prev + 1);
      }
      
      // Save everything
      const fullData = {
        ...allValues,
        avgDepth: metrics.avgDepth,
        volume: metrics.volume,
        surfaceArea: metrics.surfaceArea,
        poolType: allValues.poolType,
        type: allValues.poolType,
        features: selectedFeatures,
        skimmerCount,
        ...getSkimmerData(),
      };
      
      try {
        await updatePoolDetails(fullData);
        console.log('✅ Pool details saved');
      } catch (error) {
        console.error('❌ Save failed:', error);
      }
    }, 1000);
  };

  // Get dynamic skimmer data
  const getSkimmerData = () => {
    const formData = getValues(); // Use getValues() instead of formValues
    const skimmerData: any = {};
    for (let i = 0; i < skimmerCount; i++) {
      const skimmerNum = i + 1;
      skimmerData[`skimmer${skimmerNum}Functioning`] = formData[`skimmer${skimmerNum}Functioning`] || false;
      skimmerData[`skimmer${skimmerNum}BasketCondition`] = formData[`skimmer${skimmerNum}BasketCondition`] || '';
      skimmerData[`skimmer${skimmerNum}LidCondition`] = formData[`skimmer${skimmerNum}LidCondition`] || '';
      skimmerData[`skimmer${skimmerNum}LidModel`] = formData[`skimmer${skimmerNum}LidModel`] || '';
    }
    return skimmerData;
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all pending saves on unmount
      Object.values(fieldSaveTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);


  // Mock satellite analysis function
  const analyzeSatelliteImage = async (address: string) => {
    if (FEATURES.USE_REAL_AI) {
      try {
        const response = await fetch(AI_ENDPOINTS.ANALYZE_POOL_SATELLITE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
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
      poolType: 'inground',
      confidence: 0.87,
      features: ['deck', 'pool', 'landscaping']
    };
  };

  const handleSatelliteAnalysis = async () => {
    const customerAddress = session?.customerInfo?.address;
    if (!customerAddress) {
      webAlert.alert('Address Required', 'Customer address is needed for satellite analysis.');
      return;
    }

    setIsAnalyzingSatellite(true);
    try {
      const result = await analyzeSatelliteImage(customerAddress);
      
      // Auto-populate fields
      setValue('shape', result.shape);
      setValue('length', result.length);
      setValue('width', result.width);
      setValue('surfaceArea', result.surfaceArea);
      
      // Set pool type if detected
      if (result.poolType) {
        setValue('poolType', result.poolType);
      }
      
      setSatelliteAnalyzed(true);
      setSatelliteAnalysisResult({
        success: true,
        confidence: Math.round(result.confidence * 100),
        surfaceArea: result.surfaceArea,
        message: `${result.poolType === 'aboveGround' ? 'Above-ground' : 'In-ground'} pool detected: ${result.length}' x ${result.width}' ${result.shape}`
      });
      
      // Force a blur save to persist and recalculate
      setTimeout(() => {
        handleFieldBlur('satellite-update', getValues());
      }, 100);
      
      setTimeout(() => setSatelliteAnalysisResult(null), 5000);
    } catch (error) {
      setSatelliteAnalysisResult({
        success: false,
        message: 'Unable to analyze satellite imagery'
      });
    } finally {
      setIsAnalyzingSatellite(false);
    }
  };
  
  // Section Components
  const SizeShapeSection = React.memo(() => (
    <>
      {/* AI Satellite Analyzer */}
      <View style={styles.aiAnalyzerSection}>
        <View style={styles.analysisHeader}>
          <Ionicons name="globe" size={24} color={theme.colors.aiPink} />
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
            colors={satelliteAnalyzed ? [theme.colors.success, theme.colors.success] : [theme.colors.aiPink, theme.colors.aiPink]}
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
        
        {satelliteAnalysisResult && (
          <View style={[
            styles.analysisResultBanner,
            satelliteAnalysisResult.success ? styles.successBanner : styles.errorBanner
          ]}>
            <Ionicons 
              name={satelliteAnalysisResult.success ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={satelliteAnalysisResult.success ? theme.colors.success : theme.colors.error} 
            />
            <Text style={styles.analysisResultText}>
              {satelliteAnalysisResult.message}
              {satelliteAnalysisResult.confidence && ` - ${satelliteAnalysisResult.confidence}% confidence`}
            </Text>
          </View>
        )}
      </View>
      {/* Pool Type */}
      <Text style={styles.fieldLabel}>Pool Type</Text>
      <Controller
        control={control}
        name="poolType"
        render={({ field: { onChange, value } }) => (
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, value === 'inground' && styles.typeButtonActive]}
              onPress={() => {
                onChange('inground');
                handleFieldBlur('poolType', 'inground');
              }}
            >
              <Text style={[styles.typeButtonText, value === 'inground' && styles.typeButtonTextActive]}>
                In-Ground
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, value === 'aboveGround' && styles.typeButtonActive]}
              onPress={() => {
                onChange('aboveGround');
                handleFieldBlur('poolType', 'aboveGround');
              }}
            >
              <Text style={[styles.typeButtonText, value === 'aboveGround' && styles.typeButtonTextActive]}>
                Above Ground
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
      
      {/* Pool Shape */}
      <Text style={styles.fieldLabel}>Pool Shape</Text>
      <Controller
        control={control}
        name="shape"
        render={({ field: { onChange, value } }) => (
          <View style={styles.shapeGrid}>
            {POOL_SHAPES.map((shape) => (
              <TouchableOpacity
                key={shape.value}
                style={[styles.shapeButton, value === shape.value && styles.shapeButtonActive]}
                onPress={() => {
                  onChange(shape.value);
                  handleFieldBlur('shape', shape.value);
                }}
              >
                <Ionicons
                  name={shape.icon as any}
                  size={14}
                  color={value === shape.value ? theme.colors.white : theme.colors.gray}
                  style={styles.shapeIcon}
                />
                <Text style={[
                  styles.shapeButtonText,
                  value === shape.value && styles.shapeButtonTextActive
                ]}>
                  {shape.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      
      {/* Dimensions */}
      <Text style={styles.fieldLabel}>Dimensions</Text>
      <View style={styles.row}>
        <View style={styles.thirdField}>
          <Controller
            control={control}
            name="length"
            render={({ field: { onChange, value } }) => (
              <UncontrolledInput
                label="Length"
                initialValue={value ? String(value) : ''}
                onBlurValue={(text: string) => {
                  const num = parseFloat(text);
                  onChange(isNaN(num) ? undefined : num);
                  handleFieldBlur('length', num);
                }}
                error={errors.length?.message}
                keyboardType="numeric"
              />
            )}
          />
        </View>
        <View style={styles.thirdField}>
          <Controller
            control={control}
            name="width"
            render={({ field: { onChange, value } }) => (
              <UncontrolledInput
                label="Width"
                initialValue={value ? String(value) : ''}
                onBlurValue={(text: string) => {
                  const num = parseFloat(text);
                  onChange(isNaN(num) ? undefined : num);
                  handleFieldBlur('width', num);
                }}
                error={errors.width?.message}
                keyboardType="numeric"
              />
            )}
          />
        </View>
      </View>
      {/* Depth Fields */}
      <Text style={styles.fieldLabel}>Pool Depths</Text>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Controller
            control={control}
            name="shallowEndDepth"
            render={({ field: { onChange, value } }) => (
              <UncontrolledInput
                label="Shallow End"
                initialValue={value ? String(value) : ''}
                onBlurValue={(text: string) => {
                  const num = parseFloat(text);
                  onChange(isNaN(num) ? undefined : num);
                  handleFieldBlur('shallowEndDepth', num);
                }}
                keyboardType="numeric"
              />
            )}
          />
        </View>
        <View style={styles.halfField}>
          <Controller
            control={control}
            name="deepEndDepth"
            render={({ field: { onChange, value } }) => (
              <UncontrolledInput
                label="Deep End"
                initialValue={value ? String(value) : ''}
                onBlurValue={(text: string) => {
                  const num = parseFloat(text);
                  onChange(isNaN(num) ? undefined : num);
                  handleFieldBlur('deepEndDepth', num);
                }}
                keyboardType="numeric"
              />
            )}
          />
        </View>
      </View>
      {/* Auto-calculated Average Depth */}
      <View style={styles.fullField}>
        <Text style={styles.fieldLabel}>Average Depth (Auto-calculated)</Text>
        <View style={[styles.inputContainer, styles.disabledInput]}>
          <Text style={styles.inputText}>
            {calculatedValues.avgDepth ? calculatedValues.avgDepth.toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.inputSuffix}>ft</Text>
        </View>
      </View>
      {/* Calculated Volume */}
      {calculatedValues.volume > 0 && (
        <View style={styles.volumeDisplay}>
          <Text style={styles.volumeLabel}>Estimated Volume</Text>
          <Text style={styles.volumeValue}>
            {calculatedValues.volume.toLocaleString()} gallons
          </Text>
        </View>
      )}

      {/* Features */}
      <Text style={styles.fieldLabel}>Pool Features</Text>
      <View style={styles.featuresGrid}>
        {POOL_FEATURES.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureButton,
              selectedFeatures.includes(feature.id) && styles.featureButtonActive
            ]}
            onPress={() => toggleFeature(feature.id)}
          >
            <Ionicons
              name={feature.icon as any}
              size={20}
              color={selectedFeatures.includes(feature.id) ? theme.colors.white : theme.colors.gray}
            />
            <Text style={[
              styles.featureButtonText,
              selectedFeatures.includes(feature.id) && styles.featureButtonTextActive
            ]}>
              {feature.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  ));
  
  const SurfaceSection = React.memo(() => (
    <>
      <Text style={styles.fieldLabel}>Surface Material</Text>
      <View style={styles.optionsGrid}>
        {SURFACE_MATERIALS.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.optionButton,
              getCurrentValue('surfaceMaterial') === type.value && styles.optionButtonActive
            ]}
            onPress={() => {
              setValue('surfaceMaterial', type.value as any);
              handleFieldBlur('surfaceMaterial', type.value);
            }}
          >
            <Text style={[
              styles.optionText,
              getCurrentValue('surfaceMaterial') === type.value && styles.optionTextActive
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.fieldLabel}>Surface Condition</Text>
      <View style={styles.conditionGrid}>
        {CONDITION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.conditionOption,
              getCurrentValue('surfaceCondition') === option.value && { 
                backgroundColor: option.color + '20',
                borderColor: option.color 
              },
            ]}
            onPress={() => {
              setValue('surfaceCondition', option.value as any);
              handleFieldBlur('surfaceCondition', option.value);
            }}
          >
            <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
            <Text style={[
              styles.conditionLabel,
              getCurrentValue('surfaceCondition') === option.value && { 
                color: option.color, 
                fontWeight: '600' 
              }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* AI Stain Analyzer */}
      <View style={styles.aiAnalyzerSection}>
        <Text style={styles.analyzerTitle}>AI Stain Analysis</Text>
        <Text style={styles.analyzerDescription}>
          Take photos of any stains for AI to identify stain types (organic, metal, scale)
        </Text>
        <AIPhotoAnalyzer
          title="Surface Stain Photos"
          description=""
          maxPhotos={10}
          onAnalyze={async (photos) => {
            setSurfacePhotos(photos);
            // Mock AI stain detection
            const stainTypes = ['organic', 'iron', 'copper', 'scale'];
            const detectedStains = stainTypes[Math.floor(Math.random() * stainTypes.length)];
            setValue('stainTypes', detectedStains);
            setValue('surfaceStains', true);
            // Save the data
            handleFieldBlur('stainTypes', detectedStains);
          }}
          allowBatchAnalysis={true}
        />
      </View>
    </>
  ));
  
  const EnvironmentSection = React.memo(() => (
    <>
      {/* AI Environment Analyzer */}
      <View style={styles.aiAnalyzerSection}>
        <Text style={styles.analyzerTitle}>AI Environment Analysis</Text>
        <Text style={styles.analyzerDescription}>
          {`Take photos around the pool area. AI will identify:
• Tree types and foliage density
• Sun exposure patterns
• Estimated leaf fall volume
• Wind exposure factors`}
        </Text>
        <AIPhotoAnalyzer
          title="Environment Photos"
          description="Capture 360° view around pool"
          maxPhotos={8}
          onAnalyze={async (photos) => {
            setEnvironmentPhotos(photos);
            // Mock AI environment analysis
            const analysis = {
              trees: ['Oak (2)', 'Pine (1)', 'Palm (3)'],
              sunExposure: 'High (6-8 hours direct sun)',
              leafFall: 'Moderate (seasonal)',
              windExposure: 'Protected',
              shadeCoverage: '30%',
            };
            setValue('environmentAnalysis' as any, analysis);
            // Show results inline
          }}
          allowBatchAnalysis={true}
        />
      </View>
      {/* Display AI Results if available */}
      {getCurrentValue('environmentAnalysis') && (
        <View style={styles.aiResultsCard}>
          <Text style={styles.aiResultsTitle}>Environment Analysis Results</Text>
          {/* Display the analysis results */}
        </View>
      )}
    </>
  ));
  
  const SkimmersSection = memo(() => (
    <>
      {/* AI Skimmer Detection - MOVE TO TOP */}
      <View style={styles.aiAnalyzerSection}>
        <Text style={styles.analyzerTitle}>AI Skimmer Detection</Text>
        <Text style={styles.analyzerDescription}>
          {`Take clear photos of each skimmer basket and lid separately. AI will count skimmers and assess their condition. Include photos from directly above each skimmer.`}
        </Text>
        <AIPhotoAnalyzer
          title="Skimmer & Lid Photos"
          description="Photo each skimmer and its lid"
          maxPhotos={20}
          onAnalyze={async (photos) => {
            // Mock AI skimmer detection
            const detectedCount = Math.floor(Math.random() * 3) + 1;
            setSkimmerCount(detectedCount);
            setValue('skimmerCount', detectedCount);
            // In production, AI would differentiate between skimmer and lid photos
          }}
          allowBatchAnalysis={true}
        />
      </View>
      {/* Manual Counter - MOVE BELOW AI */}
      <View style={styles.counterSection}>
        <Text style={styles.fieldLabel}>Or Manually Set Number of Skimmers</Text>
        <View style={styles.counterControls}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => {
              const newCount = Math.max(0, skimmerCount - 1);
              setSkimmerCount(newCount);
              setValue('skimmerCount', newCount);
              handleFieldBlur('skimmerCount', newCount);
            }}
          >
            <Ionicons name="remove" size={24} color={theme.colors.darkBlue} />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{skimmerCount}</Text>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => {
              const newCount = skimmerCount + 1;
              setSkimmerCount(newCount);
              setValue('skimmerCount', newCount);
              handleFieldBlur('skimmerCount', newCount);
            }}
          >
            <Ionicons name="add" size={24} color={theme.colors.darkBlue} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Dynamic Skimmer Mini-Sections */}
      {Array.from({ length: skimmerCount }).map((_, index) => (
        <SkimmerMiniSection key={index} index={index} handleFieldBlur={handleFieldBlur} />
      ))}
    </>
  ));
  
  const DeckSection = React.memo(() => (
    <>
      {/* AI Deck Analyzer - UPDATE */}
      <View style={styles.aiAnalyzerSection}>
        <Text style={styles.analyzerTitle}>AI Deck Analysis</Text>
        <Text style={styles.analyzerDescription}>
          AI will identify deck surface material and assess condition
        </Text>
        <AIPhotoAnalyzer
          title="Deck Photos"
          description="Capture deck areas around pool"
          maxPhotos={6}
          onAnalyze={async (photos) => {
            setDeckPhotos(photos);
            // Mock AI deck analysis
            const materials = ['pavers', 'stamped concrete', 'tile', 'natural stone', 'concrete'];
            const detectedMaterial = materials[Math.floor(Math.random() * materials.length)];
            setValue('deckMaterial', detectedMaterial);
            setValue('deckCleanliness', 'clean'); // Mock cleanliness
          }}
          allowBatchAnalysis={true}
        />
      </View>
      {/* Deck Material Field - ADD */}
      <Text style={styles.fieldLabel}>Deck Surface Material</Text>
      <View style={styles.optionsGrid}>
        {['pavers', 'stamped concrete', 'tile', 'natural stone', 'concrete', 'other'].map((material) => (
          <TouchableOpacity
            key={material}
            style={[
              styles.optionButton,
              getCurrentValue('deckMaterial') === material && styles.optionButtonActive
            ]}
            onPress={() => setValue('deckMaterial', material)}
          >
            <Text style={[
              styles.optionText,
              getCurrentValue('deckMaterial') === material && styles.optionTextActive
            ]}>
              {material.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Deck Cleanliness - EXISTING */}
      <Text style={styles.fieldLabel}>Deck Cleanliness</Text>
      <View style={styles.optionsGrid}>
        {['pristine', 'clean', 'dirty', 'filthy'].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.optionButton,
              getCurrentValue('deckCleanliness') === level && styles.optionButtonActive
            ]}
            onPress={() => setValue('deckCleanliness', level)}
          >
            <Text style={[
              styles.optionText,
              getCurrentValue('deckCleanliness') === level && styles.optionTextActive
            ]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  ));
  
  return (
    <FormProvider {...formMethods}>
      <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.blueGreen, theme.colors.darkBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Pool Details</Text>
        <Text style={styles.headerSubtitle}>
          Comprehensive pool assessment with AI assistance
        </Text>
      </LinearGradient>
      
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      >
        {POOL_SECTIONS.map((section) => (
          <View 
            key={section.id} 
            style={styles.section}
            ref={ref => sectionRefs.current[section.id] = ref}
          >
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons 
                  name={section.icon as any} 
                  size={24} 
                  color={theme.colors.blueGreen} 
                />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Ionicons
                name={expandedSections.includes(section.id) ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={theme.colors.gray}
              />
            </TouchableOpacity>
            
            {expandedSections.includes(section.id) && (
              <View style={styles.sectionContent}>
                {section.id === 'size-shape' && <SizeShapeSection />}
                {section.id === 'surface' && <SurfaceSection />}
                {section.id === 'environment' && <EnvironmentSection />}
                {section.id === 'skimmers' && <SkimmersSection />}
                {section.id === 'deck' && <DeckSection />}
              </View>
            )}
          </View>
        ))}
        
        <AIInsightsBox stepName="poolDetails" />
      </ScrollView>
    </View>
    </FormProvider>
  );
};

// Helper function for condition colors
const getConditionColor = (condition: string) => {
  switch (condition) {
    case 'excellent': return theme.colors.success;
    case 'good': return theme.colors.blueGreen;
    case 'fair': return theme.colors.warning;
    case 'poor': return theme.colors.error;
    default: return theme.colors.gray;
  }
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
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.md,
  },
  sectionContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  fieldLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  typeButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: theme.colors.white,
  },
  shapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  shapeButton: {
    width: '23%',
    aspectRatio: 1,
    margin: '1%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  shapeButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  shapeButtonText: {
    fontSize: 9,
    color: theme.colors.gray,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
  shapeIcon: {
    marginBottom: 2,
  },
  shapeButtonTextActive: {
    color: theme.colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  thirdField: {
    flex: 1,
  },
  halfField: {
    flex: 1,
  },
  fullField: {
    marginTop: theme.spacing.md,
  },
  calculatedField: {
    backgroundColor: theme.colors.grayLight,
    opacity: 0.9,
    // Ensure proper text padding
    paddingHorizontal: theme.spacing.md,
  },
  calculatedLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  calculatedValue: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginTop: theme.spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  optionButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  optionText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  optionTextActive: {
    color: theme.colors.white,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  conditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  featureButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  featureButtonText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  featureButtonTextActive: {
    color: theme.colors.white,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  checkboxLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
  },
  calculatedFieldContainer: {
    marginTop: theme.spacing.md,
  },
  calculatedFieldLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
  },
  calculatedFieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grayLight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calculatedFieldText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    flex: 1,
  },
  calculatedFieldSuffix: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
  },
  aiAnalyzerSection: {
    backgroundColor: theme.colors.aiPink + '10',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
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
  },
  analyzerTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
  },
  analyzerDescription: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.md,
  },
  analysisButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  analysisButtonCompleted: {
    opacity: 0.9,
  },
  analysisButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  analysisButtonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  analysisResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
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
  skimmerMiniSection: {
    backgroundColor: theme.colors.seaFoam,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  miniSectionTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
  },
  counterSection: {
    marginBottom: theme.spacing.lg,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginHorizontal: theme.spacing.xl,
  },
  aiOptionCard: {
    backgroundColor: theme.colors.aiPink + '10',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  aiOptionText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  aiResultsCard: {
    backgroundColor: theme.colors.seaFoam + '20',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  aiResultsTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 8,
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
  },
  inputText: {
    fontSize: 16,
    color: theme.colors.darkBlue,
    flex: 1,
  },
  inputSuffix: {
    fontSize: 16,
    color: theme.colors.gray,
    marginLeft: 8,
  },
  volumeDisplay: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  volumeLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
  },
  volumeValue: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
});