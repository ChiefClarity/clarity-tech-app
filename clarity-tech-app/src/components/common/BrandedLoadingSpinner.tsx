import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from './Logo';
import { theme } from '../../styles/theme';

interface BrandedLoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  showLogo?: boolean;
}

export const BrandedLoadingSpinner: React.FC<BrandedLoadingSpinnerProps> = ({
  message = 'Loading...',
  fullScreen = true,
  showLogo = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  const content = (
    <Animated.View
      style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {showLogo && (
        <View style={styles.logoContainer}>
          <Logo size="large" variant="light" animated />
        </View>
      )}
      
      <View style={styles.loadingIndicator}>
        <View style={styles.waveContainer}>
          {[...Array(3)].map((_, index) => (
            <Wave key={index} delay={index * 200} />
          ))}
        </View>
      </View>

      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );

  if (fullScreen) {
    return (
      <LinearGradient
        colors={[theme.colors.seaFoam, theme.colors.blueGreen]}
        style={containerStyle}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

interface WaveProps {
  delay: number;
}

const Wave: React.FC<WaveProps> = ({ delay }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createWaveAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = createWaveAnimation();
    animation.start();

    return () => {
      animation.stop();
    };
  }, [waveAnim, delay]);

  const scale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });

  const opacity = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  return (
    <Animated.View
      style={[
        styles.wave,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
  },
  loadingIndicator: {
    marginVertical: theme.spacing.xl,
  },
  waveContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  message: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});