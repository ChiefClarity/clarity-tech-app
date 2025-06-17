import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../../components/ui/GradientButton';
import { ModernInput } from '../../components/ui/ModernInput';
import { Card } from '../../components/ui/Card';
import { theme } from '../../styles/theme';
import { Equipment } from '../../types';
import { launchCamera } from '../../utils/webCamera';

interface EquipmentStepProps {
  data: any;
  onNext: (data: Equipment[]) => void;
  onBack: () => void;
}

type EquipmentTab = 'pump' | 'filter' | 'sanitizer' | 'heater' | 'timer' | 'valves';

interface EquipmentData {
  pump: {
    manufacturer: string;
    model: string;
    horsepower: string;
    age: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    photoUri?: string;
  };
  filter: {
    type: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    size: string;
    mediaType: string;
    lastCleaned: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    cartridgeCondition: 'excellent' | 'good' | 'fair' | 'poor';
    cartridgeModel: string;
    cartridgeNeedsReplacement: boolean;
    photoUri?: string;
  };
  sanitizer: {
    type: 'salt' | 'chlorine' | 'UV' | 'ozone' | 'mineral';
    manufacturer: string;
    model: string;
    serialNumber: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    additionalNotes: string;
    photoUri?: string;
  };
  heater: {
    type: 'gas' | 'electric' | 'heat-pump' | 'solar';
    manufacturer: string;
    model: string;
    serialNumber: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    additionalNotes: string;
    photoUri?: string;
  };
  timer: {
    type: 'mechanical' | 'automated' | 'digital' | 'smart';
    timerSynced: boolean;
    startHour: string;
    startMinutes: string;
    startAmPm: 'AM' | 'PM';
    endHour: string;
    endMinutes: string;
    endAmPm: 'AM' | 'PM';
    manufacturer: string;
    model: string;
    serialNumber: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    additionalNotes: string;
    photoUri?: string;
  };
  valves: {
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    valvesLabeled: boolean;
    additionalNotes: string;
    photoUri?: string;
  };
}

