import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInputProps,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EnhancedFloatingInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export const EnhancedFloatingInput: React.FC<EnhancedFloatingInputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  value,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnimation = useState(new Animated.Value(value ? 1 : 0))[0];

  // Update animation when value changes
  useEffect(() => {
    Animated.timing(labelAnimation, {
      toValue: value || isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, isFocused]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(labelAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    onBlur?.(e);
  };

  const labelLeftPosition = labelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [icon ? 44 : 16, 16], // Always move to left:16 when floating
  });

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? '#ef4444' : isFocused ? '#0066CC' : '#6b7280'}
            style={styles.leftIcon}
          />
        )}
        
        {label && (
          <Animated.View
            style={[
              styles.labelContainer,
              {
                left: labelLeftPosition,
                top: labelAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, -16], // Increased clearance for better separation from border
                }),
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.label,
                {
                  fontSize: labelAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 12],
                  }),
                  color: labelAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#6b7280', isFocused ? '#0066CC' : '#6b7280'],
                  }),
                },
                error && styles.labelError,
              ]}
            >
              {label}
            </Animated.Text>
          </Animated.View>
        )}
        
        <TextInput
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            rightIcon && styles.inputWithRightIcon,
            Platform.select({
              web: styles.inputWeb,
              default: {},
            }),
            style,
          ]}
          placeholderTextColor="#9ca3af"
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={error ? '#ef4444' : '#6b7280'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,  // Increase from 16 to 28
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 56,
    position: 'relative',
  },
  inputContainerFocused: {
    backgroundColor: '#ffffff',
    borderColor: '#0066CC',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#0066CC',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 102, 204, 0.1)',
      },
    }),
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    paddingTop: 8, // Add padding to prevent overlap with floating label
  },
  inputWeb: {
    outlineStyle: 'none',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIconButton: {
    padding: 8,
    marginLeft: 8,
  },
  labelContainer: {
    position: 'absolute',
    // backgroundColor: '#ffffff', // REMOVE or COMMENT OUT THIS LINE
    paddingHorizontal: 4,
  },
  label: {
    color: '#6b7280',
  },
  labelError: {
    color: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});