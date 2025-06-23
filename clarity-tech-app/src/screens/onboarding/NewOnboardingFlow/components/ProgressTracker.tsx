import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../../../styles/theme';
import { Logo } from '../../../../components/common/Logo';

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
      {/* Single Row Header with Logo, Step Info, and Save & Exit */}
      <View style={styles.header}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Logo 
            size="medium" 
            variant="dark" 
            style={styles.headerLogo}
            testID="onboarding-header-logo"
          />
        </View>

        {/* Step Info Section */}
        <View style={styles.stepInfoSection}>
          <Text style={styles.stepTitle}>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </Text>
          {/* Progress Dots */}
          <View style={styles.progressDots}>
            {steps.map((_, index) => {
              const status = getStepStatus(index);
              const isLast = index === steps.length - 1;
              
              return (
                <View key={index} style={styles.dotWrapper}>
                  <View
                    style={[
                      styles.dot,
                      status === 'completed' && styles.dotCompleted,
                      status === 'current' && styles.dotCurrent,
                    ]}
                  />
                  {!isLast && (
                    <View
                      style={[
                        styles.dotConnector,
                        status === 'completed' && styles.dotConnectorCompleted,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Save & Exit Section */}
        <View style={styles.saveSection}>
          <TouchableOpacity onPress={onSaveAndExit} style={styles.saveButton}>
            <Ionicons name="save-outline" size={18} color={theme.colors.gray} />
            <Text style={styles.saveText}>Save & Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 80,
  },
  logoSection: {
    paddingRight: theme.spacing.lg,
  },
  headerLogo: {
    width: 140,
    height: 56,
  },
  stepInfoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.xs,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotCompleted: {
    backgroundColor: theme.colors.success,
  },
  dotCurrent: {
    backgroundColor: theme.colors.blueGreen,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotConnector: {
    width: 16,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  dotConnectorCompleted: {
    backgroundColor: theme.colors.success,
  },
  saveSection: {
    paddingLeft: theme.spacing.lg,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.lightGray + '20',
  },
  saveText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    fontWeight: '500',
  },
});