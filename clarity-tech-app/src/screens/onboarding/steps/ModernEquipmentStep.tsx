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
  console.log('🔴 EQUIPMENT PHOTOS from data:', data?.equipmentPhotos);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    success: boolean;
    confidence?: number;
    message?: string;
  } | null>(null);
  
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
    const formData: any = {};
    let photoUris: string[] = [];
    
    // First check if we have equipment array data
    if (data?.equipment && Array.isArray(data.equipment) && data.equipment.length > 0) {
      console.log('🔴 EQUIPMENT: Loading existing equipment data:', data.equipment);
      
      // Convert equipment array back to form fields
      data.equipment.forEach((item: Equipment) => {
        // Collect all photo URIs
        if (item.photoUri) {
          photoUris.push(item.photoUri);
        }
        
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
    }
    
    // Check for saved equipment step data from Save & Exit
    if (data?.equipmentStepData) {
      console.log('🔴 EQUIPMENT: Found saved equipment step data:', data.equipmentStepData);
      // Merge the saved form data
      Object.assign(formData, data.equipmentStepData);
      // Extract photos if they exist
      if (data.equipmentStepData.equipmentPhotos && Array.isArray(data.equipmentStepData.equipmentPhotos)) {
        photoUris = data.equipmentStepData.equipmentPhotos;
      }
    }
    
    // Add photos to form data
    if (photoUris.length > 0) {
      formData.equipmentPhotos = photoUris;
      console.log('🔴 EQUIPMENT: Loading saved photos:', photoUris);
    }
    
    // Only reset if we have data to load
    if (Object.keys(formData).length > 0) {
      console.log('🔴 EQUIPMENT: Resetting form with data:', formData);
      reset(formData);
    }
  }, [data?.equipment, data?.equipmentStepData, reset]);

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
      console.log('🔴 SAVING PHOTOS:', photos);
      setValue('equipmentPhotos', photos);
      
      setAnalysisComplete(true);
      
      // Set analysis result instead of Alert
      setAnalysisResult({
        success: true,
        confidence: analysisResult.confidence || 87,
        message: 'Equipment analysis complete'
      });
      
      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setAnalysisResult(null);
      }, 5000);
      
    } catch (error) {
      console.error('Equipment analysis failed:', error);
      setAnalysisResult({
        success: false,
        message: 'Analysis failed. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = (formData: any) => {
    console.log('🔴 EQUIPMENT onSubmit data structure:', formData);
    console.log('🔴 EQUIPMENT onSubmit photos:', formData.equipmentPhotos);
    
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
        id: `filter-${Date.now() + 1}`,
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
        id: `sanitizer-${Date.now() + 2}`,
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
        id: `heater-${Date.now() + 3}`,
        type: 'heater',
        manufacturer: formData.heaterManufacturer || '',
        model: formData.heaterModel || '',
        serial: formData.heaterSerialNumber,
        condition: formData.heaterCondition || 'good',
        photoUri: formData.equipmentPhotos?.[3],
      });
    }
    
    console.log('🔴 EQUIPMENT calling onNext with array:', equipmentArray);
    console.log('🔴 EQUIPMENT photos being saved:', formData.equipmentPhotos);
    onNext(equipmentArray);
  };

  React.useImperativeHandle(ref, () => ({
    submitForm: () => handleSubmit(onSubmit)(),
    getCurrentData: () => {
      const currentData = watch();
      console.log('🔴 EQUIPMENT getCurrentData:', currentData);
      console.log('🔴 EQUIPMENT getCurrentData photos:', currentData.equipmentPhotos);
      return currentData;
    },
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
          initialPhotos={watch('equipmentPhotos') || []}
        />
        
        {analysisResult && (
          <View style={[
            styles.analysisResultBanner,
            analysisResult.success ? styles.successBanner : styles.errorBanner
          ]}>
            <Ionicons 
              name={analysisResult.success ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={analysisResult.success ? theme.colors.success : theme.colors.error} 
            />
            <Text style={styles.analysisResultText}>
              {analysisResult.message}
              {analysisResult.confidence && ` - ${analysisResult.confidence}% confidence`}
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

        {/* Additional Pump Checkboxes */}
        <View style={styles.checkboxGroup}>
          <Controller
            control={control}
            name="pumpPrimes"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Pump primes properly</Text>
              </TouchableOpacity>
            )}
          />
          <Controller
            control={control}
            name="pumpLidWorks"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Pump lid seals properly</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <Controller
          control={control}
          name="pumpNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Additional Notes"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      {/* FILTER SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="filter-outline" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.sectionTitle}>Filter Information</Text>
        </View>
        
        {/* Filter Type Selection */}
        <Text style={styles.fieldLabel}>Filter Type</Text>
        <View style={styles.optionsRow}>
          {FILTER_TYPES.map((type) => (
            <Controller
              key={type.value}
              control={control}
              name="filterType"
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
              name="filterManufacturer"
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
              name="filterModel"
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
          name="filterSerialNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Serial Number"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {/* Filter Condition */}
        <Text style={styles.fieldLabel}>Filter Condition</Text>
        <View style={styles.conditionGrid}>
          {CONDITION_OPTIONS.map((option) => (
            <Controller
              key={option.value}
              control={control}
              name="filterCondition"
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

        {/* Cartridge Information */}
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>Cartridge Details</Text>
          <Controller
            control={control}
            name="cartridgeModel"
            render={({ field: { onChange, onBlur, value } }) => (
              <ModernInput
                label="Cartridge Model"
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g., Unicel C-4950"
              />
            )}
          />
          <Controller
            control={control}
            name="cartridgeNeedsReplacement"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Cartridge needs replacement</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <Controller
          control={control}
          name="filterNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Additional Notes"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      {/* SANITIZER SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.sectionTitle}>Sanitizer System</Text>
        </View>
        
        <Text style={styles.fieldLabel}>Sanitizer Type</Text>
        <View style={styles.optionsRow}>
          {SANITIZER_TYPES.map((type) => (
            <Controller
              key={type.value}
              control={control}
              name="sanitizerType"
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
              name="sanitizerManufacturer"
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
              name="sanitizerModel"
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
          name="sanitizerSerialNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Serial Number"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Text style={styles.fieldLabel}>Sanitizer Condition</Text>
        <View style={styles.conditionGrid}>
          {CONDITION_OPTIONS.map((option) => (
            <Controller
              key={option.value}
              control={control}
              name="sanitizerCondition"
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

        <Controller
          control={control}
          name="sanitizerNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Additional Notes"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      {/* HEATER SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flame-outline" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.sectionTitle}>Heater Information</Text>
        </View>
        
        <Text style={styles.fieldLabel}>Heater Type</Text>
        <View style={styles.optionsRow}>
          {HEATER_TYPES.map((type) => (
            <Controller
              key={type.value}
              control={control}
              name="heaterType"
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
              name="heaterManufacturer"
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
              name="heaterModel"
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
          name="heaterSerialNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Serial Number"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Text style={styles.fieldLabel}>Heater Condition</Text>
        <View style={styles.conditionGrid}>
          {CONDITION_OPTIONS.map((option) => (
            <Controller
              key={option.value}
              control={control}
              name="heaterCondition"
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

        <Controller
          control={control}
          name="heaterNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Additional Notes"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      {/* TIMER SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.sectionTitle}>Timer Settings</Text>
        </View>
        
        <Text style={styles.fieldLabel}>Timer Type</Text>
        <View style={styles.optionsRow}>
          {TIMER_TYPES.map((type) => (
            <Controller
              key={type.value}
              control={control}
              name="timerType"
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
              name="timerManufacturer"
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
              name="timerModel"
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

        {/* Timer Schedule */}
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>Current Schedule</Text>
          <View style={styles.row}>
            <View style={styles.thirdField}>
              <Controller
                control={control}
                name="timerStartHour"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label="Start Hour"
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                )}
              />
            </View>
            <View style={styles.thirdField}>
              <Controller
                control={control}
                name="timerStartMinute"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label="Minutes"
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                )}
              />
            </View>
            <View style={styles.thirdField}>
              <Text style={styles.fieldLabel}>Period</Text>
              <View style={styles.periodRow}>
                {['AM', 'PM'].map((period) => (
                  <Controller
                    key={period}
                    control={control}
                    name="timerStartPeriod"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        style={[
                          styles.periodButton,
                          value === period && styles.periodButtonSelected
                        ]}
                        onPress={() => onChange(period)}
                      >
                        <Text style={[
                          styles.periodText,
                          value === period && styles.periodTextSelected
                        ]}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.thirdField}>
              <Controller
                control={control}
                name="timerEndHour"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label="End Hour"
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                )}
              />
            </View>
            <View style={styles.thirdField}>
              <Controller
                control={control}
                name="timerEndMinute"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label="Minutes"
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                )}
              />
            </View>
            <View style={styles.thirdField}>
              <Text style={styles.fieldLabel}>Period</Text>
              <View style={styles.periodRow}>
                {['AM', 'PM'].map((period) => (
                  <Controller
                    key={period}
                    control={control}
                    name="timerEndPeriod"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        style={[
                          styles.periodButton,
                          value === period && styles.periodButtonSelected
                        ]}
                        onPress={() => onChange(period)}
                      >
                        <Text style={[
                          styles.periodText,
                          value === period && styles.periodTextSelected
                        ]}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <Controller
          control={control}
          name="timerSynced"
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                {value && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>Timer schedule is synced correctly</Text>
            </TouchableOpacity>
          )}
        />

        <Controller
          control={control}
          name="timerNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Additional Notes"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      {/* VALVES SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="git-branch-outline" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.sectionTitle}>Valves & Plumbing</Text>
        </View>
        
        <Text style={styles.fieldLabel}>Valve Condition</Text>
        <View style={styles.conditionGrid}>
          {CONDITION_OPTIONS.map((option) => (
            <Controller
              key={option.value}
              control={control}
              name="valveCondition"
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

        <Controller
          control={control}
          name="valvesProperlyLabeled"
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                {value && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>All valves are properly labeled</Text>
            </TouchableOpacity>
          )}
        />

        <Controller
          control={control}
          name="valveNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Additional Notes"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              placeholder="Note any leaks, difficult valves, or plumbing issues"
            />
          )}
        />
      </View>

      {/* EQUIPMENT PAD SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="speedometer-outline" size={24} color={theme.colors.blueGreen} />
          <Text style={styles.sectionTitle}>Equipment Pad</Text>
        </View>
        
        <Controller
          control={control}
          name="pressureReading"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Pressure Gauge Reading (PSI)"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="numeric"
              placeholder="e.g., 15"
            />
          )}
        />

        <Controller
          control={control}
          name="equipmentPadNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <ModernInput
              label="Equipment Pad Notes"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              placeholder="Overall condition, organization, accessibility, electrical concerns, etc."
            />
          )}
        />
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
  analysisResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  errorBanner: {
    backgroundColor: theme.colors.error + '20',
  },
  analysisResultText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.text,
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
  checkboxGroup: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  checkboxLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    flex: 1,
  },
  subSection: {
    backgroundColor: theme.colors.seaFoam + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing.md,
  },
  subSectionTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
  },
  thirdField: {
    flex: 1,
  },
  periodRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  periodButtonSelected: {
    backgroundColor: theme.colors.blueGreen,
    borderColor: theme.colors.blueGreen,
  },
  periodText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  periodTextSelected: {
    color: theme.colors.white,
    fontWeight: '600',
  },
});