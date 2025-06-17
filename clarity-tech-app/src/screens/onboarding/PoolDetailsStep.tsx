import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModernInput } from '../../components/ui/ModernInput';
import { GradientButton } from '../../components/ui/GradientButton';
import { Card } from '../../components/ui/Card';
import { theme } from '../../styles/theme';
import { PoolDetails } from '../../types';
import { POOL_FEATURES } from '../../constants/api';

const poolDetailsSchema = z.object({
  type: z.enum(['inground', 'above_ground']),
  shape: z.enum(['rectangle', 'oval', 'round', 'freeform', 'lap', 'other']),
  length: z.number().min(1),
  width: z.number().min(1),
  avgDepth: z.number().min(1),
  deepEndDepth: z.number().min(1),
  shallowEndDepth: z.number().min(1),
  surfaceMaterial: z.enum(['plaster', 'pebble', 'tile', 'vinyl', 'fiberglass', 'other']),
  surfaceCondition: z.enum(['excellent', 'good', 'fair', 'poor']),
  surfaceStains: z.boolean(),
  deckMaterial: z.string(),
  fenceType: z.string(),
  nearbyTrees: z.boolean(),
  treeType: z.string().optional(),
});

type PoolDetailsFormData = z.infer<typeof poolDetailsSchema>;

interface PoolDetailsStepProps {
  data: any;
  onNext: (data: PoolDetails) => void;
  onBack: () => void;
}

