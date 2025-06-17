import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../../../styles/theme';

interface CardWrapperProps {
  children: React.ReactNode;
  style?: any;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
});