const TABS: { key: EquipmentTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'pump', label: 'Pump', icon: 'water-outline' },
  { key: 'filter', label: 'Filter', icon: 'filter-outline' },
  { key: 'sanitizer', label: 'Sanitizer', icon: 'shield-checkmark-outline' },
  { key: 'heater', label: 'Heater', icon: 'flame-outline' },
  { key: 'timer', label: 'Timer', icon: 'time-outline' },
  { key: 'valves', label: 'Valves', icon: 'git-branch-outline' },
];

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export const EquipmentStep: React.FC<EquipmentStepProps> = ({
  data,
  onNext,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<EquipmentTab>('pump');
  const [equipmentData, setEquipmentData] = useState<EquipmentData>({
    pump: {
      manufacturer: '',
      model: '',
      horsepower: '',
      age: '',
      condition: 'good',
    },
    filter: {
      type: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      size: '',
      mediaType: '',
      lastCleaned: '',
      condition: 'good',
      cartridgeCondition: 'good',
      cartridgeModel: '',
      cartridgeNeedsReplacement: false,
    },
    sanitizer: {
      type: 'salt',
      manufacturer: '',
      model: '',
      serialNumber: '',
      condition: 'good',
      additionalNotes: '',
    },
    heater: {
      type: 'gas',
      manufacturer: '',
      model: '',
      serialNumber: '',
      condition: 'good',
      additionalNotes: '',
    },
    timer: {
      type: 'mechanical',
      timerSynced: false,
      startHour: '9',
      startMinutes: '00',
      startAmPm: 'AM',
      endHour: '5',
      endMinutes: '00',
      endAmPm: 'PM',
      manufacturer: '',
      model: '',
      serialNumber: '',
      condition: 'good',
      additionalNotes: '',
    },
    valves: {
      condition: 'good',
      valvesLabeled: false,
      additionalNotes: '',
    },
  });

  const updateEquipmentField = (
    tab: EquipmentTab,
    field: string,
    value: any
  ) => {
    setEquipmentData(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value,
      },
    }));
  };

  const handleTakePhoto = async (tab: EquipmentTab) => {
    try {
      const result = await launchCamera({ mediaTypes: 'photo' });
      if (!result.cancelled && result.uri) {
        updateEquipmentField(tab, 'photoUri', result.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSubmit = () => {
    // Convert equipment data to Equipment[] format
    const equipment: Equipment[] = [];
    
    // Add pump if exists
    if (equipmentData.pump.manufacturer || equipmentData.pump.model) {
      equipment.push({
        id: `pump_${Date.now()}`,
        type: 'pump',
        manufacturer: equipmentData.pump.manufacturer,
        model: equipmentData.pump.model,
        condition: equipmentData.pump.condition,
        photoUri: equipmentData.pump.photoUri,
      });
    }

    // Add filter if exists
    if (equipmentData.filter.manufacturer || equipmentData.filter.type) {
      equipment.push({
        id: `filter_${Date.now()}`,
        type: 'filter',
        manufacturer: equipmentData.filter.manufacturer,
        model: equipmentData.filter.model,
        condition: equipmentData.filter.condition,
        photoUri: equipmentData.filter.photoUri,
      });
    }

    // Add sanitizer if exists
    if (equipmentData.sanitizer.manufacturer || equipmentData.sanitizer.model) {
      equipment.push({
        id: `sanitizer_${Date.now()}`,
        type: 'sanitizer',
        manufacturer: equipmentData.sanitizer.manufacturer,
        model: equipmentData.sanitizer.model,
        condition: equipmentData.sanitizer.condition,
        photoUri: equipmentData.sanitizer.photoUri,
      });
    }

    // Add heater if exists
    if (equipmentData.heater.manufacturer || equipmentData.heater.model) {
      equipment.push({
        id: `heater_${Date.now()}`,
        type: 'heater',
        manufacturer: equipmentData.heater.manufacturer,
        model: equipmentData.heater.model,
        condition: equipmentData.heater.condition,
        photoUri: equipmentData.heater.photoUri,
      });
    }

    // Add timer if exists
    if (equipmentData.timer.manufacturer || equipmentData.timer.model || equipmentData.timer.type === 'mechanical') {
      equipment.push({
        id: `timer_${Date.now()}`,
        type: 'other',
        manufacturer: equipmentData.timer.manufacturer || 'Timer',
        model: equipmentData.timer.model || equipmentData.timer.type,
        condition: equipmentData.timer.condition,
        photoUri: equipmentData.timer.photoUri,
      });
    }

    // Add valves if condition is assessed
    if (equipmentData.valves.condition) {
      equipment.push({
        id: `valves_${Date.now()}`,
        type: 'other',
        manufacturer: 'Valves',
        model: 'Pool Valves',
        condition: equipmentData.valves.condition,
        photoUri: equipmentData.valves.photoUri,
      });
    }
    
    onNext(equipment);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pump':
        return (
          <Card style={styles.contentCard} variant="glass">
            <Text style={styles.tabTitle}>Pump Information</Text>
            
            <ModernInput
              label="Manufacturer"
              value={equipmentData.pump.manufacturer}
              onChangeText={(text) => updateEquipmentField('pump', 'manufacturer', text)}
              placeholder="e.g., Pentair, Hayward"
            />
            
            <ModernInput
              label="Model"
              value={equipmentData.pump.model}
              onChangeText={(text) => updateEquipmentField('pump', 'model', text)}
              placeholder="Model number"
            />
            
            <View style={styles.row}>
              <View style={styles.halfField}>
                <ModernInput
                  label="Horsepower"
                  value={equipmentData.pump.horsepower}
                  onChangeText={(text) => updateEquipmentField('pump', 'horsepower', text)}
                  keyboardType="decimal-pad"
                  placeholder="e.g., 1.5"
                />
              </View>
              <View style={styles.halfField}>
                <ModernInput
                  label="Age (years)"
                  value={equipmentData.pump.age}
                  onChangeText={(text) => updateEquipmentField('pump', 'age', text)}
                  keyboardType="number-pad"
                  placeholder="e.g., 3"
                />
              </View>
            </View>
            
            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.conditionButton,
                    equipmentData.pump.condition === option.value && styles.conditionButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('pump', 'condition', option.value)}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      equipmentData.pump.condition === option.value && styles.conditionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {renderPhotoSection('pump')}
          </Card>
        );

      case 'filter':
        return (
          <Card style={styles.contentCard} variant="elevated">
            <Text style={styles.tabTitle}>Filter Information</Text>
            
            <ModernInput
              label="Filter Type"
              value={equipmentData.filter.type}
              onChangeText={(text) => updateEquipmentField('filter', 'type', text)}
              placeholder="e.g., Sand, Cartridge, DE"
            />
            
            <ModernInput
              label="Manufacturer"
              value={equipmentData.filter.manufacturer}
              onChangeText={(text) => updateEquipmentField('filter', 'manufacturer', text)}
              placeholder="e.g., Pentair, Hayward"
            />
            
            <ModernInput
              label="Model"
              value={equipmentData.filter.model}
              onChangeText={(text) => updateEquipmentField('filter', 'model', text)}
              placeholder="Model number"
            />
            
            <ModernInput
              label="Serial Number"
              value={equipmentData.filter.serialNumber}
              onChangeText={(text) => updateEquipmentField('filter', 'serialNumber', text)}
              placeholder="Serial number"
            />
            
            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.conditionButton,
                    equipmentData.filter.condition === option.value && styles.conditionButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('filter', 'condition', option.value)}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      equipmentData.filter.condition === option.value && styles.conditionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.fieldLabel}>Cartridge Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.conditionButton,
                    equipmentData.filter.cartridgeCondition === option.value && styles.conditionButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('filter', 'cartridgeCondition', option.value)}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      equipmentData.filter.cartridgeCondition === option.value && styles.conditionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <ModernInput
              label="Cartridge Model"
              value={equipmentData.filter.cartridgeModel}
              onChangeText={(text) => updateEquipmentField('filter', 'cartridgeModel', text)}
              placeholder="e.g., C-7482, PLF105A"
            />
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => updateEquipmentField('filter', 'cartridgeNeedsReplacement', !equipmentData.filter.cartridgeNeedsReplacement)}
            >
              <View style={[styles.checkbox, equipmentData.filter.cartridgeNeedsReplacement && styles.checkboxChecked]}>
                {equipmentData.filter.cartridgeNeedsReplacement && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Cartridge needs replacement</Text>
            </TouchableOpacity>
            
            {renderPhotoSection('filter')}
          </Card>
        );

      case 'sanitizer':
        return (
          <Card style={styles.contentCard} variant="elevated">
            <Text style={styles.tabTitle}>Sanitizer Information</Text>
            
            <View style={styles.aiPhotoSection}>
              <Ionicons name="camera-outline" size={24} color={theme.colors.blueGreen} />
              <Text style={styles.aiPhotoText}>AI Photo Analyzer</Text>
            </View>
            
            <Text style={styles.fieldLabel}>Sanitizer Type*</Text>
            <Text style={styles.aiHelpText}>AI will analyze photos to help identify</Text>
            <View style={styles.sanitizerTypeRow}>
              {['salt', 'chlorine', 'UV', 'ozone', 'mineral'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    equipmentData.sanitizer.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('sanitizer', 'type', type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      equipmentData.sanitizer.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <ModernInput
              label="Manufacturer"
              value={equipmentData.sanitizer.manufacturer}
              onChangeText={(text) => updateEquipmentField('sanitizer', 'manufacturer', text)}
              placeholder="e.g., Pentair, Hayward"
            />
            
            <ModernInput
              label="Model"
              value={equipmentData.sanitizer.model}
              onChangeText={(text) => updateEquipmentField('sanitizer', 'model', text)}
              placeholder="Model name/number"
            />
            
            <ModernInput
              label="Serial Number"
              value={equipmentData.sanitizer.serialNumber}
              onChangeText={(text) => updateEquipmentField('sanitizer', 'serialNumber', text)}
              placeholder="Serial number"
            />
            
            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.conditionButton,
                    equipmentData.sanitizer.condition === option.value && styles.conditionButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('sanitizer', 'condition', option.value)}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      equipmentData.sanitizer.condition === option.value && styles.conditionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <ModernInput
              label="Additional Notes"
              value={equipmentData.sanitizer.additionalNotes}
              onChangeText={(text) => updateEquipmentField('sanitizer', 'additionalNotes', text)}
              placeholder="Any additional information..."
              multiline
              numberOfLines={3}
            />
            
            {renderPhotoSection('sanitizer')}
          </Card>
        );

      case 'heater':
        return (
          <Card style={styles.contentCard} variant="elevated">
            <Text style={styles.tabTitle}>Heater Information</Text>
            
            <View style={styles.aiPhotoSection}>
              <Ionicons name="camera-outline" size={24} color={theme.colors.blueGreen} />
              <Text style={styles.aiPhotoText}>AI Photo Analyzer</Text>
            </View>
            
            <Text style={styles.fieldLabel}>Heater Type</Text>
            <Text style={styles.aiHelpText}>AI will analyze photos to help identify</Text>
            <View style={styles.heaterTypeRow}>
              {['gas', 'electric', 'heat-pump', 'solar'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    equipmentData.heater.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('heater', 'type', type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      equipmentData.heater.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type === 'heat-pump' ? 'Heat Pump' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <ModernInput
              label="Manufacturer"
              value={equipmentData.heater.manufacturer}
              onChangeText={(text) => updateEquipmentField('heater', 'manufacturer', text)}
              placeholder="e.g., Raypak, Hayward"
            />
            
            <ModernInput
              label="Model"
              value={equipmentData.heater.model}
              onChangeText={(text) => updateEquipmentField('heater', 'model', text)}
              placeholder="Model number"
            />
            
            <ModernInput
              label="Serial Number"
              value={equipmentData.heater.serialNumber}
              onChangeText={(text) => updateEquipmentField('heater', 'serialNumber', text)}
              placeholder="Serial number"
            />
            
            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.conditionButton,
                    equipmentData.heater.condition === option.value && styles.conditionButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('heater', 'condition', option.value)}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      equipmentData.heater.condition === option.value && styles.conditionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <ModernInput
              label="Additional Notes"
              value={equipmentData.heater.additionalNotes}
              onChangeText={(text) => updateEquipmentField('heater', 'additionalNotes', text)}
              placeholder="Any additional information..."
              multiline
              numberOfLines={3}
            />
            
            {renderPhotoSection('heater')}
          </Card>
        );

      case 'timer':
        return (
          <Card style={styles.contentCard} variant="elevated">
            <Text style={styles.tabTitle}>Timer Information</Text>
            
            <View style={styles.aiPhotoSection}>
              <Ionicons name="camera-outline" size={24} color={theme.colors.blueGreen} />
              <Text style={styles.aiPhotoText}>AI Photo Analyzer</Text>
            </View>
            
            <Text style={styles.fieldLabel}>Timer Type</Text>
            <Text style={styles.aiHelpText}>AI will analyze photos to help identify</Text>
            <View style={styles.timerTypeRow}>
              {['mechanical', 'automated', 'digital', 'smart'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    equipmentData.timer.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('timer', 'type', type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      equipmentData.timer.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {equipmentData.timer.type === 'mechanical' && (
              <>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => updateEquipmentField('timer', 'timerSynced', !equipmentData.timer.timerSynced)}
                >
                  <View style={[styles.checkbox, equipmentData.timer.timerSynced && styles.checkboxChecked]}>
                    {equipmentData.timer.timerSynced && (
                      <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Timer is synced with current time</Text>
                </TouchableOpacity>
                
                <Text style={styles.fieldLabel}>Start Time</Text>
                <View style={styles.timePickerRow}>
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timePickerLabel}>Hour</Text>
                    <TouchableOpacity style={styles.timePicker}>
                      <Text style={styles.timePickerText}>{equipmentData.timer.startHour}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timePickerLabel}>Minutes</Text>
                    <TouchableOpacity style={styles.timePicker}>
                      <Text style={styles.timePickerText}>{equipmentData.timer.startMinutes}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timePickerLabel}>AM/PM</Text>
                    <TouchableOpacity style={styles.timePicker}>
                      <Text style={styles.timePickerText}>{equipmentData.timer.startAmPm}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.fieldLabel}>End Time</Text>
                <View style={styles.timePickerRow}>
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timePickerLabel}>Hour</Text>
                    <TouchableOpacity style={styles.timePicker}>
                      <Text style={styles.timePickerText}>{equipmentData.timer.endHour}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timePickerLabel}>Minutes</Text>
                    <TouchableOpacity style={styles.timePicker}>
                      <Text style={styles.timePickerText}>{equipmentData.timer.endMinutes}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timePickerContainer}>
                    <Text style={styles.timePickerLabel}>AM/PM</Text>
                    <TouchableOpacity style={styles.timePicker}>
                      <Text style={styles.timePickerText}>{equipmentData.timer.endAmPm}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            
            {['automated', 'digital', 'smart'].includes(equipmentData.timer.type) && (
              <>
                <ModernInput
                  label="Manufacturer"
                  value={equipmentData.timer.manufacturer}
                  onChangeText={(text) => updateEquipmentField('timer', 'manufacturer', text)}
                  placeholder="e.g., Pentair, Hayward"
                />
                
                <ModernInput
                  label="Model"
                  value={equipmentData.timer.model}
                  onChangeText={(text) => updateEquipmentField('timer', 'model', text)}
                  placeholder="Model number"
                />
                
                <ModernInput
                  label="Serial Number"
                  value={equipmentData.timer.serialNumber}
                  onChangeText={(text) => updateEquipmentField('timer', 'serialNumber', text)}
                  placeholder="Serial number"
                />
              </>
            )}
            
            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.conditionButton,
                    equipmentData.timer.condition === option.value && styles.conditionButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('timer', 'condition', option.value)}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      equipmentData.timer.condition === option.value && styles.conditionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <ModernInput
              label="Additional Notes"
              value={equipmentData.timer.additionalNotes}
              onChangeText={(text) => updateEquipmentField('timer', 'additionalNotes', text)}
              placeholder="Any additional information..."
              multiline
              numberOfLines={3}
            />
            
            {renderPhotoSection('timer')}
          </Card>
        );

      case 'valves':
        return (
          <Card style={styles.contentCard} variant="elevated">
            <Text style={styles.tabTitle}>Valves Information</Text>
            
            <View style={styles.aiPhotoSection}>
              <Ionicons name="camera-outline" size={24} color={theme.colors.blueGreen} />
              <Text style={styles.aiPhotoText}>AI Photo Analyzer</Text>
            </View>
            
            <Text style={styles.fieldLabel}>Valve Condition</Text>
            <View style={styles.conditionRow}>
              {CONDITION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.conditionButton,
                    equipmentData.valves.condition === option.value && styles.conditionButtonActive,
                  ]}
                  onPress={() => updateEquipmentField('valves', 'condition', option.value)}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      equipmentData.valves.condition === option.value && styles.conditionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => updateEquipmentField('valves', 'valvesLabeled', !equipmentData.valves.valvesLabeled)}
            >
              <View style={[styles.checkbox, equipmentData.valves.valvesLabeled && styles.checkboxChecked]}>
                {equipmentData.valves.valvesLabeled && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Valves are properly labeled</Text>
            </TouchableOpacity>
            
            <ModernInput
              label="Additional Notes"
              value={equipmentData.valves.additionalNotes}
              onChangeText={(text) => updateEquipmentField('valves', 'additionalNotes', text)}
              placeholder="Any additional information..."
              multiline
              numberOfLines={3}
            />
            
            {renderPhotoSection('valves')}
          </Card>
        );

      default:
        return null;
    }
  };

  const renderPhotoSection = (tab: EquipmentTab) => {
    const photoUri = equipmentData[tab].photoUri;
    
    return (
      <View style={styles.photoSection}>
        <Text style={styles.fieldLabel}>Photo</Text>
        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => updateEquipmentField(tab, 'photoUri', undefined)}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={() => handleTakePhoto(tab)}
          >
            <Ionicons name="camera-outline" size={32} color={theme.colors.blueGreen} />
            <Text style={styles.addPhotoText}>Take Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? theme.colors.white : theme.colors.gray}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderTabContent()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <GradientButton
            title="Back"
            onPress={onBack}
            variant="outline"
            size="large"
            style={styles.backButton}
          />
          <GradientButton
            title="Next"
            onPress={handleSubmit}
            size="large"
            style={styles.nextButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabScrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  tabActive: {
    backgroundColor: theme.colors.blueGreen,
  },
  tabText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  contentCard: {
    padding: theme.spacing.lg,
  },
  tabTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.gray,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.sm,
  },
  halfField: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  conditionButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    margin: theme.spacing.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: theme.colors.white,
  },
  conditionButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
    shadowColor: theme.colors.blueGreen,
    shadowOpacity: 0.3,
    transform: [{ scale: 1.02 }],
  },
  conditionButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    fontWeight: '600',
  },
  conditionButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  sanitizerTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  heaterTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  timerTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  typeButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    margin: theme.spacing.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: theme.colors.white,
  },
  typeButtonActive: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
    shadowColor: theme.colors.blueGreen,
    shadowOpacity: 0.3,
    transform: [{ scale: 1.02 }],
  },
  typeButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  photoSection: {
    marginTop: theme.spacing.lg,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.grayLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  removePhotoButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
  },
  addPhotoButton: {
    height: 140,
    borderWidth: 2,
    borderColor: theme.colors.blueGreen,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 125, 139, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addPhotoText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.blueGreen,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  nextButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  aiPhotoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.seaFoam,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  aiPhotoText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.blueGreen,
  },
  aiHelpText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  checkboxLabel: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkBlue,
    flex: 1,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  timePickerContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  timePickerLabel: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  timePicker: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
});