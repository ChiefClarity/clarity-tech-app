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
    console.log('[NavigationButtons] handleNext clicked:', {
      hasOnComplete: !!onComplete,
      currentStep,
      canNavigateForward
    });
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
        style={[styles.navButton, styles.backNavButton]}
        disabled={currentStep === 0}
      >
        <Ionicons 
          name="chevron-back" 
          size={16} 
          color={currentStep === 0 ? theme.colors.gray : theme.colors.blueGreen} 
        />
        <Text style={[
          styles.navButtonText,
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
          styles.nextButton,
          (!canNavigateForward || saving) && styles.nextButtonDisabled
        ]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Text style={[styles.navButtonText, { color: 'white' }]}>
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
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: theme.spacing.lg,
  },
  navButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backNavButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextButton: {
    backgroundColor: theme.colors.blueGreen,
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: theme.colors.gray,
    opacity: 0.6,
  },
  navButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.blueGreen,
    fontWeight: '500',
    marginHorizontal: theme.spacing.xs,
  },
  disabledText: {
    color: theme.colors.gray,
  },
});