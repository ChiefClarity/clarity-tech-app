import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';

import { ModernInput } from '../../../components/ui/ModernInput';
import { AIPhotoAnalyzer } from '../../../components/ui/AIPhotoAnalyzer';
import { theme } from '../../../styles/theme';
import { Equipment } from '../../../types';
import { analyzeEquipmentPhotos } from '../../../services/mockAI';

interface ModernEquipmentStepProps {
  data: any;
  onNext: (data: Equipment[]) => void;
  onBack?: () => void;
}

const PUMP_TYPES = [
  { value: 'single-speed', label: 'Single Speed' },
  { value: 'variable-speed', label: 'Variable Speed' },
  { value: 'two-speed', label: 'Two Speed' },
];

const FILTER_TYPES = [
  { value: 'cartridge', label: 'Cartridge' },
  { value: 'DE', label: 'DE (Diatomaceous Earth)' },
  { value: 'sand', label: 'Sand' },
];

const SANITIZER_TYPES = [
  { value: 'salt', label: 'Salt Water System' },
  { value: 'chlorine', label: 'Chlorine' },
  { value: 'UV', label: 'UV Sanitizer' },
  { value: 'ozone', label: 'Ozone' },
];

const HEATER_TYPES = [
  { value: 'gas', label: 'Gas Heater' },
  { value: 'electric', label: 'Electric Heater' },
  { value: 'heat-pump', label: 'Heat Pump' },
  { value: 'solar', label: 'Solar Heater' },
];

const TIMER_TYPES = [
  { value: 'mechanical', label: 'Mechanical Timer' },
  { value: 'digital', label: 'Digital Timer' },
  { value: 'smart', label: 'Smart Timer' },
];

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: theme.colors.success },
  { value: 'good', label: 'Good', color: theme.colors.blueGreen },
  { value: 'fair', label: 'Fair', color: theme.colors.warning },
  { value: 'poor', label: 'Poor', color: theme.colors.error },
  { value: 'needs_replacement', label: 'Needs Replacement', color: theme.colors.error },
];

export const ModernEquipmentStep = React.forwardRef<
  { submitForm: () => void; getCurrentData: () => any },
  ModernEquipmentStepProps
