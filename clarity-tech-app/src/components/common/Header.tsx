import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  rightButton?: {
    title: string;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  rightButton,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.darkBlue}
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.centerSection}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.rightSection}>
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rightAction.icon}
                size={24}
                color={theme.colors.darkBlue}
              />
            </TouchableOpacity>
          )}
          {rightButton && (
            <TouchableOpacity
              onPress={rightButton.onPress}
              style={styles.textButton}
              activeOpacity={0.7}
            >
              <Text style={styles.textButtonLabel}>
                {rightButton.title}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.white,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  leftSection: {
    width: 48,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 80,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  textButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  textButtonLabel: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.blueGreen,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.darkBlue,
  },
  subtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginTop: 2,
  },
});