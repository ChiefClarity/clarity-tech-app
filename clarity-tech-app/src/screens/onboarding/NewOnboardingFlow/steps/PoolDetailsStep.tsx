import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ModernInput } from '../../../../components/ui/ModernInput';
import { ModernSelect } from '../../../../components/ui/ModernSelect';
import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';

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

const FEATURES = [
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
  
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PoolDetailsData>({
    resolver: zodResolver(poolDetailsSchema),
    defaultValues: session?.poolDetails || {
      poolType: 'inground',
      shape: 'rectangle',
      length: 0,
      width: 0,
      depth: 0,
      volume: 0,
      surfaceMaterial: 'plaster',
      surfaceCondition: 'good',
      features: [],
      nearbyTrees: false,
      grassOrDirt: 'grass',
      sprinklerSystem: false,
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
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Pool Details</Text>
        <Text style={styles.subtitle}>Describe the pool specifications</Text>
      </View>
      
      <View style={styles.form}>
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
                      size={24}
                      color={value === shape.value ? theme.colors.white : theme.colors.gray}
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
                    onChangeText={onChange}
                    onBlur={onBlur}
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
                    onChangeText={onChange}
                    onBlur={onBlur}
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
                    onChangeText={onChange}
                    onBlur={onBlur}
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
                placeholder="Select surface material"
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
            {FEATURES.map((feature) => (
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
      
      {/* Hidden submit button */}
      <View style={{ height: 0, overflow: 'hidden' }}>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} />
      </View>
    </ScrollView>
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
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
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
    gap: theme.spacing.sm,
  },
  shapeButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  shapeButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  shapeButtonText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
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
});