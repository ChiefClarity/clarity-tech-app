import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../../styles/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface ModernSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
  label,
  value,
  onValueChange,
  items,
  error,
  placeholder
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerContainer, error && styles.errorBorder]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          {placeholder && (
            <Picker.Item label={placeholder} value="" />
          )}
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  errorBorder: {
    borderColor: theme.colors.error,
  },
  error: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
});