import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModernInput } from '../../../components/ui/ModernInput';
import { GradientButton } from '../../../components/ui/GradientButton';
import { theme } from '../../../styles/theme';
import { Customer } from '../../../types';
import { OnboardingStepData } from '../../../types/onboarding';
import { sanitizeFormData } from '../../../utils/sanitize';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zipCode: z.string().regex(/^\d{5}$/, 'Zip code must be 5 digits'),
  customerNotes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface ModernCustomerInfoStepProps {
  data: OnboardingStepData;
  onNext: (data: Customer) => void;
  onBack: () => void;
}

const ModernCustomerInfoStepComponent = React.forwardRef<
  { submitForm: () => void; getCurrentData: () => any },
  ModernCustomerInfoStepProps
>(({ data, onNext }, ref) => {
  console.log('🔴 CUSTOMER INFO STEP - data prop:', data);
  console.log('🔴 CUSTOMER INFO STEP - data.customer:', data.customer);
  
  const defaultValues = useMemo(() => data.customer || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    customerNotes: '',
  }, [data.customer]);

  console.log('🔴 CUSTOMER INFO STEP - defaultValues:', defaultValues);
  
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultValues,
  });
  
  console.log('🔴 CUSTOMER INFO STEP - form values after init:', watch());
  
  // Reset form when customer data arrives
  useEffect(() => {
    if (data.customer && Object.keys(data.customer).length > 0) {
      console.log('🔴 RESETTING FORM WITH CUSTOMER DATA:', data.customer);
      reset(data.customer);
    }
  }, [data.customer, reset]);

  const onSubmit = useCallback((formData: CustomerFormData) => {
    const sanitizedData = sanitizeFormData(formData);
    const customerData: Customer = {
      ...sanitizedData,
      id: data.customer?.id || `customer_${Date.now()}`,
    };
    onNext(customerData);
  }, [onNext, data.customer]);

  // Expose submitForm to parent via ref
  React.useImperativeHandle(ref, () => ({
    submitForm: () => handleSubmit(onSubmit)(),
    getCurrentData: () => watch(), // Returns current form values
  }));

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

      {/* Customer Info Card */}
      <View style={styles.customerCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <View style={styles.prefilledBadge}>
            <Text style={styles.prefilledText}>Pre-filled from CRM</Text>
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
                    onBlur={onBlur}
                    error={errors.firstName?.message}
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
                    onBlur={onBlur}
                    error={errors.lastName?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <ModernInput
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <ModernInput
                label="Phone"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <ModernInput
                label="Street Address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.address?.message}
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
                    onBlur={onBlur}
                    error={errors.city?.message}
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
                    onBlur={onBlur}
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
                    onBlur={onBlur}
                    error={errors.zipCode?.message}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="customerNotes"
            render={({ field: { onChange, onBlur, value } }) => (
              <ModernInput
                label="Notes (Optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.customerNotes?.message}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
              />
            )}
          />
        </View>
      </View>


    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
});

export const ModernCustomerInfoStep = memo(ModernCustomerInfoStepComponent);