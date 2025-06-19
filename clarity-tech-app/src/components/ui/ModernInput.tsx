import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInputProps,
  Platform,
} from 'react-native';
import { theme } from '../../styles/theme';

interface ModernInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  idealRange?: { min: number; max: number; ideal?: number };
  showRangeIndicator?: boolean;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  value,
  onFocus,
  onBlur,
  idealRange,
  showRangeIndicator = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedBorder = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const getValueStatus = () => {
    if (!idealRange || !value || !showRangeIndicator) return 'neutral';
    const numValue = parseFloat(value.toString());
    if (isNaN(numValue)) return 'neutral';
    
    if (numValue >= idealRange.min && numValue <= idealRange.max) {
      return 'good';
    }
    return 'warning';
  };

  const valueStatus = getValueStatus();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedLabel, {
        toValue: isFocused || value ? 1 : 0,
        duration: theme.animation.fast,
        useNativeDriver: false,
      }),
      Animated.timing(animatedBorder, {
        toValue: isFocused ? 1 : 0,
        duration: theme.animation.fast,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused, value, animatedLabel, animatedBorder]);

  const labelStyle = {
    position: 'absolute' as const,
    left: icon ? 40 : 16,
    top: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 6], // Changed from [18, -8] to prevent cutoff
    }),
    fontSize: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 12],
    }),
    color: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.gray, theme.colors.gray], // Keep consistent color
    }),
    backgroundColor: theme.colors.white,
    paddingHorizontal: 4,
    zIndex: 1,
  };

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    // Remove focus styling - keep consistent border
    if (valueStatus === 'good') return theme.colors.success;
    if (valueStatus === 'warning') return theme.colors.warning;
    return theme.colors.border;
  };

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: [getBorderColor(), getBorderColor()],
  });

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleContainerPress}
        style={styles.touchableContainer}
      >
        <Animated.View
          style={[
            styles.inputContainer,
            { borderColor: getBorderColor() },
            valueStatus === 'good' && styles.goodBorder,
            valueStatus === 'warning' && styles.warningBorder,
          ]}
        >
        {icon && <View style={styles.iconLeft}>{icon}</View>}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              icon && styles.inputWithIcon,
              rightIcon && styles.inputWithRightIcon,
              props.multiline && {
                paddingTop: theme.spacing.sm,
                paddingBottom: theme.spacing.sm,
                minHeight: props.numberOfLines ? props.numberOfLines * 24 : 80,
                textAlignVertical: 'top' as const,
              },
            ]}
            value={value}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        {rightIcon && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
        </Animated.View>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {showRangeIndicator && idealRange && (
        <View style={styles.rangeIndicator}>
          <Text style={[styles.rangeText, { color: getBorderColor() }]}>
            {valueStatus === 'good' ? '✓ ' : valueStatus === 'warning' ? '⚠ ' : ''}
            Range: {idealRange.min}-{idealRange.max}
            {idealRange.ideal && ` (ideal: ${idealRange.ideal})`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    marginTop: 8, // Add margin top to prevent label cutoff
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.white,
    position: 'relative',
    overflow: 'visible',
    minHeight: 64,
    paddingTop: 20,
    paddingBottom: 8,
    // Web-specific: Remove ALL focus styles
    ...Platform.select({
      web: {
        // Remove focus outline
        '&:focus-within': {
          outline: 'none',
          boxShadow: 'none',
        },
      },
      default: {},
    }),
  },
  input: {
    flex: 1,
    height: 36,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    ...Platform.select({
      web: {
        // Remove ALL browser styles
        outline: 'none !important' as any,
        outlineWidth: '0 !important' as any,
        outlineOffset: '0 !important' as any,
        boxShadow: 'none !important' as any,
        border: 'none !important' as any,
        WebkitAppearance: 'none' as any,
        MozAppearance: 'none' as any,
        // Ensure proper text rendering
        WebkitFontSmoothing: 'antialiased' as any,
        MozOsxFontSmoothing: 'grayscale' as any,
      },
      default: {},
    }),
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputWithRightIcon: {
    paddingRight: 48,
  },
  iconLeft: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  iconRight: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  touchableContainer: {
    flex: 1,
  },
  goodBorder: {
    borderColor: theme.colors.success,
  },
  warningBorder: {
    borderColor: theme.colors.warning,
  },
  errorBorder: {
    borderColor: theme.colors.error,
  },
  rangeIndicator: {
    marginTop: 4,
    marginLeft: theme.spacing.sm,
  },
  rangeText: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '500',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.small.fontSize,
    marginTop: 4,
    marginLeft: theme.spacing.sm,
  },
});