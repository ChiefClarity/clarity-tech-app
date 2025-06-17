import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';

interface ModernCompletionStepProps {
  data: any;
  onNext: () => void;
  onBack: () => void;
}

export const ModernCompletionStep = React.forwardRef<
  { submitForm: () => void },
  ModernCompletionStepProps
>(({ data, onNext, onBack }, ref) => {
  
  // Expose submitForm to parent via ref
  React.useImperativeHandle(ref, () => ({
    submitForm: () => onNext(), // Complete step just calls onNext with no data
    getCurrentData: () => ({}) // No data to return for completion step
  }));
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.successCard}
      >
        <Ionicons name="checkmark-circle" size={80} color="white" />
        <Text style={styles.successTitle}>All Set!</Text>
        <Text style={styles.successSubtitle}>
          Your pool profile has been created successfully
        </Text>
      </LinearGradient>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>What's Next?</Text>
        <View style={styles.summaryItem}>
          <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.summaryText}>
            Our team will review your information within 24 hours
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.summaryText}>
            You'll receive a detailed service proposal via email
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.summaryText}>
            We'll contact you to schedule your first service visit
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successCard: {
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  successTitle: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '700',
    color: 'white',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  successSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  summaryTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  summaryText: {
    flex: 1,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.md,
    lineHeight: 22,
  },
});