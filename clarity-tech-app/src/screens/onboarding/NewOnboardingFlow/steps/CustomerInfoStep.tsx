import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LinearGradient } from 'expo-linear-gradient';

// CRITICAL: Import EXISTING UI components - don't create new ones
import { ModernInput } from '../../../../components/ui/ModernInput';
import { AIInsightsBox } from '../../../../components/common/AIInsightsBox';
import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';

// EXACT validation schema from current implementation
const customerInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[\d\s\-\(\)]+$/, 'Invalid phone number'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
});

export const CustomerInfoStep: React.FC = () => {
  const { session, updateCustomerInfo, nextStep } = useOnboarding();
  
  const { control, reset, getValues, watch, formState: { errors } } = useForm({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: session?.customerInfo || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'FL',
      zipCode: '',
    },
  });
  
  // Load existing data when session updates
  useEffect(() => {
    if (session?.customerInfo) {
      reset(session.customerInfo);
    } else {
      // Save initial default values including state='FL'
      const defaultValues = getValues();
      updateCustomerInfo(defaultValues).catch(() => {});
    }
  }, [session?.customerInfo, reset, getValues, updateCustomerInfo]);
  
  // Watch form values for real-time validation updates
  const formValues = watch();
  
  // Sync form state with context for real-time validation
  useEffect(() => {
    // Check if we have valid form data to save
    const hasRequiredFields = formValues.firstName || formValues.lastName || 
                             formValues.email || formValues.phone ||
                             formValues.address || formValues.city ||
                             formValues.zipCode;
    
    if (hasRequiredFields || formValues.state !== 'FL') {
      // Debounce the update to avoid too many calls
      const timeoutId = setTimeout(() => {
        updateCustomerInfo(formValues).catch(() => {});
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [formValues, updateCustomerInfo]);
  
  
  // Auto-save on blur with proper form value retrieval
  const handleBlur = async () => {
    // Get all current form values using proper react-hook-form method
    const formValues = getValues();
    
    // Save all form values to ensure complete data is persisted
    await updateCustomerInfo(formValues).catch(() => {});
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
        <Text style={styles.headerTitle}>Welcome to Smart Onboarding</Text>
        <Text style={styles.headerSubtitle}>
          Let's start with your customer information
        </Text>
      </LinearGradient>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

      {/* Customer Info Card */}
      <View style={styles.customerCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <View style={styles.prefilledBadge}>
            <Text style={styles.prefilledText}>Auto-saved</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="First Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={() => {
                    onBlur();
                    handleBlur();
                  }}
                  error={errors.firstName?.message}
                  autoCapitalize="words"
                />
              )}
            />
          </View>
          
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Last Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={() => {
                    onBlur();
                    handleBlur();
                  }}
                  error={errors.lastName?.message}
                  autoCapitalize="words"
                />
              )}
            />
          </View>
        </View>
        
        {/* Email - full width */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={() => {
                onBlur();
                handleBlur();
              }}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        
        {/* Phone - full width */}
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Phone"
              value={value}
              onChangeText={onChange}
              onBlur={() => {
                onBlur();
                handleBlur();
              }}
              error={errors.phone?.message}
              keyboardType="phone-pad"
            />
          )}
        />
        
        {/* Address - full width */}
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Street Address"
              value={value}
              onChangeText={onChange}
              onBlur={() => {
                onBlur();
                handleBlur();
              }}
              error={errors.address?.message}
              autoCapitalize="words"
            />
          )}
        />
        
          <View style={styles.row}>
            <View style={styles.flexTwo}>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="City"
                  value={value}
                  onChangeText={onChange}
                  onBlur={() => {
                    onBlur();
                    handleBlur();
                  }}
                  error={errors.city?.message}
                  autoCapitalize="words"
                />
              )}
            />
          </View>
          
            <View style={styles.flexOne}>
            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="State"
                  value={value}
                  onChangeText={onChange}
                  onBlur={() => {
                    onBlur();
                    handleBlur();
                  }}
                  error={errors.state?.message}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              )}
            />
          </View>
          
            <View style={styles.flexOne}>
            <Controller
              control={control}
              name="zipCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Zip"
                  value={value}
                  onChangeText={onChange}
                  onBlur={() => {
                    onBlur();
                    handleBlur();
                  }}
                  error={errors.zipCode?.message}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              )}
            />
          </View>
          </View>
        </View>
      </View>
      
      {/* AI Insights */}
      <AIInsightsBox stepName="customer" />
      
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  customerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)', // Matching vision's border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
  prefilledBadge: {
    backgroundColor: 'rgba(87, 124, 142, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  prefilledText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.blueGreen,
    fontWeight: '500',
  },
  formSection: {
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
  flexOne: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  flexTwo: {
    flex: 2,
    marginHorizontal: theme.spacing.sm,
  },
});