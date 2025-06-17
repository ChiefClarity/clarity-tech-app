import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface Step {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps = [],
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'upcoming';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'current':
        return theme.colors.blueGreen;
      case 'upcoming':
        return theme.colors.gray;
      default:
        return theme.colors.gray;
    }
  };

  const getStepIcon = (step: Step, status: string) => {
    if (status === 'completed') {
      return 'checkmark-circle';
    }
    if (status === 'current') {
      return step.icon;
    }
    return step.icon;
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const color = getStepColor(status);
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.stepContent}>
              <View style={[styles.stepCircle, { borderColor: color }]}>
                <Ionicons
                  name={getStepIcon(step, status)}
                  size={20}
                  color={color}
                />
              </View>
              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: status === 'current' ? theme.colors.darkBlue : color,
                    fontWeight: status === 'current' ? '700' : '500',
                  },
                ]}
              >
                {step.title}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor:
                      status === 'completed' ? theme.colors.success : theme.colors.border,
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContent: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  stepTitle: {
    fontSize: theme.typography.small.fontSize,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  connector: {
    height: 2,
    flex: 0.5,
    marginHorizontal: theme.spacing.xs,
    marginTop: -20,
  },
});