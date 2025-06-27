import React, { useState } from 'react';
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

interface ModernInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
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
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnimation = useState(new Animated.Value(value ? 1 : 0))[0];

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
          <Animated.Text
            style={[
              styles.label,
              {
                transform: [
                  {
                    translateY: labelAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                  {
                    scale: labelAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.85],
                    }),
                  },
                ],
              },
              error && styles.labelError,
            ]}
          >
            {label}
          </Animated.Text>
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
    marginBottom: 16,
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
  },
  inputWeb: {
    outline: 'none',
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
  label: {
    position: 'absolute',
    left: 44,
    top: 18,
    fontSize: 16,
    color: '#6b7280',
    backgroundColor: 'transparent',
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