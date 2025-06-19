import React, { useState, useRef, useEffect, useCallback, memo, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useForm, Controller, useFormContext, FormProvider, useWatch, Control, UseFormSetValue, UseFormGetValues, FieldErrors } from 'react-hook-form';
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
    console.error('PoolDetailsStep Error:', error, errorInfo);
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
    <ModernInput
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
  toggleFeature
}: any) => (
  <View>
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
    <View style={styles.typeButtons}>
      <TouchableOpacity
        style={[styles.typeButton, poolType === 'inground' && styles.typeButtonActive]}
        onPress={() => {
          setValue('poolType', 'inground');
          handleFieldBlur('poolType', 'inground');
        }}
      >
        <Text style={[styles.typeButtonText, poolType === 'inground' && styles.typeButtonTextActive]}>
          In-Ground
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.typeButton, poolType === 'aboveGround' && styles.typeButtonActive]}
        onPress={() => {
          setValue('poolType', 'aboveGround');
          handleFieldBlur('poolType', 'aboveGround');
        }}
      >
        <Text style={[styles.typeButtonText, poolType === 'aboveGround' && styles.typeButtonTextActive]}>
          Above Ground
        </Text>
      </TouchableOpacity>
    </View>
    
    {/* Pool Shape */}
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
            size={24}
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
  setSurfacePhotos
}: any) => (
  <View>
    {/* AI Surface Analyzer */}
    <View style={styles.aiAnalyzerSection}>
      <Text style={styles.analyzerTitle}>AI Surface Analysis</Text>
      <Text style={styles.analyzerDescription}>
        Take photos of pool surface for AI to identify material type and condition
      </Text>
      <AIPhotoAnalyzer
        title="Surface Photos"
        description="Capture pool surface from multiple angles"
        maxPhotos={Math.min(6, MAX_PHOTOS_PER_SECTION)}
        onAnalyze={async (photos) => {
          setSurfacePhotos(photos);
          // Mock AI surface analysis
          setValue('surfaceMaterial', 'pebble');
          setValue('surfaceCondition', 'good');
          handleFieldBlur('surfaceMaterial', 'pebble');
        }}
        allowBatchAnalysis={true}
      />
    </View>
    
    {/* Surface Material */}
    <Text style={styles.fieldLabel}>Surface Material</Text>
    <View style={styles.optionsGrid}>
      {SURFACE_MATERIALS.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.optionButton,
            surfaceMaterial === type.value && styles.optionButtonActive
          ]}
          onPress={() => {
            setValue('surfaceMaterial', type.value as any);
            handleFieldBlur('surfaceMaterial', type.value);
          }}
        >
          <Text style={[
            styles.optionText,
            surfaceMaterial === type.value && styles.optionTextActive
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    
    {/* Surface Condition */}
    <Text style={styles.fieldLabel}>Surface Condition</Text>
    <View style={styles.conditionGrid}>
      {CONDITION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.conditionOption,
            surfaceCondition === option.value && { 
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
            surfaceCondition === option.value && { 
              color: option.color, 
              fontWeight: '600' 
            }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    
    {/* Surface Stains */}
    <Controller
      control={control}
      name="surfaceStains"
      render={({ field: { onChange, value } }) => (
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => {
            onChange(!value);
            handleFieldBlur('surfaceStains', !value);
          }}
        >
          <View style={[styles.checkbox, value && styles.checkboxChecked]}>
            {value && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>Surface has visible stains</Text>
        </TouchableOpacity>
      )}
    />
    
    {control._formValues?.surfaceStains && (
      <Controller
        control={control}
        name="stainTypes"
        render={({ field: { onChange, value } }) => (
          <UncontrolledInput
            label="Describe stains"
            initialValue={value || ''}
            onBlurValue={(text: string) => {
              onChange(text);
              handleFieldBlur('stainTypes', text);
            }}
            multiline
          />
        )}
      />
    )}
  </View>
));

const EnvironmentSection = memo(({ 
  control, 
  errors, 
  setValue, 
  handleFieldBlur,
  environmentPhotos,
  setEnvironmentPhotos
}: any) => (
  <View>
    {/* AI Environment Analyzer */}
    <View style={styles.aiAnalyzerSection}>
      <Text style={styles.analyzerTitle}>AI Environment Analysis</Text>
      <Text style={styles.analyzerDescription}>
        Capture photos of the pool surroundings for environmental assessment
      </Text>
      <AIPhotoAnalyzer
        title="Environment Photos"
        description="Include trees, landscaping, and surrounding areas"
        maxPhotos={Math.min(8, MAX_PHOTOS_PER_SECTION)}
        onAnalyze={async (photos) => {
          setEnvironmentPhotos(photos);
          // Mock AI environment analysis
          setValue('nearbyTrees', true);
          setValue('grassOrDirt', 'both');
          handleFieldBlur('nearbyTrees', true);
        }}
        allowBatchAnalysis={true}
      />
    </View>
    
    {/* Nearby Trees */}
    <Controller
      control={control}
      name="nearbyTrees"
      render={({ field: { onChange, value } }) => (
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => {
            onChange(!value);
            handleFieldBlur('nearbyTrees', !value);
          }}
        >
          <View style={[styles.checkbox, value && styles.checkboxChecked]}>
            {value && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>Trees near pool</Text>
        </TouchableOpacity>
      )}
    />
    
    {control._formValues?.nearbyTrees && (
      <Controller
        control={control}
        name="treeTypes"
        render={({ field: { onChange, value } }) => (
          <UncontrolledInput
            label="Types of trees"
            initialValue={value || ''}
            onBlurValue={(text: string) => {
              onChange(text);
              handleFieldBlur('treeTypes', text);
            }}
            placeholder="e.g., Oak, Pine, Palm"
          />
        )}
      />
    )}
    
    {/* Grass or Dirt */}
    <Text style={styles.fieldLabel}>Surrounding Ground</Text>
    <Controller
      control={control}
      name="grassOrDirt"
      render={({ field: { onChange, value } }) => (
        <View style={styles.optionsRow}>
          {['grass', 'dirt', 'both'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                value === option && styles.optionButtonActive
              ]}
              onPress={() => {
                onChange(option);
                handleFieldBlur('grassOrDirt', option);
              }}
            >
              <Text style={[
                styles.optionText,
                value === option && styles.optionTextActive
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    />
    
    {/* Sprinkler System */}
    <Controller
      control={control}
      name="sprinklerSystem"
      render={({ field: { onChange, value } }) => (
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => {
            onChange(!value);
            handleFieldBlur('sprinklerSystem', !value);
          }}
        >
          <View style={[styles.checkbox, value && styles.checkboxChecked]}>
            {value && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>Sprinkler system present</Text>
        </TouchableOpacity>
      )}
    />
  </View>
));

const SkimmersSection = memo(({ 
  control, 
  errors, 
  setValue, 
  skimmerCount, 
  setSkimmerCount,
  handleFieldBlur
}: any) => (
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
          // Mock AI skimmer detection
          const detectedCount = Math.floor(Math.random() * 3) + 1;
          setSkimmerCount(detectedCount);
          setValue('skimmerCount', detectedCount);
          handleFieldBlur('skimmerCount', detectedCount);
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
    {Array.from({ length: skimmerCount }).map((_, index) => (
      <SkimmerMiniSection 
        key={index} 
        index={index} 
        handleFieldBlur={handleFieldBlur} 
        control={control} 
        setValue={setValue}
        basketCondition={skimmerWatches[`basket${index}`]}
        lidCondition={skimmerWatches[`lid${index}`]}
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
  setDeckPhotos
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
          // Mock AI deck analysis
          const materials = ['pavers', 'stamped concrete', 'tile', 'natural stone', 'concrete'];
          const detectedMaterial = materials[Math.floor(Math.random() * materials.length)];
          setValue('deckMaterial', detectedMaterial);
          setValue('deckCleanliness', 'clean');
          handleFieldBlur('deckMaterial', detectedMaterial);
        }}
        allowBatchAnalysis={true}
      />
    </View>
    
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
              const fieldName = `skimmer${index + 1}BasketCondition`;
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
              const fieldName = `skimmer${index + 1}LidCondition`;
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

export const PoolDetailsStep: React.FC = () => {
  console.log('=== DIAGNOSTIC START ===');
  console.log('1. Component rendering');
  console.log('2. Hooks available:', {
    useOnboarding: typeof useOnboarding,
    useForm: typeof useForm,
    useWatch: typeof useWatch
  });
  
  // Add safety check for context availability
  const onboardingContext = useOnboarding();
  if (!onboardingContext) {
    console.error('useOnboarding hook not available');
    return <View><Text>Loading...</Text></View>;
  }
  
  const { session, updatePoolDetails, nextStep } = onboardingContext;
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
    mode: 'onChange', // Important for visual updates
    reValidateMode: 'onBlur',
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
      deckMaterial: session?.poolDetails?.deckMaterial || '',
      skimmerCount: session?.poolDetails?.skimmerCount || 0,
    },
  });
  
  const { control, handleSubmit, reset, setValue, getValues, formState: { errors } } = formMethods;
  
  console.log('3. Form initialized:', !!control);
  console.log('4. Form methods:', Object.keys(formMethods));
  
  // Safety check for form methods
  if (!control || !setValue || !getValues) {
    console.error('Form methods not properly initialized');
    return <View><Text>Form loading...</Text></View>;
  }
  
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
  
  // Add field save timeout ref and animation frame ref
  const fieldSaveTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const animationFrameRef = useRef<number>();
  
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
      console.log(`💾 Saving ${field}:`, value);
      
      const allValues = getValues();
      const metrics = calculatePoolMetrics(allValues);
      
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
    }, DEBOUNCE_DELAY); // Enterprise-grade debounce timing
  }, [getValues, selectedFeatures, skimmerCount, updatePoolDetails, getSkimmerData]);

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

  // Watch skimmer values individually (max skimmers defined by constant)
  console.log('6. About to call skimmer useWatch hooks');
  const skimmer1Basket = useWatch({ control, name: 'skimmer1BasketCondition' }) || '';
  console.log('6a. skimmer1Basket watch successful');
  const skimmer1Lid = useWatch({ control, name: 'skimmer1LidCondition' }) || '';
  console.log('6b. skimmer1Lid watch successful');
  const skimmer2Basket = useWatch({ control, name: 'skimmer2BasketCondition' }) || '';
  const skimmer2Lid = useWatch({ control, name: 'skimmer2LidCondition' }) || '';
  const skimmer3Basket = useWatch({ control, name: 'skimmer3BasketCondition' }) || '';
  const skimmer3Lid = useWatch({ control, name: 'skimmer3LidCondition' }) || '';
  const skimmer4Basket = useWatch({ control, name: 'skimmer4BasketCondition' }) || '';
  const skimmer4Lid = useWatch({ control, name: 'skimmer4LidCondition' }) || '';
  const skimmer5Basket = useWatch({ control, name: 'skimmer5BasketCondition' }) || '';
  const skimmer5Lid = useWatch({ control, name: 'skimmer5LidCondition' }) || '';
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
                  />
                )}
              </View>
            )}
          </View>
        ))}
        
        <AIInsightsBox stepName="poolDetails" />
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
});