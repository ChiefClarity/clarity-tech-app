import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Here you could send error to a logging service
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    } else {
      // For React Native, you might want to restart the app
      // This would require additional setup with react-native-restart
      this.handleRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={[theme.colors.seaFoam, theme.colors.blueGreen]}
            style={styles.gradient}
          >
            <ScrollView 
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="warning-outline" 
                  size={80} 
                  color={theme.colors.white} 
                />
              </View>

              <Text style={styles.title}>Oops! Something went wrong</Text>
              
              <Text style={styles.message}>
                We're sorry, but something unexpected happened. The app has encountered an error and needs to restart.
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={this.handleRetry}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={20} color={theme.colors.white} />
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={this.handleReload}
                  activeOpacity={0.8}
                >
                  <Ionicons name="reload-outline" size={20} color={theme.colors.blueGreen} />
                  <Text style={styles.secondaryButtonText}>Restart App</Text>
                </TouchableOpacity>
              </View>

              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Error Details (Development Only):</Text>
                  <ScrollView style={styles.errorScroll} horizontal>
                    <Text style={styles.errorText}>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: theme.colors.white,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xxl,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.darkBlue,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  secondaryButtonText: {
    color: theme.colors.blueGreen,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  errorDetails: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  errorTitle: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  errorScroll: {
    maxHeight: 150,
  },
  errorText: {
    color: theme.colors.white,
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
});