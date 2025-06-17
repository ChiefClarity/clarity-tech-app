import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: 'completed' | 'current' | 'upcoming';
}

interface OnboardingSidebarProps {
  steps: OnboardingStep[];
  currentStepId: string;
  onStepPress?: (stepId: string) => void;
  customerName?: string;
}

export const OnboardingSidebar: React.FC<OnboardingSidebarProps> = ({
  steps,
  currentStepId,
  onStepPress,
  customerName,
}) => {
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

  const getStepIcon = (step: OnboardingStep) => {
    if (step.status === 'completed') {
      return 'checkmark-circle';
    }
    return step.icon;
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
        <View style={styles.headerContent}>
          <Ionicons name="water" size={32} color="white" />
          <Text style={styles.brandText}>Clarity</Text>
        </View>
        {customerName && (
          <View style={styles.customerInfo}>
            <Text style={styles.customerLabel}>Customer</Text>
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Progress overview */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Onboarding Progress</Text>
        <View style={styles.progressBar}>
          <View style={styles.progressTrack} />
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
        </Text>
      </View>

      {/* Steps list */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isClickable = step.status === 'completed' || step.status === 'current';
          const color = getStepColor(step.status);
          
          return (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepItem,
                step.status === 'current' && styles.stepItemCurrent,
              ]}
              onPress={() => isClickable && onStepPress?.(step.id)}
              disabled={!isClickable}
              activeOpacity={0.7}
            >
              <View style={styles.stepContent}>
                <View style={[styles.stepIconContainer, { backgroundColor: color + '20' }]}>
                  <Ionicons
                    name={getStepIcon(step)}
                    size={20}
                    color={color}
                  />
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, { color }]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepSubtitle}>
                    {step.subtitle}
                  </Text>
                </View>
              </View>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <View style={styles.stepConnector}>
                  <View 
                    style={[
                      styles.connectorLine,
                      { 
                        backgroundColor: step.status === 'completed' 
                          ? theme.colors.success 
                          : theme.colors.border 
                      }
                    ]} 
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* AI Assistant hint */}
      <View style={styles.aiHint}>
        <LinearGradient
          colors={['rgba(46, 125, 139, 0.1)', 'rgba(46, 125, 139, 0.05)']}
          style={styles.aiHintGradient}
        >
          <Ionicons name="sparkles" size={20} color={theme.colors.blueGreen} />
          <Text style={styles.aiHintText}>
            AI is analyzing your pool data in real-time
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  header: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginLeft: theme.spacing.md,
  },
  customerInfo: {
    marginTop: theme.spacing.md,
  },
  customerLabel: {
    fontSize: theme.typography.small.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  customerName: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: 'white',
  },
  progressSection: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: theme.colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  stepsContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  stepItem: {
    position: 'relative',
  },
  stepItemCurrent: {
    backgroundColor: 'rgba(46, 125, 139, 0.05)',
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: -theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  stepConnector: {
    position: 'absolute',
    left: 19.5, // Center of icon
    top: 52, // After the icon
    bottom: -16,
    width: 1,
  },
  connectorLine: {
    flex: 1,
    width: 2,
  },
  aiHint: {
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  aiHintGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  aiHintText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.blueGreen,
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
});