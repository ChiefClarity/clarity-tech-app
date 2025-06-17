import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';

interface NavigationButtonsProps {
  onComplete?: () => void;
  saving?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onComplete,
  saving = false,
}) => {
  const { currentStep, previousStep, nextStep, canNavigateForward } = useOnboarding();
  
  const handleNext = () => {
    if (onComplete) {
      onComplete();
    } else {
      nextStep();
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={previousStep}
        style={[styles.navButton, styles.backButton]}
        disabled={currentStep === 0}
      >
        <Ionicons 
          name="chevron-back" 
          size={16} 
          color={currentStep === 0 ? theme.colors.gray : theme.colors.blueGreen} 
        />
        <Text style={[
          styles.backButtonText,
          currentStep === 0 && styles.disabledText
        ]}>
          Previous
        </Text>
      </TouchableOpacity>

      {/* Continue/Complete Button */}
      <TouchableOpacity
        onPress={handleNext}
        disabled={!canNavigateForward || saving}
        style={[
          styles.navButton,
          styles.continueButton,
          (!canNavigateForward || saving) && styles.continueButtonDisabled
        ]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Text style={styles.continueButtonText}>
              {onComplete ? 'Complete' : 'Continue'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.xs,
    minHeight: 56,
  },
  backButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.blueGreen,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: theme.colors.blueGreen,
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.gray,
  },
  continueButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.white,
    fontWeight: '600',
  },
  disabledText: {
    color: theme.colors.gray,
  },
});