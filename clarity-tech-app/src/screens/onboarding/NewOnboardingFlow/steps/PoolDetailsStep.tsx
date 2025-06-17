import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ModernInput } from '../../../../components/ui/ModernInput';
import { ModernSelect } from '../../../../components/ui/ModernSelect';
import { AIInsightsBox } from '../../../../components/common/AIInsightsBox';
import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';
import { FEATURES, AI_ENDPOINTS } from '../../../../config/features';

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
  depth: z.coerce.number().min(1).max(20),
  avgDepth: z.coerce.number().optional(),
  deepEndDepth: z.coerce.number().optional(),
  shallowEndDepth: z.coerce.number().optional(),
  volume: z.coerce.number().min(1),
  surfaceArea: z.coerce.number().optional(),
  surfaceMaterial: z.enum(['plaster', 'pebble', 'tile', 'vinyl', 'fiberglass', 'other']),
  surfaceCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  features: z.array(z.string()),
  nearbyTrees: z.boolean(),
  treeTypes: z.string().optional(),
  grassOrDirt: z.enum(['grass', 'dirt', 'both']),
  sprinklerSystem: z.boolean(),
});

type PoolDetailsData = z.infer<typeof poolDetailsSchema>;

export const PoolDetailsStep: React.FC = () => {
  const { session, updatePoolDetails, nextStep } = useOnboarding();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isAnalyzingSatellite, setIsAnalyzingSatellite] = useState(false);
  const [satelliteAnalyzed, setSatelliteAnalyzed] = useState(false);
  const [satelliteAnalysisResult, setSatelliteAnalysisResult] = useState<any>(null);
  
  const { control, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm<PoolDetailsData>({
    resolver: zodResolver(poolDetailsSchema),
    defaultValues: {
      type: session?.poolDetails?.type || 'inground',
      shape: session?.poolDetails?.shape || 'rectangle',
      length: session?.poolDetails?.length || 0,
      width: session?.poolDetails?.width || 0,
      avgDepth: session?.poolDetails?.avgDepth || 0,
      deepEndDepth: session?.poolDetails?.deepEndDepth || 0,
      shallowEndDepth: session?.poolDetails?.shallowEndDepth || 0,
      volume: session?.poolDetails?.volume || 0,
      surfaceArea: session?.poolDetails?.surfaceArea || 0,
      surfaceMaterial: session?.poolDetails?.surfaceMaterial || '',
      surfaceCondition: session?.poolDetails?.surfaceCondition || '',
      surfaceAge: session?.poolDetails?.surfaceAge || 0,
      surfaceStains: session?.poolDetails?.surfaceStains || false,
      tileCondition: session?.poolDetails?.tileCondition || '',
      tileChips: session?.poolDetails?.tileChips || false,
      caulkingCondition: session?.poolDetails?.caulkingCondition || '',
      expansionJointCondition: session?.poolDetails?.expansionJointCondition || '',
      features: session?.poolDetails?.features || [],
      deckMaterial: session?.poolDetails?.environment?.deckMaterial || '',
      fenceType: session?.poolDetails?.environment?.fenceType || '',
      gateCondition: session?.poolDetails?.environment?.gateCondition || '',
      nearbyTrees: session?.poolDetails?.environment?.nearbyTrees || false,
      treeTypes: session?.poolDetails?.environment?.treeType || '',
      grassType: session?.poolDetails?.environment?.grassType || '',
      sprinklerSystem: session?.poolDetails?.environment?.sprinklerSystem || false,
      sunExposure: session?.poolDetails?.environment?.sunExposure || '',
    },
  });
  
  const formValues = watch();
  
  // Load existing data
  useEffect(() => {
    if (session?.poolDetails) {
      reset(session.poolDetails);
      setSelectedFeatures(session.poolDetails.features || []);
    }
  }, [session?.poolDetails, reset]);
  
  // Calculate volume when dimensions change
  useEffect(() => {
    const { length, width, depth, shape } = formValues;
    if (length && width && depth) {
      let volume = 0;
      
      switch (shape) {
        case 'rectangle':
          volume = length * width * depth * 7.48; // Convert cubic feet to gallons
          break;
        case 'oval':
          volume = Math.PI * (length / 2) * (width / 2) * depth * 7.48;
          break;
        case 'kidney':
        case 'freeform':
          // Approximate as 85% of rectangular volume
          volume = length * width * depth * 7.48 * 0.85;
          break;
        default:
          volume = length * width * depth * 7.48;
      }
      
      setValue('volume', Math.round(volume));
      setValue('surfaceArea', Math.round(length * width));
    }
  }, [formValues.length, formValues.width, formValues.depth, formValues.shape, setValue]);
  
  const onSubmit = async (data: PoolDetailsData) => {
    try {
      const dataWithFeatures = { ...data, features: selectedFeatures };
      await updatePoolDetails(dataWithFeatures);
      // Navigation is handled by NavigationButtons component
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
  };

  // Auto-save on field blur
  const handleFieldBlur = async (field: string, value: any) => {
    // Save current form state
    const allValues = getValues();
    try {
      await updatePoolDetails(allValues);
    } catch (error) {
      console.error('Failed to save pool details:', error);
    }
  };

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
      
      // Calculate volume if depths are available
      const shallowDepth = getValues('shallowEndDepth') || 3;
      const deepDepth = getValues('deepEndDepth') || 8;
      const avgDepth = (shallowDepth + deepDepth) / 2;
      const volume = result.surfaceArea * avgDepth * 7.48;
      setValue('volume', Math.round(volume));
      setValue('avgDepth', avgDepth);
      
      setSatelliteAnalyzed(true);
      setSatelliteAnalysisResult({
        success: true,
        confidence: Math.round(result.confidence * 100),
        surfaceArea: result.surfaceArea,
        message: `Pool detected: ${result.length}' x ${result.width}' ${result.shape}`
      });
      
      // Save the data
      const values = getValues();
      await updatePoolDetails(values);
      
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
  
  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[theme.colors.blueGreen, theme.colors.darkBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Pool Details</Text>
        <Text style={styles.headerSubtitle}>
          Let's capture your pool specifications
        </Text>
      </LinearGradient>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* AI Satellite Analysis */}
        <View style={styles.analysisCard}>
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
        <View style={styles.detailsCard}>
        {/* Pool Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pool Type</Text>
          <Controller
            control={control}
            name="poolType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, value === 'inground' && styles.typeButtonActive]}
                  onPress={() => onChange('inground')}
                >
                  <Text style={[styles.typeButtonText, value === 'inground' && styles.typeButtonTextActive]}>
                    In-Ground
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, value === 'aboveGround' && styles.typeButtonActive]}
                  onPress={() => onChange('aboveGround')}
                >
                  <Text style={[styles.typeButtonText, value === 'aboveGround' && styles.typeButtonTextActive]}>
                    Above Ground
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
        
        {/* Pool Shape */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pool Shape</Text>
          <Controller
            control={control}
            name="shape"
            render={({ field: { onChange, value } }) => (
              <View style={styles.shapeGrid}>
                {POOL_SHAPES.map((shape) => (
                  <TouchableOpacity
                    key={shape.value}
                    style={[styles.shapeButton, value === shape.value && styles.shapeButtonActive]}
                    onPress={() => onChange(shape.value)}
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
        </View>
        
        {/* Dimensions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimensions</Text>
          <View style={styles.row}>
            <View style={styles.thirdField}>
              <Controller
                control={control}
                name="length"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label="Length"
                    value={String(value || '')}
                    onChangeText={(text) => onChange(parseFloat(text) || 0)}
                    onBlur={() => handleFieldBlur('length', value)}
                    error={errors.length?.message}
                    keyboardType="numeric"
                    suffix="ft"
                  />
                )}
              />
            </View>
            <View style={styles.thirdField}>
              <Controller
                control={control}
                name="width"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label="Width"
                    value={String(value || '')}
                    onChangeText={(text) => onChange(parseFloat(text) || 0)}
                    onBlur={() => handleFieldBlur('width', value)}
                    error={errors.width?.message}
                    keyboardType="numeric"
                    suffix="ft"
                  />
                )}
              />
            </View>
            <View style={styles.thirdField}>
              <Controller
                control={control}
                name="depth"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label="Avg Depth"
                    value={String(value || '')}
                    onChangeText={(text) => onChange(parseFloat(text) || 0)}
                    onBlur={() => handleFieldBlur('depth', value)}
                    error={errors.depth?.message}
                    keyboardType="numeric"
                    suffix="ft"
                  />
                )}
              />
            </View>
          </View>
          
          {/* Calculated Volume */}
          {formValues.volume > 0 && (
            <View style={styles.calculatedField}>
              <Text style={styles.calculatedLabel}>Estimated Volume</Text>
              <Text style={styles.calculatedValue}>
                {formValues.volume.toLocaleString()} gallons
              </Text>
            </View>
          )}
        </View>
        
        {/* Surface Material */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Surface Material</Text>
          <Controller
            control={control}
            name="surfaceMaterial"
            render={({ field: { onChange, value } }) => (
              <ModernSelect
                value={value}
                onValueChange={onChange}
                items={SURFACE_MATERIALS}
              />
            )}
          />
          
          <Controller
            control={control}
            name="surfaceCondition"
            render={({ field: { onChange, value } }) => (
              <View style={styles.conditionButtons}>
                {['excellent', 'good', 'fair', 'poor'].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.conditionButton,
                      value === condition && styles.conditionButtonActive,
                      value === condition && { backgroundColor: getConditionColor(condition) }
                    ]}
                    onPress={() => onChange(condition)}
                  >
                    <Text style={[
                      styles.conditionButtonText,
                      value === condition && styles.conditionButtonTextActive
                    ]}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>
        
        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pool Features</Text>
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
        </View>
        
        {/* Environment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment</Text>
          
          <Controller
            control={control}
            name="nearbyTrees"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Trees near pool</Text>
              </TouchableOpacity>
            )}
          />
          
          <Controller
            control={control}
            name="sprinklerSystem"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Sprinkler system present</Text>
              </TouchableOpacity>
            )}
          />
        </View>
        </View>
        
        {/* AI Insights */}
        <AIInsightsBox stepName="poolDetails" />
      </ScrollView>
    </View>
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
  detailsCard: {
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
  form: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
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
    color: theme.colors.text,
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
  calculatedField: {
    backgroundColor: theme.colors.seaFoam + '30',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    alignItems: 'center',
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
  conditionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  conditionButtonActive: {
    borderWidth: 0,
  },
  conditionButtonText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  conditionButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
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
  analysisCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
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
    color: theme.colors.text,
    flex: 1,
  },
});