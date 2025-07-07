import React, { useState, useRef, useEffect, useCallback, memo, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useForm, Controller, useFormContext, FormProvider, useWatch, Control, UseFormSetValue, UseFormGetValues, FieldErrors, UseFormTrigger } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { EnhancedFloatingInput } from '../../../../components/ui/EnhancedFloatingInput';
import { ModernSelect } from '../../../../components/ui/ModernSelect';
import { AIPhotoAnalyzer } from '../../../../components/ui/AIPhotoAnalyzer';
import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';
import { FEATURES, AI_ENDPOINTS } from '../../../../config/features';
import { AIInsightsService } from '../../../../services/ai/aiInsights';
import { apiClient } from '../../../../services/api/client';
import { satelliteAnalyzer } from '../../../../services/ai/satelliteAnalyzer';
import { aiService } from '../../../../services/api/ai';
import { POOL_ICONS } from '../../../../constants/icons';
import { SurfaceAnalysisMapper } from '../../../../services/ai/surfaceAnalysisMapper';
import { EnvironmentAnalysisMapper } from '../../../../services/ai/environmentAnalysisMapper';
import { SkimmerAnalysisMapper } from '../../../../services/ai/skimmerAnalysisMapper';
import { DeckAnalysisMapper } from '../../../../services/ai/deckAnalysisMapper';
import { aiAnalysisStorage } from '../../../../services/aiAnalysis/storage';

// Constants
const MAX_SKIMMERS = 10;
const MAX_PHOTOS_PER_SECTION = 12;
const DEBOUNCE_DELAY = 1500;
const CALCULATION_PRECISION = 10;

// Type Definitions
interface FormControl extends Control<PoolDetailsData> {}

interface FormMethods {
  control: FormControl;
  setValue: UseFormSetValue<PoolDetailsData>;
  getValues: UseFormGetValues<PoolDetailsData>;
  errors: FieldErrors<PoolDetailsData>;
}

interface SectionProps {
  control: FormControl;
  errors: FieldErrors<PoolDetailsData>;
  setValue: UseFormSetValue<PoolDetailsData>;
  handleFieldBlur: (field: string, value: any) => void;
}

interface SkimmerWatches {
  basket0: string;
  lid0: string;
  basket1: string;
  lid1: string;
  basket2: string;
  lid2: string;
  basket3: string;
  lid3: string;
  basket4: string;
  lid4: string;
}

interface SkimmersSectionProps {
  control: FormControl;
  errors?: FieldErrors<PoolDetailsData>;
  setValue: UseFormSetValue<PoolDetailsData>;
  skimmerCount: number;
  setSkimmerCount: (count: number) => void;
  handleFieldBlur: (field: string, value: any) => void;
  skimmerWatches: SkimmerWatches;
}

interface EnvironmentSectionProps {
  control: FormControl;
  errors?: FieldErrors<PoolDetailsData>;
  setValue: UseFormSetValue<PoolDetailsData>;
  handleFieldBlur: (field: string, value: any) => void;
  environmentPhotos: string[];
  setEnvironmentPhotos: (photos: string[]) => void;
}

interface SkimmerData {
  [key: string]: boolean | string | number;
}

interface PoolMetrics {
  avgDepth: number;
  volume: number;
  surfaceArea: number;
}

