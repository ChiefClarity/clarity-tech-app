import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, ViewStyle } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
  animated?: boolean;
  style?: ViewStyle;
}

const sizes = {
  small: { width: 40, height: 40 },
  medium: { width: 80, height: 80 },
  large: { width: 120, height: 120 },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  variant = 'dark',
  animated = false,
  style,
}) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      // Wave animation
      const waveAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      // Subtle breathing animation
      const breathAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );

      waveAnimation.start();
      breathAnimation.start();

      return () => {
        waveAnimation.stop();
        breathAnimation.stop();
      };
    }
    
    return undefined;
  }, [animated, waveAnim, scaleAnim]);

  const logoSource = variant === 'light' 
    ? require('../../../assets/logo-white.png')
    : require('../../../assets/logo.png');

  const waveTranslateY = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          sizes[size],
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={logoSource}
          style={[sizes[size], styles.logo]}
          resizeMode="contain"
        />
        
        {animated && (
          <Animated.View
            style={[
              styles.wave,
              {
                opacity: waveOpacity,
                transform: [{ translateY: waveTranslateY }],
              },
            ]}
          >
            <View style={styles.waveRipple} />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 8,
  },
  wave: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#577C8E',
    opacity: 0.3,
  },
  waveRipple: {
    flex: 1,
    borderRadius: 50,
    backgroundColor: 'transparent',
  },
});