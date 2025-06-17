import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModernInput } from '../../components/ui/ModernInput';
import { GradientButton } from '../../components/ui/GradientButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Logo } from '../../components/common/Logo';
import { theme } from '../../styles/theme';
import { useAuth } from '../../hooks/useAuth';
import { STORAGE_KEYS } from '../../constants/storage';
import { authTokenStorage } from '../../services/storage/secureStorage';
import { sanitizeEmail, sanitizeInput } from '../../utils/sanitize';
import { logger } from '../../utils/logger';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;


const LoginScreenComponent: React.FC = () => {
  const { login, isLoading, checkAuthStatus, setAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loadSavedEmail = useCallback(async () => {
    try {
      const savedRemember = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (savedRemember === 'true') {
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (savedEmail) {
          const userData = JSON.parse(savedEmail);
          setValue('email', userData.email);
          setRememberMe(true);
        }
      }
    } catch (error) {
      logger.auth.error('Error loading saved email', error);
    }
  }, [setValue]);

  useEffect(() => {
    loadSavedEmail();
  }, [loadSavedEmail]);

  const onSubmit = useCallback(async (data: LoginFormData) => {
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(data.email.trim());
    const sanitizedPassword = sanitizeInput(data.password.trim());
    
    if (!sanitizedEmail) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    logger.auth.debug('Login attempt', {
      email: sanitizedEmail
    });
    
    setIsSubmitting(true);
    
    logger.auth.info('Attempting login with API');
    const result = await login(sanitizedEmail, sanitizedPassword, rememberMe);
    
    setIsSubmitting(false);

    if (!result.success) {
      logger.auth.warn('Login failed', { error: result.error });
      Alert.alert('Login Failed', result.error || 'Please check your credentials');
    } else {
      logger.auth.info('Login successful');
    }
  }, [login, setAuthenticated, rememberMe]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <LinearGradient
      colors={[theme.colors.seaFoam, theme.colors.blueGreen, theme.colors.darkBlue]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Logo size="large" variant="light" animated />
            <Text style={styles.title}>Clarity Tech</Text>
            <Text style={styles.tagline}>Technician-Partner App</Text>
            <Text style={styles.subtitle}>Pool Care with Purpose</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.instructionText}>Sign in to continue</Text>

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
                  icon={<Ionicons name="mail-outline" size={20} color={theme.colors.gray} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
                  icon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.gray} />}
                  rightIcon={
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.colors.gray}
                    />
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />
              )}
            />

            <TouchableOpacity
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                )}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <GradientButton
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              size="large"
              style={styles.loginButton}
            />

            <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.white,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  formContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  welcomeText: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    fontFamily: 'Poppins_600SemiBold',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
  },
  instructionText: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Poppins_400Regular',
    color: theme.colors.gray,
    marginBottom: theme.spacing.xl,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  rememberText: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Poppins_400Regular',
    color: theme.colors.gray,
  },
  loginButton: {
    marginBottom: theme.spacing.lg,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: theme.typography.body.fontSize,
    fontFamily: 'Poppins_600SemiBold',
    color: theme.colors.blueGreen,
    fontWeight: '600',
  },
});

export const LoginScreen = memo(LoginScreenComponent);