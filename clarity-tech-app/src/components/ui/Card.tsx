import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: keyof typeof theme.spacing;
  pressable?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'lg',
  pressable = false,
  onPress,
}) => {
  const CardComponent = pressable ? TouchableOpacity : View;
  
  return (
    <CardComponent
      onPress={onPress}
      activeOpacity={pressable ? 0.95 : 1}
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'glass' && styles.glass,
        { padding: theme.spacing[padding] },
        style,
      ]}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  elevated: {
    ...theme.shadows.lg,
    shadowColor: theme.colors.blueGreen,
    shadowOpacity: 0.12,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.blueGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: theme.colors.blueGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
});