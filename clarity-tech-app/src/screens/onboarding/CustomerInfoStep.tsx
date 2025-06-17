import React, { memo, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModernInput } from '../../components/ui/ModernInput';
import { GradientButton } from '../../components/ui/GradientButton';
import { theme } from '../../styles/theme';
import { Customer } from '../../types';
import { OnboardingStepData } from '../../types/onboarding';
import { sanitizeFormData } from '../../utils/sanitize';

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

interface CustomerInfoStepProps {
  data: OnboardingStepData;
  onNext: (data: Customer) => void;
  onBack: () => void;
}

const CustomerInfoStepComponent: React.FC<CustomerInfoStepProps> = ({
  data,
  onNext,
}) => {
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

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultValues,
  });

  const onSubmit = useCallback((formData: CustomerFormData) => {
    // Sanitize all form data before submission
    const sanitizedData = sanitizeFormData(formData);
    const customerData: Customer = {
      ...sanitizedData,
      id: data.customer?.id || `customer_${Date.now()}`,
    };
    onNext(customerData);
  }, [onNext, data.customer]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
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
              placeholder="(555) 123-4567"
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
                  placeholder="AZ"
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

      <View style={styles.buttonContainer}>
        <GradientButton
          title="Next"
          onPress={handleSubmit(onSubmit)}
          fullWidth
          size="large"
        />
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
  formSection: {
    marginTop: theme.spacing.lg,
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
  buttonContainer: {
    marginTop: theme.spacing.xl,
  },
});

export const CustomerInfoStep = memo(CustomerInfoStepComponent);