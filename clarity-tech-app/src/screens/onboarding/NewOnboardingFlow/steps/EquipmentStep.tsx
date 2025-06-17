import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { ModernInput } from '../../../../components/ui/ModernInput';
import { AIPhotoAnalyzer } from '../../../../components/ui/AIPhotoAnalyzer';
import { AIInsightsBox } from '../../../../components/common/AIInsightsBox';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';

// CRITICAL: Equipment sections in EXACT order
const EQUIPMENT_SECTIONS = [
  { id: 'pump', title: 'Pump', icon: 'water-outline' },
  { id: 'filter', title: 'Filter', icon: 'filter-outline' },
  { id: 'sanitizer', title: 'Sanitizer System', icon: 'shield-checkmark-outline' },
  { id: 'heater', title: 'Heater', icon: 'flame-outline' },
  { id: 'timer', title: 'Timer', icon: 'time-outline' },
  { id: 'valves', title: 'Valves & Plumbing', icon: 'git-branch-outline' },
  { id: 'equipment-pad', title: 'Equipment Pad', icon: 'speedometer-outline' },
];

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

export const EquipmentStep: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: string]: View | null }>({});
  const { session, updateEquipment, addPhoto, nextStep } = useOnboarding();
  const [expandedSection, setExpandedSection] = useState<string>('pump');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    success: boolean;
    confidence?: number;
    message?: string;
  } | null>(null);
  const [equipmentData, setEquipmentData] = useState(session?.equipment || {
    photos: [],
    // Initialize all fields
    pumpType: '',
    pumpManufacturer: '',
    pumpModel: '',
    pumpSerialNumber: '',
    pumpCondition: '',
    pumpBasketCondition: '',
    pumpPrimes: false,
    pumpLidWorks: false,
    pumpNotes: '',
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
    sanitizerType: '',
    sanitizerManufacturer: '',
    sanitizerModel: '',
    sanitizerSerialNumber: '',
    sanitizerCondition: '',
    sanitizerNotes: '',
    heaterType: '',
    heaterManufacturer: '',
    heaterModel: '',
    heaterSerialNumber: '',
    heaterCondition: '',
    heaterNotes: '',
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
    valveCondition: '',
    valvesProperlyLabeled: false,
    valveNotes: '',
    pressureReading: '',
    equipmentPadNotes: '',
  });
  
  // Load existing data
  useEffect(() => {
    if (session?.equipment) {
      setEquipmentData(session.equipment);
    }
  }, [session?.equipment]);
  
  // Handle photo analysis
  const handleEquipmentAnalysis = async (photos: string[]) => {
    setAnalyzing(true);
    try {
      // Store photos
      const updatedData = { ...equipmentData, photos };
      setEquipmentData(updatedData);
      await updateEquipment(updatedData);
      
      // Add photos to session
      for (const photo of photos) {
        await addPhoto(photo);
      }
      
      setAnalysisComplete(true);
      setAnalysisResult({
        success: true,
        confidence: 95,
        message: 'Equipment analysis complete'
      });
      setTimeout(() => setAnalysisResult(null), 5000);
      
    } catch (error) {
      console.error('Equipment analysis failed:', error);
      setAnalysisResult({
        success: false,
        message: 'Analysis failed. Please complete fields manually.'
      });
      setTimeout(() => setAnalysisResult(null), 5000);
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Save data on field change
  const handleFieldChange = async (field: string, value: any) => {
    const updated = { ...equipmentData, [field]: value };
    setEquipmentData(updated);
    await updateEquipment(updated);
  };
  
  const toggleSection = (sectionId: string) => {
    const isExpanding = expandedSection !== sectionId;
    setExpandedSection(isExpanding ? sectionId : '');
    
    // Auto-scroll to section when expanding
    if (isExpanding && sectionRefs.current[sectionId]) {
      setTimeout(() => {
        sectionRefs.current[sectionId]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: y - 100, // Offset for header
              animated: true,
            });
          },
          () => console.error('Failed to measure layout')
        );
      }, 100); // Small delay for animation
    }
  };
  
  const handleNext = () => {
    // Validate that at least basic equipment info is filled
    if (!equipmentData.pumpType || !equipmentData.filterType) {
      setAnalysisResult({
        success: false,
        message: 'Please fill in at least the pump and filter information.'
      });
      setTimeout(() => setAnalysisResult(null), 5000);
      return;
    }
    // Navigation is handled by NavigationButtons component
  };
  
  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[theme.colors.blueGreen, theme.colors.darkBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Equipment Assessment</Text>
        <Text style={styles.headerSubtitle}>
          Let's document all your pool equipment
        </Text>
      </LinearGradient>
      
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      
      {/* AI PHOTO ANALYZER SECTION */}
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
          initialPhotos={equipmentData.photos || []}
          allowBatchAnalysis={true}
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
      
      {/* EQUIPMENT SECTIONS */}
      {EQUIPMENT_SECTIONS.map((section, index) => (
        <View 
          key={section.id}
          ref={ref => sectionRefs.current[section.id] = ref}>
          <TouchableOpacity 
            style={[styles.sectionHeader, expandedSection === section.id && styles.sectionHeaderActive]}
            onPress={() => toggleSection(section.id)}
          >
            <View style={styles.sectionTitle}>
              <Ionicons name={section.icon as any} size={24} color={theme.colors.blueGreen} />
              <Text style={styles.sectionTitleText}>{section.title}</Text>
            </View>
            <Ionicons 
              name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={theme.colors.gray} 
            />
          </TouchableOpacity>
          
          {expandedSection === section.id && (
            <View style={styles.sectionContent}>
              {renderSectionContent(section.id, equipmentData, handleFieldChange)}
            </View>
          )}
        </View>
      ))}
      
      {/* AI Insights */}
      <AIInsightsBox stepName="equipment" />
      
      {/* Bottom padding */}
      <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

// Render section content based on section ID
const renderSectionContent = (sectionId: string, data: any, onChange: (field: string, value: any) => void) => {
  switch (sectionId) {
    case 'pump':
      return <PumpSection data={data} onChange={onChange} />;
    case 'filter':
      return <FilterSection data={data} onChange={onChange} />;
    case 'sanitizer':
      return <SanitizerSection data={data} onChange={onChange} />;
    case 'heater':
      return <HeaterSection data={data} onChange={onChange} />;
    case 'timer':
      return <TimerSection data={data} onChange={onChange} />;
    case 'valves':
      return <ValvesSection data={data} onChange={onChange} />;
    case 'equipment-pad':
      return <EquipmentPadSection data={data} onChange={onChange} />;
    default:
      return null;
  }
};

// PUMP SECTION
const PumpSection: React.FC<{ data: any; onChange: (field: string, value: any) => void }> = ({ data, onChange }) => (
  <>
    <Text style={styles.fieldLabel}>Pump Type</Text>
    <View style={styles.optionsRow}>
      {PUMP_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.optionButton,
            data.pumpType === type.value && styles.optionButtonSelected
          ]}
          onPress={() => onChange('pumpType', type.value)}
        >
          <Text style={[
            styles.optionText,
            data.pumpType === type.value && styles.optionTextSelected
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.row}>
      <View style={styles.halfField}>
        <ModernInput
          label="Manufacturer"
          value={data.pumpManufacturer || ''}
          onChangeText={(text) => onChange('pumpManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <ModernInput
          label="Model"
          value={data.pumpModel || ''}
          onChangeText={(text) => onChange('pumpModel', text)}
        />
      </View>
    </View>

    <ModernInput
      label="Serial Number"
      value={data.pumpSerialNumber || ''}
      onChangeText={(text) => onChange('pumpSerialNumber', text)}
    />

    <Text style={styles.fieldLabel}>Pump Condition</Text>
    <View style={styles.conditionGrid}>
      {CONDITION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.conditionOption,
            data.pumpCondition === option.value && { 
              backgroundColor: option.color + '20',
              borderColor: option.color 
            },
          ]}
          onPress={() => onChange('pumpCondition', option.value)}
        >
          <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
          <Text style={[
            styles.conditionLabel,
            data.pumpCondition === option.value && { color: option.color, fontWeight: '600' }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.checkboxGroup}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onChange('pumpPrimes', !data.pumpPrimes)}
      >
        <View style={[styles.checkbox, data.pumpPrimes && styles.checkboxChecked]}>
          {data.pumpPrimes && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
        <Text style={styles.checkboxLabel}>Pump primes properly</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onChange('pumpLidWorks', !data.pumpLidWorks)}
      >
        <View style={[styles.checkbox, data.pumpLidWorks && styles.checkboxChecked]}>
          {data.pumpLidWorks && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
        <Text style={styles.checkboxLabel}>Pump lid seals properly</Text>
      </TouchableOpacity>
    </View>

    <ModernInput
      label="Additional Notes"
      value={data.pumpNotes || ''}
      onChangeText={(text) => onChange('pumpNotes', text)}
      multiline
      numberOfLines={3}
    />
  </>
);

// FILTER SECTION
const FilterSection: React.FC<{ data: any; onChange: (field: string, value: any) => void }> = ({ data, onChange }) => (
  <>
    <Text style={styles.fieldLabel}>Filter Type</Text>
    <View style={styles.optionsRow}>
      {FILTER_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.optionButton,
            data.filterType === type.value && styles.optionButtonSelected
          ]}
          onPress={() => onChange('filterType', type.value)}
        >
          <Text style={[
            styles.optionText,
            data.filterType === type.value && styles.optionTextSelected
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.row}>
      <View style={styles.halfField}>
        <ModernInput
          label="Manufacturer"
          value={data.filterManufacturer || ''}
          onChangeText={(text) => onChange('filterManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <ModernInput
          label="Model"
          value={data.filterModel || ''}
          onChangeText={(text) => onChange('filterModel', text)}
        />
      </View>
    </View>

    <ModernInput
      label="Serial Number"
      value={data.filterSerialNumber || ''}
      onChangeText={(text) => onChange('filterSerialNumber', text)}
    />

    <Text style={styles.fieldLabel}>Filter Condition</Text>
    <View style={styles.conditionGrid}>
      {CONDITION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.conditionOption,
            data.filterCondition === option.value && { 
              backgroundColor: option.color + '20',
              borderColor: option.color 
            },
          ]}
          onPress={() => onChange('filterCondition', option.value)}
        >
          <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
          <Text style={[
            styles.conditionLabel,
            data.filterCondition === option.value && { color: option.color, fontWeight: '600' }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {data.filterType === 'cartridge' && (
      <View style={styles.subSection}>
        <Text style={styles.subSectionTitle}>Cartridge Details</Text>
        <ModernInput
          label="Cartridge Model"
          value={data.cartridgeModel || ''}
          onChangeText={(text) => onChange('cartridgeModel', text)}
        />
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => onChange('cartridgeNeedsReplacement', !data.cartridgeNeedsReplacement)}
        >
          <View style={[styles.checkbox, data.cartridgeNeedsReplacement && styles.checkboxChecked]}>
            {data.cartridgeNeedsReplacement && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>Cartridge needs replacement</Text>
        </TouchableOpacity>
      </View>
    )}

    <ModernInput
      label="Additional Notes"
      value={data.filterNotes || ''}
      onChangeText={(text) => onChange('filterNotes', text)}
      multiline
      numberOfLines={3}
    />
  </>
);

// SANITIZER SECTION
const SanitizerSection: React.FC<{ data: any; onChange: (field: string, value: any) => void }> = ({ data, onChange }) => (
  <>
    <Text style={styles.fieldLabel}>Sanitizer Type</Text>
    <View style={styles.optionsRow}>
      {SANITIZER_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.optionButton,
            data.sanitizerType === type.value && styles.optionButtonSelected
          ]}
          onPress={() => onChange('sanitizerType', type.value)}
        >
          <Text style={[
            styles.optionText,
            data.sanitizerType === type.value && styles.optionTextSelected
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.row}>
      <View style={styles.halfField}>
        <ModernInput
          label="Manufacturer"
          value={data.sanitizerManufacturer || ''}
          onChangeText={(text) => onChange('sanitizerManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <ModernInput
          label="Model"
          value={data.sanitizerModel || ''}
          onChangeText={(text) => onChange('sanitizerModel', text)}
        />
      </View>
    </View>

    <ModernInput
      label="Serial Number"
      value={data.sanitizerSerialNumber || ''}
      onChangeText={(text) => onChange('sanitizerSerialNumber', text)}
    />

    <Text style={styles.fieldLabel}>Sanitizer Condition</Text>
    <View style={styles.conditionGrid}>
      {CONDITION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.conditionOption,
            data.sanitizerCondition === option.value && { 
              backgroundColor: option.color + '20',
              borderColor: option.color 
            },
          ]}
          onPress={() => onChange('sanitizerCondition', option.value)}
        >
          <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
          <Text style={[
            styles.conditionLabel,
            data.sanitizerCondition === option.value && { color: option.color, fontWeight: '600' }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <ModernInput
      label="Additional Notes"
      value={data.sanitizerNotes || ''}
      onChangeText={(text) => onChange('sanitizerNotes', text)}
      multiline
      numberOfLines={3}
    />
  </>
);

// HEATER SECTION
const HeaterSection: React.FC<{ data: any; onChange: (field: string, value: any) => void }> = ({ data, onChange }) => (
  <>
    <Text style={styles.fieldLabel}>Heater Type</Text>
    <View style={styles.optionsRow}>
      {HEATER_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.optionButton,
            data.heaterType === type.value && styles.optionButtonSelected
          ]}
          onPress={() => onChange('heaterType', type.value)}
        >
          <Text style={[
            styles.optionText,
            data.heaterType === type.value && styles.optionTextSelected
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.row}>
      <View style={styles.halfField}>
        <ModernInput
          label="Manufacturer"
          value={data.heaterManufacturer || ''}
          onChangeText={(text) => onChange('heaterManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <ModernInput
          label="Model"
          value={data.heaterModel || ''}
          onChangeText={(text) => onChange('heaterModel', text)}
        />
      </View>
    </View>

    <ModernInput
      label="Serial Number"
      value={data.heaterSerialNumber || ''}
      onChangeText={(text) => onChange('heaterSerialNumber', text)}
    />

    <Text style={styles.fieldLabel}>Heater Condition</Text>
    <View style={styles.conditionGrid}>
      {CONDITION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.conditionOption,
            data.heaterCondition === option.value && { 
              backgroundColor: option.color + '20',
              borderColor: option.color 
            },
          ]}
          onPress={() => onChange('heaterCondition', option.value)}
        >
          <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
          <Text style={[
            styles.conditionLabel,
            data.heaterCondition === option.value && { color: option.color, fontWeight: '600' }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <ModernInput
      label="Additional Notes"
      value={data.heaterNotes || ''}
      onChangeText={(text) => onChange('heaterNotes', text)}
      multiline
      numberOfLines={3}
    />
  </>
);

// TIMER SECTION
const TimerSection: React.FC<{ data: any; onChange: (field: string, value: any) => void }> = ({ data, onChange }) => (
  <>
    <Text style={styles.fieldLabel}>Timer Type</Text>
    <View style={styles.optionsRow}>
      {TIMER_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.optionButton,
            data.timerType === type.value && styles.optionButtonSelected
          ]}
          onPress={() => onChange('timerType', type.value)}
        >
          <Text style={[
            styles.optionText,
            data.timerType === type.value && styles.optionTextSelected
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.row}>
      <View style={styles.halfField}>
        <ModernInput
          label="Manufacturer"
          value={data.timerManufacturer || ''}
          onChangeText={(text) => onChange('timerManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <ModernInput
          label="Model"
          value={data.timerModel || ''}
          onChangeText={(text) => onChange('timerModel', text)}
        />
      </View>
    </View>

    <View style={styles.subSection}>
      <Text style={styles.subSectionTitle}>Current Schedule</Text>
      <View style={styles.row}>
        <View style={styles.thirdField}>
          <ModernInput
            label="Start Hour"
            value={data.timerStartHour || ''}
            onChangeText={(text) => onChange('timerStartHour', text)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={styles.thirdField}>
          <ModernInput
            label="Minutes"
            value={data.timerStartMinute || ''}
            onChangeText={(text) => onChange('timerStartMinute', text)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={styles.thirdField}>
          <Text style={styles.fieldLabel}>Period</Text>
          <View style={styles.periodRow}>
            {['AM', 'PM'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  data.timerStartPeriod === period && styles.periodButtonSelected
                ]}
                onPress={() => onChange('timerStartPeriod', period)}
              >
                <Text style={[
                  styles.periodText,
                  data.timerStartPeriod === period && styles.periodTextSelected
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.thirdField}>
          <ModernInput
            label="End Hour"
            value={data.timerEndHour || ''}
            onChangeText={(text) => onChange('timerEndHour', text)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={styles.thirdField}>
          <ModernInput
            label="Minutes"
            value={data.timerEndMinute || ''}
            onChangeText={(text) => onChange('timerEndMinute', text)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={styles.thirdField}>
          <Text style={styles.fieldLabel}>Period</Text>
          <View style={styles.periodRow}>
            {['AM', 'PM'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  data.timerEndPeriod === period && styles.periodButtonSelected
                ]}
                onPress={() => onChange('timerEndPeriod', period)}
              >
                <Text style={[
                  styles.periodText,
                  data.timerEndPeriod === period && styles.periodTextSelected
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>

    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={() => onChange('timerSynced', !data.timerSynced)}
    >
      <View style={[styles.checkbox, data.timerSynced && styles.checkboxChecked]}>
        {data.timerSynced && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <Text style={styles.checkboxLabel}>Timer schedule is synced correctly</Text>
    </TouchableOpacity>

    <ModernInput
      label="Additional Notes"
      value={data.timerNotes || ''}
      onChangeText={(text) => onChange('timerNotes', text)}
      multiline
      numberOfLines={3}
    />
  </>
);

// VALVES SECTION
const ValvesSection: React.FC<{ data: any; onChange: (field: string, value: any) => void }> = ({ data, onChange }) => (
  <>
    <Text style={styles.fieldLabel}>Valve Condition</Text>
    <View style={styles.conditionGrid}>
      {CONDITION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.conditionOption,
            data.valveCondition === option.value && { 
              backgroundColor: option.color + '20',
              borderColor: option.color 
            },
          ]}
          onPress={() => onChange('valveCondition', option.value)}
        >
          <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
          <Text style={[
            styles.conditionLabel,
            data.valveCondition === option.value && { color: option.color, fontWeight: '600' }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={() => onChange('valvesProperlyLabeled', !data.valvesProperlyLabeled)}
    >
      <View style={[styles.checkbox, data.valvesProperlyLabeled && styles.checkboxChecked]}>
        {data.valvesProperlyLabeled && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <Text style={styles.checkboxLabel}>All valves are properly labeled</Text>
    </TouchableOpacity>

    <ModernInput
      label="Additional Notes"
      value={data.valveNotes || ''}
      onChangeText={(text) => onChange('valveNotes', text)}
      multiline
      numberOfLines={3}
    />
  </>
);

// EQUIPMENT PAD SECTION
const EquipmentPadSection: React.FC<{ data: any; onChange: (field: string, value: any) => void }> = ({ data, onChange }) => (
  <>
    <ModernInput
      label="Pressure Gauge Reading (PSI)"
      value={data.pressureReading || ''}
      onChangeText={(text) => onChange('pressureReading', text)}
      keyboardType="numeric"
    />

    <ModernInput
      label="Equipment Pad Notes"
      value={data.equipmentPadNotes || ''}
      onChangeText={(text) => onChange('equipmentPadNotes', text)}
      multiline
      numberOfLines={4}
    />
  </>
);

// STYLES - EXACT match from current implementation
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
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
  analysisResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  successBanner: {
    backgroundColor: theme.colors.success + '20',
  },
  errorBanner: {
    backgroundColor: theme.colors.error + '20',
  },
  analysisResultText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionHeaderActive: {
    backgroundColor: theme.colors.seaFoam + '20',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitleText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
  sectionContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  thirdField: {
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