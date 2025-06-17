import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface OfflineIndicatorProps {
  isOffline: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOffline }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -100,
      duration: theme.animation.normal,
      useNativeDriver: true,
    }).start();
  }, [isOffline, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name="cloud-offline" size={20} color={theme.colors.white} />
      <Text style={styles.text}>You're offline</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.warning,
    paddingTop: 44, // Account for status bar
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    color: theme.colors.white,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});