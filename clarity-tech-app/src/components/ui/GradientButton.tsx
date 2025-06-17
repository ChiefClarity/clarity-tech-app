import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  icon,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const getGradientColors = () => {
    if (isDisabled) {
      return [theme.colors.grayLight, theme.colors.gray];
    }
    if (variant === 'primary') {
      return [theme.colors.blueGreen, theme.colors.darkBlue];
    }
    if (variant === 'secondary') {
      return [theme.colors.seaFoam, theme.colors.blueGreen];
    }
    return [theme.colors.transparent, theme.colors.transparent];
  };

  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 64;
      default:
        return 52;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.colors.blueGreen : theme.colors.white}
          size="small"
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                fontSize: getTextSize(),
                color: variant === 'outline' ? theme.colors.blueGreen : theme.colors.white,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </>
  );

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          styles.outlineButton,
          {
            height: getButtonHeight(),
            opacity: isDisabled ? 0.6 : 1,
            width: fullWidth ? '100%' : 'auto',
          },
          style,
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.buttonContainer,
        { width: fullWidth ? '100%' : 'auto' },
        style,
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.button,
          styles.gradient,
          {
            height: getButtonHeight(),
            opacity: isDisabled ? 0.8 : 1,
          },
        ]}
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
    shadowColor: theme.colors.blueGreen,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  gradient: {
    borderRadius: theme.borderRadius.xl,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: theme.colors.blueGreen,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
    shadowColor: theme.colors.blueGreen,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});