export const PoolDetailsStep: React.FC<PoolDetailsStepProps> = ({
  data,
  onNext,
  onBack,
}) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    data.poolDetails?.features || []
  );
  const [poolType, setPoolType] = useState(data.poolDetails?.type || 'inground');
  const [poolShape, setPoolShape] = useState(data.poolDetails?.shape || 'rectangle');
  const [surfaceMaterial, setSurfaceMaterial] = useState(data.poolDetails?.surfaceMaterial || 'plaster');
  const [surfaceCondition, setSurfaceCondition] = useState(data.poolDetails?.surfaceCondition || 'good');
  const [surfaceStains, setSurfaceStains] = useState(data.poolDetails?.surfaceStains || false);
  const [nearbyTrees, setNearbyTrees] = useState(data.poolDetails?.environment?.nearbyTrees || false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PoolDetailsFormData>({
    resolver: zodResolver(poolDetailsSchema),
    defaultValues: data.poolDetails || {
      length: 0,
      width: 0,
      avgDepth: 0,
      deepEndDepth: 0,
      shallowEndDepth: 0,
      deckMaterial: '',
      fenceType: '',
      treeType: '',
    },
  });

  const length = watch('length');
  const width = watch('width');
  const avgDepth = watch('avgDepth');

  // Calculate volume automatically
  const volume = length && width && avgDepth ? Math.round(length * width * avgDepth * 7.48) : 0;

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const parseFloat = (value: string) => {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const onSubmit = (formData: PoolDetailsFormData) => {
    const poolDetails: PoolDetails = {
      type: poolType,
      shape: poolShape,
      length: formData.length,
      width: formData.width,
      avgDepth: formData.avgDepth,
      deepEndDepth: formData.deepEndDepth,
      shallowEndDepth: formData.shallowEndDepth,
      volume,
      surfaceMaterial,
      surfaceCondition,
      surfaceStains,
      features: selectedFeatures,
      environment: {
        nearbyTrees,
        treeType: formData.treeType,
        deckMaterial: formData.deckMaterial,
        fenceType: formData.fenceType,
      },
    };
    onNext(poolDetails);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.section} variant="glass">
        <Text style={styles.sectionTitle}>Pool Type & Shape</Text>
        
        <Text style={styles.label}>Pool Type</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.option, poolType === 'inground' && styles.optionSelected]}
            onPress={() => setPoolType('inground')}
          >
            <Text style={[styles.optionText, poolType === 'inground' && styles.optionTextSelected]}>
              Inground
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, poolType === 'above_ground' && styles.optionSelected]}
            onPress={() => setPoolType('above_ground')}
          >
            <Text style={[styles.optionText, poolType === 'above_ground' && styles.optionTextSelected]}>
              Above Ground
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Pool Shape</Text>
        <View style={styles.shapeGrid}>
          {['rectangle', 'oval', 'round', 'freeform', 'lap', 'other'].map((shape) => (
            <TouchableOpacity
              key={shape}
              style={[styles.shapeOption, poolShape === shape && styles.optionSelected]}
              onPress={() => setPoolShape(shape as any)}
            >
              <Text style={[styles.optionText, poolShape === shape && styles.optionTextSelected]}>
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.section} variant="elevated">
        <Text style={styles.sectionTitle}>Dimensions</Text>
        
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="length"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Length (ft)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text))}
                  onBlur={onBlur}
                  error={errors.length?.message}
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
                  onChangeText={(text) => onChange(parseFloat(text))}
                  onBlur={onBlur}
                  error={errors.width?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flexOne}>
            <Controller
              control={control}
              name="avgDepth"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Avg Depth (ft)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text))}
                  onBlur={onBlur}
                  error={errors.avgDepth?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
          <View style={styles.flexOne}>
            <Controller
              control={control}
              name="deepEndDepth"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Deep End (ft)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text))}
                  onBlur={onBlur}
                  error={errors.deepEndDepth?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
          <View style={styles.flexOne}>
            <Controller
              control={control}
              name="shallowEndDepth"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Shallow End (ft)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text))}
                  onBlur={onBlur}
                  error={errors.shallowEndDepth?.message}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </View>
        </View>

        {volume > 0 && (
          <View style={styles.volumeDisplay}>
            <Text style={styles.volumeLabel}>Calculated Volume:</Text>
            <Text style={styles.volumeValue}>{volume.toLocaleString()} gallons</Text>
          </View>
        )}
      </Card>

      <Card style={styles.section} variant="elevated">
        <Text style={styles.sectionTitle}>Pool Features</Text>
        <View style={styles.featuresGrid}>
          {POOL_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature}
              style={[
                styles.featureOption,
                selectedFeatures.includes(feature) && styles.optionSelected,
              ]}
              onPress={() => toggleFeature(feature)}
            >
              <Text
                style={[
                  styles.featureText,
                  selectedFeatures.includes(feature) && styles.optionTextSelected,
                ]}
              >
                {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.section} variant="elevated">
        <Text style={styles.sectionTitle}>Pool Surface</Text>
        
        <Text style={styles.label}>Surface Material</Text>
        <View style={styles.shapeGrid}>
          {['plaster', 'pebble', 'tile', 'vinyl', 'fiberglass', 'other'].map((material) => (
            <TouchableOpacity
              key={material}
              style={[styles.shapeOption, surfaceMaterial === material && styles.optionSelected]}
              onPress={() => setSurfaceMaterial(material as any)}
            >
              <Text style={[styles.optionText, surfaceMaterial === material && styles.optionTextSelected]}>
                {material.charAt(0).toUpperCase() + material.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Surface Condition</Text>
        <View style={styles.optionRow}>
          {['excellent', 'good', 'fair', 'poor'].map((condition) => (
            <TouchableOpacity
              key={condition}
              style={[styles.conditionOption, surfaceCondition === condition && styles.optionSelected]}
              onPress={() => setSurfaceCondition(condition as any)}
            >
              <Text style={[styles.optionText, surfaceCondition === condition && styles.optionTextSelected]}>
                {condition.charAt(0).toUpperCase() + condition.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Surface Stains</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.option, !surfaceStains && styles.optionSelected]}
            onPress={() => setSurfaceStains(false)}
          >
            <Text style={[styles.optionText, !surfaceStains && styles.optionTextSelected]}>
              No Stains
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, surfaceStains && styles.optionSelected]}
            onPress={() => setSurfaceStains(true)}
          >
            <Text style={[styles.optionText, surfaceStains && styles.optionTextSelected]}>
              Has Stains
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.section} variant="elevated">
        <Text style={styles.sectionTitle}>Environment</Text>
        
        <Controller
          control={control}
          name="deckMaterial"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Deck Material"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g., Concrete, Pavers, Wood"
            />
          )}
        />

        <Controller
          control={control}
          name="fenceType"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Fence Type"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g., Privacy, Chain link, None"
            />
          )}
        />

        <Text style={styles.label}>Nearby Trees</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.option, !nearbyTrees && styles.optionSelected]}
            onPress={() => setNearbyTrees(false)}
          >
            <Text style={[styles.optionText, !nearbyTrees && styles.optionTextSelected]}>
              No Trees
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, nearbyTrees && styles.optionSelected]}
            onPress={() => setNearbyTrees(true)}
          >
            <Text style={[styles.optionText, nearbyTrees && styles.optionTextSelected]}>
              Has Trees
            </Text>
          </TouchableOpacity>
        </View>

        {nearbyTrees && (
          <Controller
            control={control}
            name="treeType"
            render={({ field: { onChange, onBlur, value } }) => (
              <ModernInput
                label="Tree Types"
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g., Palm, Oak, Pine"
              />
            )}
          />
        )}
      </Card>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <GradientButton
            title="Back"
            onPress={onBack}
            variant="outline"
            size="large"
            style={styles.backButton}
          />
          <GradientButton
            title="Next"
            onPress={handleSubmit(onSubmit)}
            size="large"
            style={styles.nextButton}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Extra space for button container
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  option: {
    flex: 1,
    margin: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: theme.colors.blueGreen,
    backgroundColor: theme.colors.seaFoam,
  },
  optionText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: theme.colors.darkBlue,
  },
  shapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  shapeOption: {
    width: '48%',
    margin: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.sm,
  },
  halfField: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  flexOne: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  volumeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.seaFoam,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  volumeLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
  volumeValue: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '700',
    color: theme.colors.blueGreen,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  featureOption: {
    minWidth: '48%',
    margin: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  featureText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  conditionOption: {
    flex: 1,
    margin: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  nextButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});