interface SatelliteAnalysisResult {
  success: boolean;
  message: string;
  confidence?: number;
  surfaceArea?: number;
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PoolDetailsErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PoolDetailsStep Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading pool details</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => this.setState({ hasError: false })}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const PoolDetailsErrorFallback: React.FC<{ error?: Error; retry?: () => void }> = ({ error, retry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>Pool Details Error</Text>
    <Text style={styles.errorDetails}>
      {error?.message || 'An unexpected error occurred while loading pool details.'}
    </Text>
    {retry && (
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Pure function for pool calculations with proper typing
const calculatePoolMetrics = (values: Partial<PoolDetailsData>): PoolMetrics => {
  const { length, width, deepEndDepth, shallowEndDepth, shape } = values;
  
  let avgDepth = 0;
  let volume = 0;
  let surfaceArea = 0;
  
  // Calculate average depth
  if (deepEndDepth && shallowEndDepth) {
    avgDepth = (Number(deepEndDepth) + Number(shallowEndDepth)) / 2;
  }
  
  // Calculate surface area and volume
  if (length && width && avgDepth) {
    const l = Number(length);
    const w = Number(width);
    const gallonsPerCubicFoot = 7.48;
    
    // Surface area calculation based on shape
    switch (shape) {
      case 'rectangle':
        surfaceArea = l * w;
        volume = surfaceArea * avgDepth * gallonsPerCubicFoot;
        break;
      case 'oval':
        surfaceArea = Math.PI * (l / 2) * (w / 2);
        volume = surfaceArea * avgDepth * gallonsPerCubicFoot;
        break;
      case 'round':
        const radius = l / 2;
        surfaceArea = Math.PI * radius * radius;
        volume = surfaceArea * avgDepth * gallonsPerCubicFoot;
        break;
      case 'kidney':
      case 'freeform':
        surfaceArea = l * w * 0.85; // Irregular shape factor
        volume = surfaceArea * avgDepth * gallonsPerCubicFoot;
        break;
      default:
        surfaceArea = l * w;
        volume = surfaceArea * avgDepth * gallonsPerCubicFoot;
    }
  }
  
  return {
    avgDepth: Math.round(avgDepth * CALCULATION_PRECISION) / CALCULATION_PRECISION,
    volume: Math.round(volume),
    surfaceArea: Math.round(surfaceArea)
  };
};

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
  
  // Surface issues - nested structure
  surfaceIssues: z.object({
    stains: z.boolean().optional(),
    stainSeverity: z.enum(['light', 'moderate', 'heavy']).optional(),
    cracks: z.boolean().optional(),
    crackSeverity: z.enum(['minor', 'major']).optional(),
    roughness: z.enum(['smooth', 'slightly rough', 'very rough']).optional(),
    discoloration: z.boolean().optional(),
    discolorationSeverity: z.enum(['minor', 'significant']).optional(),
    etching: z.boolean().optional(),
    scaling: z.boolean().optional(),
    chipping: z.boolean().optional(),
    hollowSpots: z.boolean().optional(),
  }).optional(),
  // surfaceRoughness: z.number().min(1).max(10).optional(), // Moved to surfaceIssues.roughness
  surfaceType: z.string().optional(),
  surfaceAge: z.string().optional(),
  lastResurfaced: z.string().optional(),
  hasVisibleDamage: z.boolean().optional(),
  notes: z.string().optional(),
}).passthrough(); // Allow dynamic fields

type PoolDetailsData = z.infer<typeof poolDetailsSchema>;

// Performance monitoring component for enterprise-grade debugging
const PerformanceMonitor = () => {
  useEffect(() => {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 16) { // Longer than one frame (60fps)
            console.warn('🐌 Slow render detected:', entry.name, `${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      observer.observe({ entryTypes: ['measure'] });
      return () => observer.disconnect();
    }
  }, []);
  return null;
};

// Uncontrolled input wrapper to prevent re-renders
const UncontrolledInput = ({ 
  label, 
  initialValue, 
  onBlurValue,
  ...props 
}: any) => {
  const [localValue, setLocalValue] = useState(initialValue || '');
  
  return (
    <EnhancedFloatingInput
      label={label}
      value={localValue}
      onChangeText={setLocalValue}
      onBlur={() => onBlurValue(localValue)}
      {...props}
    />
  );
};

// Section Components - moved outside main component to prevent circular dependencies
const SizeShapeSection = memo(({ 
  control, 
  errors, 
  setValue, 
  poolType, 
  shape, 
  handleFieldBlur,
  isAnalyzingSatellite,
  satelliteAnalyzed,
  satelliteAnalysisResult,
  handleSatelliteAnalysis,
  selectedFeatures,
  toggleFeature,
  session
}: any) => (
  <View>
    {/* 1. SATELLITE ANALYSIS FIRST */}
    {session?.customerInfo?.address && (
      <View style={styles.satelliteSection}>
        <View style={styles.satelliteHeader}>
          <Ionicons name={POOL_ICONS.satellite} size={24} color={theme.colors.aiPink} />
          <Text style={styles.satelliteTitle}>AI Satellite Analysis</Text>
        </View>
        
        <Text style={styles.satelliteDescription}>
          Analyze satellite imagery to automatically detect pool dimensions and features
        </Text>
        
        <TouchableOpacity
          style={[
            styles.satelliteButton,
            isAnalyzingSatellite && styles.satelliteButtonDisabled
          ]}
          onPress={handleSatelliteAnalysis}
          disabled={isAnalyzingSatellite || !session?.customerInfo?.address}
        >
          <LinearGradient
            colors={[theme.colors.aiPink, '#E091E3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.satelliteButtonGradient}
          >
            {isAnalyzingSatellite ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name={POOL_ICONS.scan} size={20} color="white" />
                <Text style={styles.satelliteButtonText}>
                  Analyze Property
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        {satelliteAnalyzed && (
          <View style={styles.satelliteResultCard}>
            <Ionicons 
              name={POOL_ICONS.checkmark} 
              size={20} 
              color={theme.colors.success} 
            />
            <Text style={styles.satelliteResultText}>
              Pool detected and dimensions auto-filled
            </Text>
          </View>
        )}
        
        {satelliteAnalysisResult && (
          <View style={[
            styles.analysisResultBanner,
            satelliteAnalysisResult.success ? styles.successBanner : styles.errorBanner
          ]}>
            <Ionicons 
              name={satelliteAnalysisResult.success ? POOL_ICONS.checkmark : POOL_ICONS.close} 
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
    )}
    
    {/* 2. POOL TYPE SECOND (moved from above) */}
    <Text style={styles.fieldLabel}>Pool Type</Text>
    <View style={styles.typeButtons}>
      <TouchableOpacity
        style={[
          styles.typeButton,
          poolType === 'inground' && styles.typeButtonActive
        ]}
        onPress={() => {
          setValue('poolType', 'inground');
          handleFieldBlur('poolType', 'inground');
        }}
      >
        <Ionicons 
          name={POOL_ICONS.water} 
          size={24} 
          color={poolType === 'inground' ? theme.colors.white : theme.colors.darkBlue} 
        />
        <Text style={[
          styles.typeButtonText,
          poolType === 'inground' && styles.typeButtonTextActive
        ]}>
          In-Ground
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.typeButton,
          poolType === 'aboveGround' && styles.typeButtonActive
        ]}
        onPress={() => {
          setValue('poolType', 'aboveGround');
          handleFieldBlur('poolType', 'aboveGround');
        }}
      >
        <Ionicons 
          name={POOL_ICONS.water} 
          size={24} 
          color={poolType === 'aboveGround' ? theme.colors.white : theme.colors.darkBlue} 
        />
        <Text style={[
          styles.typeButtonText,
          poolType === 'aboveGround' && styles.typeButtonTextActive
        ]}>
          Above Ground
        </Text>
      </TouchableOpacity>
    </View>
    
    {/* 3. POOL SHAPE THIRD */}
    <Text style={styles.fieldLabel}>Pool Shape</Text>
    <View style={styles.shapeGrid}>
      {POOL_SHAPES.map((shapeOption) => (
        <TouchableOpacity
          key={shapeOption.value}
          style={[
            styles.shapeButton,
            shape === shapeOption.value && styles.shapeButtonActive
          ]}
          onPress={() => {
            setValue('shape', shapeOption.value);
            handleFieldBlur('shape', shapeOption.value);
          }}
        >
          <Ionicons
            name={shapeOption.icon as any}
            size={16}
            color={shape === shapeOption.value ? theme.colors.white : theme.colors.gray}
            style={styles.shapeIcon}
          />
          <Text style={[
            styles.shapeButtonText,
            shape === shapeOption.value && styles.shapeButtonTextActive
          ]}>
            {shapeOption.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    
    {/* Dimensions */}
    <Text style={styles.fieldLabel}>Dimensions</Text>
    <View style={styles.row}>
      <View style={styles.thirdField}>
        <Controller
          control={control}
          name="length"
          render={({ field: { onChange, value } }) => (
            <UncontrolledInput
              key={`length-${value || 0}`} // FORCE RE-RENDER ON VALUE CHANGE
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
              key={`width-${value || 0}`} // FORCE RE-RENDER ON VALUE CHANGE
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
    
    {/* Pool Features */}
    <Text style={styles.fieldLabel}>Pool Features</Text>
    <View style={styles.featuresGrid}>
      {POOL_FEATURES.map((feature) => (
        <TouchableOpacity
          key={feature.id}
          style={[
            styles.featureButton,
            selectedFeatures?.includes(feature.id) && styles.featureButtonActive
          ]}
          onPress={() => toggleFeature(feature.id)}
        >
          <Ionicons 
            name={feature.icon as any} 
            size={24} 
            color={selectedFeatures?.includes(feature.id) ? theme.colors.white : theme.colors.blueGreen} 
          />
          <Text style={[
            styles.featureLabel,
            selectedFeatures?.includes(feature.id) && styles.featureButtonTextActive
          ]}>
            {feature.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
));

const SurfaceSection = memo(({ 
  control, 
  errors, 
  setValue, 
  surfaceMaterial, 
  surfaceCondition,
  handleFieldBlur,
  surfacePhotos,
  setSurfacePhotos,
  session,
  watch
}: any) => {
  return (
    <View>
      {/* AI Surface Analyzer - EXISTING CODE */}
      <View style={styles.aiAnalyzerSection}>
        <Text style={styles.analyzerTitle}>AI Surface Analysis</Text>
        <Text style={styles.analyzerDescription}>
          Take photos of pool surface for AI to identify material type and condition
        </Text>
        <AIPhotoAnalyzer
          title="Surface Photos"
          description="Capture pool surface from multiple angles"
          maxPhotos={Math.min(6, MAX_PHOTOS_PER_SECTION)}
          allowBatchAnalysis={true}
          onAnalyze={async (photos) => {
            setSurfacePhotos(photos);
            
            if (photos.length > 0 && FEATURES.USE_REAL_AI) {
              try {
                // Analyze the first photo (most representative)
                // In future, could analyze all and aggregate results
                const response = await aiService.analyzePoolSurface(
                  photos[0],  // Still use first photo for now
                  session?.id || `session_${Date.now()}`
                );
                
                if (response.success && response.analysis) {
                  const analysis = response.analysis;
                  
                  console.log('🏊 Pool Surface Analysis Result:', analysis);
                  
                  // Create SurfaceAnalysisMapper instance
                  const mapper = new SurfaceAnalysisMapper(setValue, control);
                  
                  // Map the AI response to form fields
                  mapper.mapResponseToForm(analysis);
                  
                  // Handle field blur for material and condition
                  if (analysis.material) {
                    handleFieldBlur('surfaceMaterial', analysis.material.toLowerCase());
                  }
                  if (analysis.condition) {
                    handleFieldBlur('surfaceCondition', analysis.condition.toLowerCase());
                  }
                  
                  // Trigger field blur for all issue fields
                  const issueFields = [
                    'surfaceIssues.stains',
                    'surfaceIssues.stainSeverity',
                    'surfaceIssues.cracks', 
                    'surfaceIssues.crackSeverity',
                    'surfaceIssues.roughness',
                    'surfaceIssues.discoloration',
                    'surfaceIssues.discolorationSeverity',
                    'surfaceIssues.etching',
                    'surfaceIssues.scaling',
                    'surfaceIssues.chipping',
                    'surfaceIssues.hollowSpots'
                  ];
                  
                  issueFields.forEach(field => {
                    const value = watch(field);
                    if (value !== undefined) {
                      handleFieldBlur(field, value);
                    }
                  });
                }
              } catch (error) {
                console.error('Surface analysis failed:', error);
              }
            }
          }}
        />
      </View>
      
      {/* EXISTING: Pool Surface Material */}
      <Text style={styles.fieldLabel}>Pool Surface Material</Text>
      <View style={styles.optionsGrid}>
        {['plaster', 'pebble', 'tile', 'vinyl', 'fiberglass', 'other'].map((material) => (
          <TouchableOpacity
            key={material}
            style={[
              styles.optionButton,
              surfaceMaterial === material && styles.optionButtonActive
            ]}
            onPress={() => {
              setValue('surfaceMaterial', material);
              handleFieldBlur('surfaceMaterial', material);
            }}
          >
            <Text style={[
              styles.optionText,
              surfaceMaterial === material && styles.optionTextActive
            ]}>
              {material.charAt(0).toUpperCase() + material.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* EXISTING: Surface Condition */}
      <Text style={styles.fieldLabel}>Surface Condition</Text>
      <View style={styles.conditionGrid}>
        {['excellent', 'good', 'fair', 'poor'].map((condition) => (
          <TouchableOpacity
            key={condition}
            style={[
              styles.optionButton,
              surfaceCondition === condition && styles.optionButtonActive
            ]}
            onPress={() => {
              setValue('surfaceCondition', condition);
              handleFieldBlur('surfaceCondition', condition);
            }}
          >
            <Text style={[
              styles.optionText,
              surfaceCondition === condition && styles.optionTextActive
            ]}>
              {condition.charAt(0).toUpperCase() + condition.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Surface Analysis - AI Only */}
      {surfacePhotos.length > 0 && (
        <View style={styles.aiAnalysisStatus}>
          <LinearGradient
            colors={[theme.colors.aiPink + '20', theme.colors.blueGreen + '20']}
            style={styles.aiStatusGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.aiStatusText}>
              AI Surface Analysis Complete - Details saved for report
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
});

const EnvironmentSection = memo(({ 
  control, 
  errors, 
  setValue, 
  handleFieldBlur,
  environmentPhotos,
  setEnvironmentPhotos,
  session
}: EnvironmentSectionProps & { session: any }) => (
  <View>
    {/* AI Environment Analyzer */}
    <View style={styles.aiAnalyzerSection}>
      <Text style={styles.analyzerTitle}>AI Environment Analysis</Text>
      <Text style={styles.analyzerDescription}>
        Capture photos of the pool surroundings for environmental assessment. 
        AI will automatically detect trees, landscaping, and surrounding conditions.
      </Text>
      <AIPhotoAnalyzer
        title="Environment Photos"
        description="Include trees, landscaping, and surrounding areas"
        maxPhotos={Math.min(8, MAX_PHOTOS_PER_SECTION)}
        onAnalyze={async (photos: string[]) => {
          setEnvironmentPhotos(photos);
          
          if (photos.length > 0 && FEATURES.USE_REAL_AI) {
            try {
              // Get existing satellite data
              let satelliteData = null;
              if (session?.customerInfo?.id) {
                try {
                  satelliteData = await aiAnalysisStorage.getLatestAnalysis(
                    session.customerInfo.id,
                    'satellite'
                  );
                } catch (error) {
                  console.log('No satellite data available:', error);
                }
              }

              // Fetch weather and pollen data
              let weatherData = null;
              if (session?.customerInfo?.address && session?.customerInfo?.city && session?.customerInfo?.state) {
                try {
                  const weatherAddress = `${session.customerInfo.address}, ${session.customerInfo.city}, ${session.customerInfo.state} ${session.customerInfo.zipCode || ''}`.trim();
                  console.log('🌤️ Fetching weather/pollen data for:', weatherAddress);
                  
                  const weatherResponse = await apiClient.post('/ai/analyze-weather-pollen', {
                    address: weatherAddress,
                  });
                  
                  if (weatherResponse.success && weatherResponse.data) {
                    weatherData = weatherResponse.data;
                    console.log('🌤️ Weather/pollen data received:', {
                      rainfall: weatherData.avgRainfall,
                      windPatterns: weatherData.windPatterns,
                      pollenLevel: weatherData.pollenData?.currentLevel,
                      pollenTypes: weatherData.pollenData?.mainTypes,
                    });
                  }
                } catch (error) {
                  console.error('⚠️ Weather/pollen data fetch failed:', error);
                }
              }

              // Prepare context for AI
              const aiContext = {
                satelliteData: satelliteData?.analysis || null,
                weatherData: weatherData || null,
              };

              // Now analyze environment with ground photos
              const response = await aiService.analyzeEnvironment(
                photos,
                session?.id || `session_${Date.now()}`,
                aiContext
              );
              
              if (response.success && response.analysis) {  // FIX: response.analysis NOT response.data
                const analysis = response.analysis;
                
                // Combine satellite and ground analysis
                const combinedTreeCount = Math.max(
                  analysis.vegetation?.treeCount || 0,
                  satelliteData?.propertyFeatures?.treeCount || 0
                );
                
                const combinedTreeTypes = [
                  ...(analysis.vegetation?.treeTypes || []),
                  ...(satelliteData?.propertyFeatures?.treeTypes || [])
                ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

                // Log combined data
                console.log('🌳 Combined Environment Analysis:', {
                  groundTreeCount: analysis.vegetation?.treeCount,
                  satelliteTreeCount: satelliteData?.propertyFeatures?.treeCount,
                  combinedTreeCount,
                  combinedTreeTypes
                });

                // Create comprehensive analysis with all data sources
                const comprehensiveAnalysis = {
                  ...analysis,
                  vegetation: {
                    ...analysis.vegetation,
                    treeCount: combinedTreeCount,
                    treeTypes: combinedTreeTypes,
                  },
                  weatherIntegration: weatherData ? {
                    rainfall: weatherData.avgRainfall,
                    windPatterns: weatherData.windPatterns,
                    seasonalFactors: weatherData.seasonalFactors,
                    pollenData: weatherData.pollenData,
                  } : null,
                  satelliteIntegration: satelliteData ? {
                    propertySize: satelliteData.analysis?.propertyFeatures?.propertySize,
                    landscapeType: satelliteData.analysis?.propertyFeatures?.landscapeType,
                    treeProximity: satelliteData.analysis?.propertyFeatures?.treeProximity,
                  } : null,
                };

                // Visual debug panel - shows data source integration
                console.log('🔍 COMPREHENSIVE ENVIRONMENT ANALYSIS VISUALIZATION:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📸 GROUND ANALYSIS:');
                console.log('  • Trees detected:', analysis.vegetation?.treesPresent ? '✅' : '❌');
                console.log('  • Tree count:', analysis.vegetation?.treeCount || 0);
                console.log('  • Tree types:', analysis.vegetation?.treeTypes?.join(', ') || 'none');
                console.log('  • Surface type:', analysis.groundConditions?.surfaceType || 'unknown');
                console.log('  • Sprinklers:', analysis.groundConditions?.sprinklersPresent ? '✅' : '❌');
                console.log('');
                console.log('🛰️ SATELLITE ANALYSIS:');
                console.log('  • Tree count:', satelliteData?.analysis?.propertyFeatures?.treeCount || 'N/A');
                console.log('  • Tree proximity:', satelliteData?.analysis?.propertyFeatures?.treeProximity || 'N/A');
                console.log('  • Property size:', satelliteData?.analysis?.propertyFeatures?.propertySize || 'N/A');
                console.log('');
                console.log('🌤️ WEATHER/POLLEN DATA:');
                console.log('  • Annual rainfall:', weatherData?.avgRainfall ? `${weatherData.avgRainfall} inches` : 'N/A');
                console.log('  • Wind patterns:', weatherData?.windPatterns || 'N/A');
                console.log('  • Pollen level:', weatherData?.pollenData?.currentLevel || 'N/A');
                console.log('  • Main pollen types:', weatherData?.pollenData?.mainTypes?.join(', ') || 'N/A');
                console.log('');
                console.log('🎯 COMBINED INSIGHTS:');
                console.log('  • Total tree count:', combinedTreeCount);
                console.log('  • All tree types:', combinedTreeTypes.join(', ') || 'none');
                console.log('  • Maintenance risk score:', calculateMaintenanceRisk(comprehensiveAnalysis));
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // Calculate maintenance risk based on all factors
                function calculateMaintenanceRisk(data: any): string {
                  let riskScore = 0;
                  
                  // Tree factors
                  if (data.vegetation?.treesPresent) riskScore += 20;
                  if (data.vegetation?.treeCount > 5) riskScore += 15;
                  if (data.vegetation?.proximityToPool === 'very_close') riskScore += 25;
                  
                  // Weather factors
                  if (data.weatherIntegration?.rainfall > 60) riskScore += 20;
                  if (data.weatherIntegration?.windPatterns?.includes('strong')) riskScore += 15;
                  if (['high', 'very high'].includes(data.weatherIntegration?.pollenData?.currentLevel)) riskScore += 10;
                  
                  // Environmental challenges
                  if (data.maintenanceChallenges?.length > 2) riskScore += 15;
                  
                  if (riskScore >= 70) return `HIGH (${riskScore}/100) ⚠️`;
                  if (riskScore >= 40) return `MODERATE (${riskScore}/100) ⚡`;
                  return `LOW (${riskScore}/100) ✅`;
                }

                // Map to form with enhanced data
                const mapper = new EnvironmentAnalysisMapper(setValue, control);
                mapper.mapResponseToForm(comprehensiveAnalysis);

                // Handle field blur for mapped fields
                handleFieldBlur('nearbyTrees', comprehensiveAnalysis.vegetation?.treesPresent);
                handleFieldBlur('treeTypes', comprehensiveAnalysis.vegetation?.treeTypes?.join(', '));
                handleFieldBlur('grassOrDirt', analysis.groundConditions?.surfaceType);
                handleFieldBlur('sprinklerSystem', analysis.groundConditions?.sprinklersPresent);

                // Store comprehensive analysis with all data sources
                if (session?.customerInfo?.id) {
                  const storageData = {
                    timestamp: new Date().toISOString(),
                    imageUris: photos,
                    groundAnalysis: analysis,
                    satelliteData: satelliteData?.analysis || null,
                    weatherData: weatherData || null,
                    combinedInsights: {
                      treeCount: combinedTreeCount,
                      treeTypes: combinedTreeTypes,
                      maintenanceRisk: calculateMaintenanceRisk(comprehensiveAnalysis),
                      dataSources: {
                        hasGroundImages: true,
                        hasSatelliteData: !!satelliteData,
                        hasWeatherData: !!weatherData,
                      },
                    },
                  };
                  
                  await aiAnalysisStorage.saveAnalysis(
                    session.customerInfo.id,
                    'environment',
                    storageData
                  );
                  
                  console.log('💾 Comprehensive Environment Analysis Stored Successfully');
                }
              }
            } catch (error) {
              console.error('Environment analysis failed:', error);
            }
          }
        }}
        allowBatchAnalysis={true}
      />
    </View>
    
    {/* AI Analysis Status - Consistent with Surface */}
    {environmentPhotos && environmentPhotos.length > 0 && (
      <View style={styles.aiAnalysisStatus}>
        <LinearGradient
          colors={[theme.colors.aiPink + '20', theme.colors.blueGreen + '20']}
          style={styles.aiStatusGradient}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.aiStatusText}>
            AI Environment Analysis Complete - Environmental factors saved for report
          </Text>
        </LinearGradient>
      </View>
    )}
  </View>
));

const SkimmersSection = memo(({ 
  control, 
  errors, 
  setValue, 
  skimmerCount, 
  setSkimmerCount,
  handleFieldBlur,
  skimmerWatches,
  session
}: SkimmersSectionProps & { session: any }) => (
  <View>
    {/* AI Skimmer Detection */}
    <View style={styles.aiAnalyzerSection}>
      <Text style={styles.analyzerTitle}>AI Skimmer Detection</Text>
      <Text style={styles.analyzerDescription}>
        {`Take clear photos of each skimmer basket and lid separately. AI will count skimmers and assess their condition. Include photos from directly above each skimmer.`}
      </Text>
      <AIPhotoAnalyzer
        title="Skimmer Photos"
        description="Capture each skimmer clearly"
        maxPhotos={MAX_PHOTOS_PER_SECTION}
        onAnalyze={async (photos) => {
          if (photos.length > 0 && FEATURES.USE_REAL_AI) {
            try {
              const response = await aiService.analyzeSkimmers(
                photos,
                session?.id || `session_${Date.now()}`
              );
              
              if (response.success && response.analysis) {  // FIX: response.analysis NOT response.data
                const analysis = response.analysis;
                
                // Create mapper
                const mapper = new SkimmerAnalysisMapper(setValue, control);
                mapper.mapResponseToForm(analysis, photos.length);  // Pass photo count
                
                // Update skimmer count state
                setSkimmerCount(photos.length);  // Use photo count
                
                // Handle field blur
                handleFieldBlur('skimmerCount', photos.length);
                
                // Blur individual skimmer fields
                analysis.skimmers?.forEach((_, index: number) => {
                  if (index < 10) {
                    handleFieldBlur(`skimmer${index + 1}BasketCondition`, analysis.skimmers[index].basketCondition);
                    handleFieldBlur(`skimmer${index + 1}LidCondition`, analysis.skimmers[index].lidCondition);
                  }
                });
              }
            } catch (error) {
              console.error('Skimmer analysis failed:', error);
            }
          }
        }}
        allowBatchAnalysis={true}
      />
    </View>
    
    {/* Skimmer Count */}
    <Text style={styles.fieldLabel}>Number of Skimmers</Text>
    <View style={styles.counterRow}>
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
      <View style={styles.counterDisplay}>
        <Text style={styles.counterText}>{skimmerCount}</Text>
      </View>
      <TouchableOpacity
        style={[styles.counterButton, skimmerCount >= MAX_SKIMMERS && styles.counterButtonDisabled]}
        onPress={() => {
          if (skimmerCount < MAX_SKIMMERS) {
            const newCount = skimmerCount + 1;
            setSkimmerCount(newCount);
            setValue('skimmerCount', newCount);
            handleFieldBlur('skimmerCount', newCount);
          }
        }}
        disabled={skimmerCount >= MAX_SKIMMERS}
      >
        <Ionicons name="add" size={24} color={theme.colors.darkBlue} />
      </TouchableOpacity>
    </View>
    
    {/* Dynamic Skimmer Mini-Sections */}
    {skimmerWatches && Array.from({ length: skimmerCount }).map((_, index) => (
      <SkimmerMiniSection 
        key={index} 
        index={index} 
        handleFieldBlur={handleFieldBlur} 
        control={control} 
        setValue={setValue}
        basketCondition={skimmerWatches[`basket${index}`] || ''}
        lidCondition={skimmerWatches[`lid${index}`] || ''}
      />
    ))}
  </View>
));

const DeckSection = memo(({ 
  control, 
  setValue, 
  deckMaterial, 
  deckCleanliness,
  handleFieldBlur,
  deckPhotos,
  setDeckPhotos,
  session
}: any) => (
  <View>
    {/* AI Deck Analyzer */}
    <View style={styles.aiAnalyzerSection}>
      <Text style={styles.analyzerTitle}>AI Deck Analysis</Text>
      <Text style={styles.analyzerDescription}>
        AI will identify deck surface material and assess condition
      </Text>
      <AIPhotoAnalyzer
        title="Deck Photos"
        description="Capture deck areas around pool"
        maxPhotos={Math.min(6, MAX_PHOTOS_PER_SECTION)}
        onAnalyze={async (photos) => {
          setDeckPhotos(photos);
          
          if (photos.length > 0 && FEATURES.USE_REAL_AI) {
            try {
              const response = await aiService.analyzeDeck(
                photos,
                session?.id || `session_${Date.now()}`
              );
              
              if (response.success && response.analysis) {  // FIX: response.analysis NOT response.data
                const analysis = response.analysis;
                
                // Create mapper
                const mapper = new DeckAnalysisMapper(setValue, control);
                mapper.mapResponseToForm(analysis);
                
                // Handle field blur
                handleFieldBlur('deckMaterial', analysis.material);
                handleFieldBlur('deckCleanliness', analysis.cleanliness);
              }
            } catch (error) {
              console.error('Deck analysis failed:', error);
            }
          }
        }}
        allowBatchAnalysis={true}
      />
    </View>
    
    {/* AI Analysis Status */}
    {deckPhotos && deckPhotos.length > 0 && (
      <View style={styles.aiAnalysisStatus}>
        <LinearGradient
          colors={[theme.colors.aiPink + '20', theme.colors.blueGreen + '20']}
          style={styles.aiStatusGradient}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.aiStatusText}>
            AI Deck Analysis Complete - Deck condition saved for report
          </Text>
        </LinearGradient>
      </View>
    )}
    
    {/* Deck Material */}
    <Text style={styles.fieldLabel}>Deck Surface Material</Text>
    <View style={styles.optionsGrid}>
      {['pavers', 'stamped concrete', 'tile', 'natural stone', 'concrete', 'other'].map((material) => (
        <TouchableOpacity
          key={material}
          style={[
            styles.optionButton,
            deckMaterial === material && styles.optionButtonActive
          ]}
          onPress={() => {
            setValue('deckMaterial', material);
            handleFieldBlur('deckMaterial', material);
          }}
        >
          <Text style={[
            styles.optionText,
            deckMaterial === material && styles.optionTextActive
          ]}>
            {material.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    
    {/* Deck Cleanliness */}
    <Text style={styles.fieldLabel}>Deck Cleanliness</Text>
    <View style={styles.optionsGrid}>
      {['pristine', 'clean', 'dirty', 'filthy'].map((level) => (
        <TouchableOpacity
          key={level}
          style={[
            styles.optionButton,
            deckCleanliness === level && styles.optionButtonActive
          ]}
          onPress={() => {
            setValue('deckCleanliness', level);
            handleFieldBlur('deckCleanliness', level);
          }}
        >
          <Text style={[
            styles.optionText,
            deckCleanliness === level && styles.optionTextActive
          ]}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
));

// Skimmer mini-section component moved outside to prevent initialization issues
interface SkimmerMiniSectionProps {
  index: number;
  handleFieldBlur: (field: string, value: any) => void;
  control: FormControl;
  setValue: UseFormSetValue<PoolDetailsData>;
  basketCondition?: string;
  lidCondition?: string;
}

const SkimmerMiniSection: React.FC<SkimmerMiniSectionProps> = memo(({ 
  index, 
  handleFieldBlur,
  control,
  setValue,
  basketCondition = '',
  lidCondition = ''
}) => {
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
            onPress={() => {
              const fieldName = `skimmer${index + 1}BasketCondition` as any;
              setValue(fieldName, option.value);
              handleFieldBlur(fieldName, option.value);
            }}
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
            onPress={() => {
              const fieldName = `skimmer${index + 1}LidCondition` as any;
              setValue(fieldName, option.value);
              handleFieldBlur(fieldName, option.value);
            }}
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
        name={`skimmer${index + 1}LidModel`}
        render={({ field: { onChange, onBlur, value } }) => (
          <EnhancedFloatingInput
            label="Lid Model #"
            value={value || ''}
            onChangeText={onChange}
            onBlur={() => {
              onBlur();
              handleFieldBlur(`skimmer${index + 1}LidModel`, value || '');
            }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            blurOnSubmit={true}
            editable={true}
            selectTextOnFocus={true}
          />
        )}
      />
    </View>
  );
});

export const PoolDetailsStep: React.FC = () => {
  console.log('=== DIAGNOSTIC START ===');
  console.log('1. Component rendering');
  
  // STEP 1: Get context FIRST
  const { session, updatePoolDetails, nextStep } = useOnboarding();
  
  // STEP 2: Handle loading state properly
  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4EACB2" />
        <Text style={styles.loadingText}>Loading pool details...</Text>
      </View>
    );
  }
  
  // STEP 3: Initialize state hooks AFTER we have session
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'size-shape',
    'surface',
    'environment',
    'skimmers',
    'deck'
  ]);
  const [skimmerCount, setSkimmerCount] = useState(
    session?.poolDetails?.skimmerCount || 0
  );
  const [environmentPhotos, setEnvironmentPhotos] = useState<string[]>([]);
  const [surfacePhotos, setSurfacePhotos] = useState<string[]>([]);
  const [deckPhotos, setDeckPhotos] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    session?.poolDetails?.features || []
  );
  const [isAnalyzingSatellite, setIsAnalyzingSatellite] = useState(false);
  const [satelliteAnalyzed, setSatelliteAnalyzed] = useState(false);
  const [satelliteAnalysisResult, setSatelliteAnalysisResult] = useState<any>(null);
  const [calcTrigger, setCalcTrigger] = useState(0);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isAnalyzingInsights, setIsAnalyzingInsights] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: string]: View | null }>({});
  
  // STEP 4: NOW initialize form with session data
  const formMethods = useForm<PoolDetailsData>({
    resolver: zodResolver(poolDetailsSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
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
      deckMaterial: session?.poolDetails?.deckMaterial || '',
      skimmerCount: session?.poolDetails?.skimmerCount || 0,
    },
  });
  
  // Destructure ALL needed methods at component level
  const { control, handleSubmit, reset, setValue, getValues, trigger, watch, formState: { errors } } = formMethods;
  
  // Continue with the rest of the component...
  
  // Watch ONLY fields that need visual updates - individual watches to prevent destructuring issues
  console.log('5. About to call useWatch');
  const poolType = useWatch({ control, name: 'poolType' }) || '';
  console.log('5a. poolType watch successful');
  const shape = useWatch({ control, name: 'shape' }) || '';
  console.log('5b. shape watch successful');
  const surfaceMaterial = useWatch({ control, name: 'surfaceMaterial' }) || '';
  console.log('5c. surfaceMaterial watch successful');
  const surfaceCondition = useWatch({ control, name: 'surfaceCondition' }) || '';
  console.log('5d. surfaceCondition watch successful');
  const deckMaterial = useWatch({ control, name: 'deckMaterial' }) || '';
  console.log('5e. deckMaterial watch successful');
  const deckCleanliness = useWatch({ control, name: 'deckCleanliness' }) || '';
  console.log('5f. deckCleanliness watch successful');
  const watchedFeatures = useWatch({ control, name: 'features' }) || [];
  console.log('5g. features watch successful');
  
  // Add field save timeout ref and animation frame ref
  const fieldSaveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const animationFrameRef = useRef<number>();
  
  // Type-safe feature management
  const updatePoolFeatures = useCallback((detectedFeatures: {
    hasSpillover?: boolean;
    hasSpa?: boolean;
    hasWaterFeature?: boolean;
  }) => {
    const currentFeatures = getValues('features') || [];
    const featureMap = {
      hasSpillover: 'spillover',
      hasSpa: 'spa',
      hasWaterFeature: 'waterfall'
    };
    
    const newFeatures = [...currentFeatures];
    Object.entries(detectedFeatures).forEach(([key, value]) => {
      const featureName = featureMap[key as keyof typeof featureMap];
      if (value && featureName && !newFeatures.includes(featureName)) {
        newFeatures.push(featureName);
      }
    });
    
    setValue('features', newFeatures, { shouldValidate: true });
  }, [getValues, setValue]);
  
  // Type-safe field validation
  const safeSetValue = useCallback((
    fieldName: keyof PoolDetailsData,
    value: any,
    options?: { shouldValidate?: boolean }
  ) => {
    // Type-safe field setting
    const validFields: (keyof PoolDetailsData)[] = [
      'poolType', 'shape', 'length', 'width', 'avgDepth',
      'deepEndDepth', 'shallowEndDepth', 'volume', 'surfaceArea',
      'surfaceMaterial', 'surfaceCondition', 'features',
      'nearbyTrees', 'treeTypes', 'sprinklerSystem',
      'surfaceStains', 'stainTypes', 'deckCleanliness', 'deckMaterial',
      'skimmerCount'
    ];
    
    if (validFields.includes(fieldName)) {
      setValue(fieldName, value, options);
    } else {
      console.warn(`Attempted to set invalid field: ${fieldName}`);
    }
  }, [setValue]);
  
  // Custom hook for pool calculations
  const calculatedValues = useMemo(() => {
    const values = getValues();
    return calculatePoolMetrics(values);
  }, [getValues, calcTrigger]);
  
  // Load existing data
  useEffect(() => {
    if (session?.poolDetails) {
      reset(session.poolDetails);
      setSelectedFeatures(session.poolDetails.features || []);
      // Only set skimmerCount if it's not already set
      if (skimmerCount === 0 && session.poolDetails.skimmerCount && session.poolDetails.skimmerCount > 0) {
        setSkimmerCount(session.poolDetails.skimmerCount);
      }
    }
  }, [session?.poolDetails, reset]); // Remove skimmerCount from dependencies
  
  // Sync features from form state to local state
  useEffect(() => {
    if (watchedFeatures && Array.isArray(watchedFeatures)) {
      // CRITICAL: Remove length check - empty array is valid state
      setSelectedFeatures(watchedFeatures);
    }
  }, [watchedFeatures]);
  
  // Debug: Verify feature synchronization
  useEffect(() => {
    console.log('[FEATURES DEBUG] watchedFeatures:', watchedFeatures);
    console.log('[FEATURES DEBUG] selectedFeatures:', selectedFeatures);
  }, [watchedFeatures, selectedFeatures]);
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };
  
  // Get dynamic skimmer data - defined before functions that use it
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
    // Get current features from form state, not local state
    const currentFeatures = getValues('features') || [];
    const updated = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];
    
    // Update form state FIRST
    setValue('features', updated, { 
      shouldValidate: true,
      shouldDirty: true 
    });
    
    // Then update local state
    setSelectedFeatures(updated);
    
    // Force immediate save
    handleFieldBlur('features', updated);
    
    console.log('[FEATURES] Toggled:', featureId, 'Updated:', updated);
  };

  // Optimized auto-save with requestAnimationFrame
  const handleFieldBlur = useCallback(async (field: string, value: any) => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Clear any pending save for this field
    if (fieldSaveTimeouts.current[field]) {
      clearTimeout(fieldSaveTimeouts.current[field]);
    }
    
    // Use requestAnimationFrame for visual updates
    animationFrameRef.current = requestAnimationFrame(() => {
      // Trigger recalculation for dimension fields
      if (['length', 'width', 'deepEndDepth', 'shallowEndDepth', 'shape'].includes(field)) {
        setCalcTrigger(prev => prev + 1);
      }
    });
    
    // Debounce the save with longer timeout for better performance
    fieldSaveTimeouts.current[field] = setTimeout(async () => { 
      const allValues = getValues();
      const metrics = calculatePoolMetrics(allValues);
      
      const fullData = {
        ...allValues,
        avgDepth: metrics.avgDepth,
        volume: metrics.volume,
        surfaceArea: metrics.surfaceArea,
        poolType: allValues.poolType,
        type: allValues.poolType,
        features: allValues.features || [], // USE FORM STATE, NOT LOCAL STATE
        skimmerCount,
        ...getSkimmerData(),
      };
      
      try {
        await updatePoolDetails(fullData);
        console.log('✅ Pool details saved');
      } catch (error) {
        console.error('❌ Save failed:', error);
      }
    }, DEBOUNCE_DELAY); // Enterprise-grade debounce timing
  }, [getValues, skimmerCount, updatePoolDetails]);


  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all pending saves on unmount
      Object.values(fieldSaveTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Watch skimmer values individually (max skimmers defined by constant)
  console.log('6. About to call skimmer useWatch hooks');
  const skimmer1Basket = (useWatch({ control, name: 'skimmer1BasketCondition' as any }) || '') as string;
  console.log('6a. skimmer1Basket watch successful');
  const skimmer1Lid = (useWatch({ control, name: 'skimmer1LidCondition' as any }) || '') as string;
  console.log('6b. skimmer1Lid watch successful');
  const skimmer2Basket = (useWatch({ control, name: 'skimmer2BasketCondition' as any }) || '') as string;
  const skimmer2Lid = (useWatch({ control, name: 'skimmer2LidCondition' as any }) || '') as string;
  const skimmer3Basket = (useWatch({ control, name: 'skimmer3BasketCondition' as any }) || '') as string;
  const skimmer3Lid = (useWatch({ control, name: 'skimmer3LidCondition' as any }) || '') as string;
  const skimmer4Basket = (useWatch({ control, name: 'skimmer4BasketCondition' as any }) || '') as string;
  const skimmer4Lid = (useWatch({ control, name: 'skimmer4LidCondition' as any }) || '') as string;
  const skimmer5Basket = (useWatch({ control, name: 'skimmer5BasketCondition' as any }) || '') as string;
  const skimmer5Lid = (useWatch({ control, name: 'skimmer5LidCondition' as any }) || '') as string;
  console.log('6c. All skimmer watches successful');
  
  // Create watches array from individual hooks
  const skimmerWatches = useMemo(() => ({
    basket0: skimmer1Basket,
    lid0: skimmer1Lid,
    basket1: skimmer2Basket,
    lid1: skimmer2Lid,
    basket2: skimmer3Basket,
    lid2: skimmer3Lid,
    basket3: skimmer4Basket,
    lid3: skimmer4Lid,
    basket4: skimmer5Basket,
    lid4: skimmer5Lid,
  }), [skimmer1Basket, skimmer1Lid, skimmer2Basket, skimmer2Lid, skimmer3Basket, skimmer3Lid, skimmer4Basket, skimmer4Lid, skimmer5Basket, skimmer5Lid]);

  console.log('6d. skimmerWatches created:', Object.keys(skimmerWatches || {}));

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

  const handleSatelliteAnalysis = useCallback(async () => {
    console.log('🎯 [PoolDetailsStep] Starting satellite analysis with features:', {
      USE_REAL_AI: FEATURES.USE_REAL_AI,
      AI_SATELLITE_ANALYSIS: FEATURES.AI_SATELLITE_ANALYSIS,
      apiUrl: apiClient.baseURL || 'N/A'
    });
    
    try {
      // Validation
      const customerInfo = session?.customerInfo;
      if (!customerInfo?.address || !customerInfo?.city || !customerInfo?.state) {
        throw new Error('Complete customer address is required for satellite analysis');
      }

      setIsAnalyzingSatellite(true);
      setSatelliteAnalysisResult(null);
      const fullAddress = `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zipCode || ''}`.trim();
      
      console.log('📡 [PoolDetailsStep] Calling satelliteAnalyzer.analyzePoolFromAddress...');
      const result = await satelliteAnalyzer.analyzePoolFromAddress(
        fullAddress,
        session?.id || 'temp-session'
      );
      console.log('📊 [PoolDetailsStep] Analysis result:', result);
      
      if (result.success && result.analysis.poolDetected) {
        const { poolDimensions, poolShape, poolFeatures, poolType } = result.analysis;
        
        // ADD THIS BLOCK:
        if (poolType && ['inground', 'above_ground'].includes(poolType)) {
          try {
            const formValue = poolType === 'above_ground' ? 'aboveGround' : 'inground';
            setValue('poolType', formValue, { shouldValidate: true, shouldDirty: true });
            
            // Force the watch to update
            handleFieldBlur('poolType', formValue);
            
            console.log('✅ AI detected pool type:', poolType, '-> Form value:', formValue);
          } catch (error) {
            console.warn('Could not set pool type from AI:', error);
          }
        }
        
        if (poolDimensions) {
          setValue('length', poolDimensions.length, { shouldValidate: true });
          setValue('width', poolDimensions.width, { shouldValidate: true });
          setValue('surfaceArea', poolDimensions.surfaceArea, { shouldValidate: true });
        }
        
        if (poolShape) {
          setValue('shape', poolShape, { shouldValidate: true });
        }
        
        if (poolFeatures) {
          updatePoolFeatures({
            hasSpillover: poolFeatures.hasSpillover,
            hasSpa: poolFeatures.hasSpa,
            hasWaterFeature: poolFeatures.hasWaterFeature
          });
        }
        
        if (result.analysis.propertyFeatures?.treeCount) {
          setValue('nearbyTrees', true);
          setValue('treeTypes', `Detected ${result.analysis.propertyFeatures.treeCount} trees nearby`);
        }
        
        const shallowDepth = watch('shallowDepth');
        const deepDepth = watch('deepDepth');
        
        if (poolDimensions && shallowDepth && deepDepth) {
          const avgDepth = satelliteAnalyzer.calculateAverageDepth(
            parseFloat(shallowDepth),
            parseFloat(deepDepth)
          );
          const gallons = satelliteAnalyzer.calculateGallons(
            poolDimensions.surfaceArea,
            avgDepth
          );
          setValue('gallons', gallons, { shouldValidate: true });
        }
        
        setSatelliteAnalyzed(true);
        setSatelliteAnalysisResult({
          success: true,
          confidence: Math.round(result.analysis.confidence * 100),
          message: `Pool detected: ${poolDimensions?.length}' x ${poolDimensions?.width}' ${poolShape}`,
          surfaceArea: poolDimensions?.surfaceArea
        });
        
        await updatePoolDetails(getValues());
        
      } else {
        setSatelliteAnalysisResult({
          success: false,
          message: 'No pool detected in satellite imagery'
        });
      }
    } catch (error) {
      console.error('Satellite analysis error:', error);
      
      // Proper error typing
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to analyze satellite imagery';
      
      setSatelliteAnalysisResult({
        success: false,
        message: errorMessage
      });
      
      // Report to error tracking service
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error);
      }
    } finally {
      setIsAnalyzingSatellite(false);
      setTimeout(() => setSatelliteAnalysisResult(null), 5000);
    }
  }, [session, setValue, getValues, watch, updatePoolDetails, updatePoolFeatures]);
  
  
  console.log('7. About to render component');
  
  return (
    <PoolDetailsErrorBoundary fallback={<PoolDetailsErrorFallback />}>
      <FormProvider {...formMethods}>
        <PerformanceMonitor />
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
        {/* Calculated Metrics Display */}
        {calculatedValues.volume > 0 && (
          <View style={styles.metricsCard}>
            <Text style={styles.metricsTitle}>Pool Calculations</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Average Depth</Text>
                <Text style={styles.metricValue}>{calculatedValues.avgDepth.toFixed(1)} ft</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Surface Area</Text>
                <Text style={styles.metricValue}>{calculatedValues.surfaceArea.toLocaleString()} sq ft</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Volume</Text>
                <Text style={styles.metricValue}>{calculatedValues.volume.toLocaleString()} gal</Text>
              </View>
            </View>
          </View>
        )}
        
        {POOL_SECTIONS.map((section) => (
          <View 
            key={section.id} 
            style={styles.section}
            ref={(ref) => { if (ref) sectionRefs.current[section.id] = ref; }}
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
                {section.id === 'size-shape' && (
                  <SizeShapeSection 
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    poolType={poolType}
                    shape={shape}
                    handleFieldBlur={handleFieldBlur}
                    isAnalyzingSatellite={isAnalyzingSatellite}
                    satelliteAnalyzed={satelliteAnalyzed}
                    satelliteAnalysisResult={satelliteAnalysisResult}
                    handleSatelliteAnalysis={handleSatelliteAnalysis}
                    selectedFeatures={selectedFeatures}
                    toggleFeature={toggleFeature}
                    session={session}
                  />
                )}
                {section.id === 'surface' && (
                  <SurfaceSection 
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    surfaceMaterial={surfaceMaterial}
                    surfaceCondition={surfaceCondition}
                    handleFieldBlur={handleFieldBlur}
                    surfacePhotos={surfacePhotos}
                    setSurfacePhotos={setSurfacePhotos}
                    session={session}
                    watch={watch}
                  />
                )}
                {section.id === 'environment' && (
                  <EnvironmentSection 
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    handleFieldBlur={handleFieldBlur}
                    environmentPhotos={environmentPhotos}
                    setEnvironmentPhotos={setEnvironmentPhotos}
                    session={session}
                  />
                )}
                {section.id === 'skimmers' && (
                  <SkimmersSection 
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    skimmerCount={skimmerCount}
                    setSkimmerCount={setSkimmerCount}
                    handleFieldBlur={handleFieldBlur}
                    skimmerWatches={skimmerWatches}
                    session={session}
                  />
                )}
                {section.id === 'deck' && (
                  <DeckSection 
                    control={control}
                    setValue={setValue}
                    deckMaterial={deckMaterial}
                    deckCleanliness={deckCleanliness}
                    handleFieldBlur={handleFieldBlur}
                    deckPhotos={deckPhotos}
                    setDeckPhotos={setDeckPhotos}
                    session={session}
                  />
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
      </FormProvider>
    </PoolDetailsErrorBoundary>
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
    marginBottom: 8, // Reduced from theme.spacing.sm
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
    width: '15%',  // Changed from '23%'
    aspectRatio: 1,
    margin: '1%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,  // Reduced from 4
  },
  shapeButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  shapeButtonText: {
    fontSize: 8,  // Reduced from 9
    color: theme.colors.gray,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 1,  // Reduced from 2
  },
  shapeIcon: {
    marginBottom: 0,  // Reduced spacing
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
    paddingVertical: 4, // Reduced vertical padding for tighter spacing
    marginTop: theme.spacing.lg,  // CHANGED from no marginTop
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
  counterButtonDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.grayLight,
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
  aiResultsText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    lineHeight: 22,
  },
  aiAnalysisStatus: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  aiStatusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  aiStatusText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    fontWeight: '500',
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
  // Missing styles for counter
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  counterDisplay: {
    minWidth: 60,
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
  },
  counterText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.darkBlue,
  },
  // Missing styles for options
  optionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  // Missing styles for features
  featureLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginLeft: theme.spacing.xs,
  },
  // Missing styles for metrics card
  metricsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metricsTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '700',
    color: theme.colors.blueGreen,
  },
  // Error boundary styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
  },
  errorText: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '600',
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  errorDetails: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.blueGreen,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  retryText: {
    color: theme.colors.white,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  satelliteSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(78, 172, 178, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 172, 178, 0.2)',
  },
  satelliteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  satelliteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: 8,
  },
  satelliteDescription: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 16,
  },
  satelliteButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
  },
  satelliteButtonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  satelliteButtonDisabled: {
    opacity: 0.7,
  },
  satelliteButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  satelliteResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  satelliteResultText: {
    marginLeft: 8,
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  
  // Surface Issues Styles
  issuesContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingTop: 0, // Remove top padding
    marginTop: 0, // Remove top margin
  },
  issueRow: {
    marginBottom: 8, // Reduced from 12 to 8 for tighter spacing
  },
  severityOptions: {
    flexDirection: 'row',
    marginLeft: 32, // Indent under checkbox
    gap: theme.spacing.sm,
  },
  severityButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  severityButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  severityText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  severityTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  roughnessOptions: {
    marginLeft: 32,
    marginRight: theme.spacing.md,
  },
  roughnessButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginVertical: theme.spacing.sm,
  },
  roughnessButton: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roughnessButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  roughnessButtonText: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  roughnessButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  scaleLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -theme.spacing.xs,
  },
  scaleLabelText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
  },
});