>(({ data, onNext }, ref) => {
  console.log('🔴 EQUIPMENT PROPS:', { data });
  console.log('🔴 EQUIPMENT data.equipment:', data?.equipment);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      // PUMP FIELDS
      pumpType: '',
      pumpManufacturer: '',
      pumpModel: '',
      pumpSerialNumber: '',
      pumpCondition: '',
      pumpBasketCondition: '',
      pumpPrimes: false,
      pumpLidWorks: false,
      pumpNotes: '',
      
      // FILTER FIELDS
      filterType: '',
      filterManufacturer: '',
      filterModel: '',
      filterSerialNumber: '',
      filterCondition: '',
      filterLidWorks: false,
      filterNotes: '',
      cartridgeModel: '',
      cartridgeCondition: '',
      cartridgeNeedsReplacement: false,
      
      // SANITIZER FIELDS
      sanitizerType: '',
      sanitizerManufacturer: '',
      sanitizerModel: '',
      sanitizerSerialNumber: '',
      sanitizerCondition: '',
      sanitizerNotes: '',
      
      // HEATER FIELDS
      heaterType: '',
      heaterManufacturer: '',
      heaterModel: '',
      heaterSerialNumber: '',
      heaterCondition: '',
      heaterNotes: '',
      
      // TIMER FIELDS
      timerType: '',
      timerCondition: '',
      timerSynced: false,
      timerStartHour: '',
      timerStartMinute: '00',
      timerStartPeriod: 'AM',
      timerEndHour: '',
      timerEndMinute: '00',
      timerEndPeriod: 'PM',
      timerManufacturer: '',
      timerModel: '',
      timerSerialNumber: '',
      timerNotes: '',
      
      // VALVE FIELDS
      valveCondition: '',
      valvesProperlyLabeled: false,
      valveNotes: '',
      
      // EQUIPMENT PAD FIELDS
      pressureReading: '',
      equipmentPadNotes: '',
      
      // SINGLE PHOTOS ARRAY
      equipmentPhotos: [] as string[],
    }
  });

  // Load existing equipment data when component mounts or data changes
  useEffect(() => {
    if (data?.equipment && Array.isArray(data.equipment) && data.equipment.length > 0) {
      console.log('🔴 EQUIPMENT: Loading existing equipment data:', data.equipment);
      
      const formData: any = {};
      
      // Convert equipment array back to form fields
      data.equipment.forEach((item: Equipment) => {
        if (item.type === 'pump') {
          formData.pumpType = item.manufacturer?.toLowerCase().includes('variable') ? 'variable-speed' : 'single-speed';
          formData.pumpManufacturer = item.manufacturer || '';
          formData.pumpModel = item.model || '';
          formData.pumpSerialNumber = item.serial || '';
          formData.pumpCondition = item.condition || '';
        } else if (item.type === 'filter') {
          formData.filterType = 'cartridge'; // Default since it's not stored
          formData.filterManufacturer = item.manufacturer || '';
          formData.filterModel = item.model || '';
          formData.filterSerialNumber = item.serial || '';
          formData.filterCondition = item.condition || '';
        } else if (item.type === 'sanitizer') {
          formData.sanitizerType = 'salt'; // Default since it's not stored
          formData.sanitizerManufacturer = item.manufacturer || '';
          formData.sanitizerModel = item.model || '';
          formData.sanitizerSerialNumber = item.serial || '';
          formData.sanitizerCondition = item.condition || '';
        } else if (item.type === 'heater') {
          formData.heaterType = 'gas'; // Default since it's not stored
          formData.heaterManufacturer = item.manufacturer || '';
          formData.heaterModel = item.model || '';
          formData.heaterSerialNumber = item.serial || '';
          formData.heaterCondition = item.condition || '';
        }
      });
      
      console.log('🔴 EQUIPMENT: Resetting form with data:', formData);
      reset(formData);
    }
  }, [data?.equipment, reset]);

  // Master AI analysis handler
  const handleEquipmentAnalysis = async (photos: string[]) => {
    setIsAnalyzing(true);
    
    try {
      // TODO: Replace with production API call
      const analysisResult = await analyzeEquipmentPhotos(photos);
      
      // Auto-populate ALL fields based on AI analysis
      if (analysisResult.pump) {
        setValue('pumpType', analysisResult.pump.type || '');
        setValue('pumpManufacturer', analysisResult.pump.manufacturer || '');
        setValue('pumpModel', analysisResult.pump.model || '');
        setValue('pumpSerialNumber', analysisResult.pump.serialNumber || '');
        setValue('pumpCondition', analysisResult.pump.condition || '');
      }
      
      if (analysisResult.filter) {
        setValue('filterType', analysisResult.filter.type || '');
        setValue('filterManufacturer', analysisResult.filter.manufacturer || '');
        setValue('filterModel', analysisResult.filter.model || '');
        setValue('filterSerialNumber', analysisResult.filter.serialNumber || '');
        setValue('filterCondition', analysisResult.filter.condition || '');
        setValue('cartridgeModel', analysisResult.filter.cartridgeModel || '');
      }
      
      if (analysisResult.sanitizer) {
        setValue('sanitizerType', analysisResult.sanitizer.type || '');
        setValue('sanitizerManufacturer', analysisResult.sanitizer.manufacturer || '');
        setValue('sanitizerModel', analysisResult.sanitizer.model || '');
        setValue('sanitizerSerialNumber', analysisResult.sanitizer.serialNumber || '');
        setValue('sanitizerCondition', analysisResult.sanitizer.condition || '');
      }
      
      if (analysisResult.heater) {
        setValue('heaterType', analysisResult.heater.type || '');
        setValue('heaterManufacturer', analysisResult.heater.manufacturer || '');
        setValue('heaterModel', analysisResult.heater.model || '');
        setValue('heaterSerialNumber', analysisResult.heater.serialNumber || '');
        setValue('heaterCondition', analysisResult.heater.condition || '');
      }
      
      if (analysisResult.timer) {
        setValue('timerType', analysisResult.timer.type || '');
        setValue('timerManufacturer', analysisResult.timer.manufacturer || '');
        setValue('timerModel', analysisResult.timer.model || '');
        setValue('timerCondition', analysisResult.timer.condition || '');
        if (analysisResult.timer.startTime) {
          setValue('timerStartHour', analysisResult.timer.startTime.hour || '');
          setValue('timerStartMinute', analysisResult.timer.startTime.minute || '00');
          setValue('timerStartPeriod', analysisResult.timer.startTime.period || 'AM');
        }
        if (analysisResult.timer.endTime) {
          setValue('timerEndHour', analysisResult.timer.endTime.hour || '');
          setValue('timerEndMinute', analysisResult.timer.endTime.minute || '00');
          setValue('timerEndPeriod', analysisResult.timer.endTime.period || 'PM');
        }
      }
      
      if (analysisResult.pressureGauge) {
        setValue('pressureReading', analysisResult.pressureGauge.reading || '');
      }
      
      // Store all photos for report generation
      setValue('equipmentPhotos', photos);
      
      setAnalysisComplete(true);
      Alert.alert('Success', 'Equipment analysis complete! Please review and complete any missing fields.');
      
    } catch (error) {
      console.error('Equipment analysis failed:', error);
      Alert.alert('Analysis Error', 'Unable to analyze photos. Please fill in equipment details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = (formData: any) => {
    console.log('🔴 EQUIPMENT onSubmit data structure:', formData);
    
    // Convert flat form data to Equipment array
    const equipmentArray: Equipment[] = [];
    
    // Add pump if has data
    if (formData.pumpType || formData.pumpManufacturer || formData.pumpModel) {
      equipmentArray.push({
        id: `pump-${Date.now()}`,
        type: 'pump',
        manufacturer: formData.pumpManufacturer || '',
        model: formData.pumpModel || '',
        serial: formData.pumpSerialNumber,
        condition: formData.pumpCondition || 'good',
        photoUri: formData.equipmentPhotos?.[0],
      });
    }
    
    // Add filter if has data
    if (formData.filterType || formData.filterManufacturer || formData.filterModel) {
      equipmentArray.push({
        id: `filter-${Date.now()}`,
        type: 'filter',
        manufacturer: formData.filterManufacturer || '',
        model: formData.filterModel || '',
        serial: formData.filterSerialNumber,
        condition: formData.filterCondition || 'good',
        photoUri: formData.equipmentPhotos?.[1],
      });
    }
    
    // Add sanitizer if has data
    if (formData.sanitizerType || formData.sanitizerManufacturer || formData.sanitizerModel) {
      equipmentArray.push({
        id: `sanitizer-${Date.now()}`,
        type: 'sanitizer',
        manufacturer: formData.sanitizerManufacturer || '',
        model: formData.sanitizerModel || '',
        serial: formData.sanitizerSerialNumber,
        condition: formData.sanitizerCondition || 'good',
        photoUri: formData.equipmentPhotos?.[2],
      });
    }
    
    // Add heater if has data
    if (formData.heaterType || formData.heaterManufacturer || formData.heaterModel) {
      equipmentArray.push({
        id: `heater-${Date.now()}`,
        type: 'heater',
        manufacturer: formData.heaterManufacturer || '',
        model: formData.heaterModel || '',
        serial: formData.heaterSerialNumber,
        condition: formData.heaterCondition || 'good',
        photoUri: formData.equipmentPhotos?.[3],
      });
    }
    
    console.log('🔴 EQUIPMENT calling onNext with array:', equipmentArray);
    onNext(equipmentArray);
  };

  React.useImperativeHandle(ref, () => ({
    submitForm: () => handleSubmit(onSubmit)(),
    getCurrentData: () => watch(), // Returns current form values
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Equipment Assessment</Text>
        <Text style={styles.subtitle}>Document all pool equipment</Text>
      </View>

      {/* SINGLE MASTER AI PHOTO ANALYZER */}
      <View style={styles.aiAnalyzerSection}>
        <View style={styles.analyzerHeader}>
          <Ionicons name="camera-outline" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.analyzerTitle}>Equipment Photo Analysis</Text>
        </View>
        
        <Text style={styles.analyzerDescription}>
          Take clear photos of all equipment nameplates, model stickers, serial numbers, 
          pressure gauge, timer settings, and overall equipment pad. AI will analyze 
          and auto-fill equipment details.
        </Text>
        
        <View style={styles.photoInstructions}>
          <Text style={styles.photoInstructionsText}>
            Include photos of:{'\n'}
            • Pump nameplate and basket{'\n'}
            • Filter label and cartridge{'\n'}
            • Sanitizer system{'\n'}
            • Heater nameplate{'\n'}
            • Timer and settings{'\n'}
            • Pressure gauge reading{'\n'}
            • Overall equipment pad
          </Text>
        </View>
        
        <AIPhotoAnalyzer
          title="Equipment Photos"
          description=""
          maxPhotos={20}
          onAnalyze={handleEquipmentAnalysis}
        />
        
        {analysisComplete && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.successText}>
              Analysis complete! Review and complete fields below.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* PUMP SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="water-outline" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.sectionTitle}>Pump Information</Text>
        </View>
        
        {/* Pump Type Selection */}
        <Text style={styles.fieldLabel}>Pump Type</Text>
        <View style={styles.optionsRow}>
          {PUMP_TYPES.map((type) => (
            <Controller
              key={type.value}
              control={control}
              name="pumpType"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    value === type.value && styles.optionButtonSelected
                  ]}
                  onPress={() => onChange(type.value)}
                >
                  <Text style={[
                    styles.optionText,
                    value === type.value && styles.optionTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="pumpManufacturer"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Manufacturer"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="pumpModel"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Model"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="pumpSerialNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Serial Number"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {/* Pump Condition */}
        <Text style={styles.fieldLabel}>Pump Condition</Text>
        <View style={styles.conditionGrid}>
          {CONDITION_OPTIONS.map((option) => (
            <Controller
              key={option.value}
              control={control}
              name="pumpCondition"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={[
                    styles.conditionOption,
                    value === option.value && { 
                      backgroundColor: option.color + '20',
                      borderColor: option.color 
                    },
                  ]}
                  onPress={() => onChange(option.value)}
                >
                  <View style={[
                    styles.conditionDot,
                    { backgroundColor: option.color }
                  ]} />
                  <Text style={[
                    styles.conditionLabel,
                    value === option.value && { color: option.color, fontWeight: '600' }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ))}
        </View>

        {/* Similar sections for Filter, Sanitizer, Heater, etc. would go here */}
        {/* I'm keeping this short for now */}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
  },
  aiAnalyzerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.seaFoam + '30',
    marginBottom: theme.spacing.lg,
  },
  analyzerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  analyzerTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.sm,
  },
  analyzerDescription: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  photoInstructions: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  photoInstructionsText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    lineHeight: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  successText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.success,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  optionButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  optionText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
  },
  optionTextSelected: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfField: {
    flex: 1,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  conditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  conditionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },
  conditionLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
});