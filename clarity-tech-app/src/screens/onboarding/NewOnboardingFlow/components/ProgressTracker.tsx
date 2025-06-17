import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../../../styles/theme';

interface Step {
  id: string;
  title: string;
  icon: string;
}

interface ProgressTrackerProps {
  steps: Step[];
  currentStep: number;
  onSaveAndExit: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  currentStep,
  onSaveAndExit,
}) => {
  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <View style={styles.container}>
      {/* Header with Save & Exit */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onSaveAndExit} style={styles.saveButton}>
          <Ionicons name="save-outline" size={20} color={theme.colors.gray} />
          <Text style={styles.saveText}>Save & Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;

          return (
            <View key={step.id} style={styles.stepWrapper}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    status === 'completed' && styles.stepDotCompleted,
                    status === 'current' && styles.stepDotCurrent,
                  ]}
                >
                  {status === 'completed' ? (
                    <Ionicons name="checkmark" size={12} color="white" />
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.stepConnector,
                      status === 'completed' && styles.stepConnectorCompleted,
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Current Step Info */}
      <View style={styles.currentStepInfo}>
        <Text style={styles.currentStepTitle}>
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  saveText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
  },
  stepsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  stepWrapper: {
    flex: 1,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepDotCurrent: {
    backgroundColor: theme.colors.blueGreen,
  },
  stepNumber: {
    fontSize: 12,
    color: theme.colors.gray,
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: -12,
    height: 2,
    backgroundColor: theme.colors.border,
  },
  stepConnectorCompleted: {
    backgroundColor: theme.colors.success,
  },
  currentStepInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  currentStepTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
});