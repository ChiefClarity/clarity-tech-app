import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModernInput } from '../../components/ui/ModernInput';
import { GradientButton } from '../../components/ui/GradientButton';
import { Card } from '../../components/ui/Card';
import { theme } from '../../styles/theme';
import { WaterChemistry } from '../../types';
import { sanitizeNumber, sanitizeInput } from '../../utils/sanitize';

const waterChemistrySchema = z.object({
  chlorine: z.number().min(0).max(10),
  ph: z.number().min(6).max(8.5),
  alkalinity: z.number().min(0).max(300),
  cyanuricAcid: z.number().min(0).max(100),
  calcium: z.number().optional(),
  salt: z.number().optional(),
  tds: z.number().optional(),
  temperature: z.number().optional(),
  phosphates: z.number().min(0).max(1000).optional(),
  copper: z.number().min(0).max(0.5).optional(),
  iron: z.number().min(0).max(0.5).optional(),
  orp: z.number().min(0).max(1000).optional(),
  waterChemistryNotes: z.string().optional(),
});

type WaterChemistryFormData = z.infer<typeof waterChemistrySchema>;

interface WaterChemistryStepProps {
  data: any;
  onNext: (data: WaterChemistry) => void;
  onBack: () => void;
}

export const WaterChemistryStep: React.FC<WaterChemistryStepProps> = ({
  data,
  onNext,
  onBack,
}) => {
  const {
    control,
    handleSubmit,
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

  const onSubmit = (formData: WaterChemistryFormData) => {
    // Sanitize notes field and ensure all numeric values are within safe ranges
    const sanitizedData = {
      ...formData,
      notes: formData.waterChemistryNotes ? sanitizeInput(formData.waterChemistryNotes) : undefined,
    };
    onNext(sanitizedData as WaterChemistry);
  };

  const parseFloat = (value: string) => {
    const sanitized = sanitizeNumber(value);
    return sanitized !== null ? sanitized : 0;
  };

  const parseInt = (value: string) => {
    const sanitized = sanitizeNumber(value);
    return sanitized !== null ? Math.round(sanitized) : 0;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.requiredSection} variant="glass">
        <Text style={styles.sectionTitle}>Required Measurements</Text>
        
        <View style={styles.row}>
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
                  placeholder="Enter chlorine level"
                  idealRange={{ min: 1, max: 3, ideal: 2 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="ph"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="pH"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text))}
                  onBlur={onBlur}
                  error={errors.ph?.message}
                  keyboardType="decimal-pad"
                  placeholder="Enter pH level"
                  idealRange={{ min: 7.2, max: 7.6, ideal: 7.4 }}
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
                  placeholder="Enter alkalinity level"
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
                  placeholder="Enter cyanuric acid level"
                  idealRange={{ min: 30, max: 50, ideal: 40 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
        </View>
      </Card>

      <Card style={styles.optionalSection} variant="glass">
        <Text style={styles.sectionTitle}>Optional Measurements</Text>
        
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
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="phosphates"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Phosphates"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  placeholder="Enter phosphates level (ppb)"
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
                  label="ORP"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  placeholder="Enter ORP level (mV)"
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
                  label="Copper"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="Enter copper level (ppm)"
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
                  label="Iron"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="Enter iron level (ppm)"
                  idealRange={{ min: 0, max: 0.3, ideal: 0 }}
                  showRangeIndicator={true}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="waterChemistryNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Notes (Optional)"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          )}
        />
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
    paddingBottom: theme.spacing.xl,
  },
  requiredSection: {
    marginTop: theme.spacing.lg,
  },
  optionalSection: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.darkBlue,
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
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
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