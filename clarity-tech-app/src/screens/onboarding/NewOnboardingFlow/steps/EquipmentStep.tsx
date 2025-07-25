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
import { EnhancedFloatingInput } from '../../../../components/ui/EnhancedFloatingInput';
import { AIPhotoAnalyzer } from '../../../../components/ui/AIPhotoAnalyzer';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';
import { aiService } from '../../../../services/api/ai';
import { FEATURES } from '../../../../config/features';
import { Alert } from 'react-native';
import { EquipmentAnalysisMapper } from '../../../../services/ai/equipmentAnalysisMapper';
import { aiAnalysisStorage } from '../../../../services/aiAnalysis/storage';

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
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'pump',
    'filter',
    'sanitizer',
    'heater',
    'timer',
    'valves',
    'equipment-pad'
  ]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    success: boolean;
    confidence?: number;
    message?: string;
  } | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<string | null>(null);
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
    setCompressionProgress('Processing equipment photos...');
    try {
      // Store photos first
      const updatedData = { ...equipmentData, photos };
      setEquipmentData(updatedData);
      await updateEquipment(updatedData);
      
      // Use real AI if enabled
      if (FEATURES.AI_EQUIPMENT_DETECTION && photos.length > 0) {
        console.log('🤖 Starting AI equipment analysis...');
        
        setCompressionProgress('Optimizing images for AI analysis...');
        
        // Call real AI service with ALL images
        const result = await aiService.analyzeEquipment(photos);  // Pass all photos

        if (result.success && result.analysis) {
          const analysis = result.analysis;
          
          console.log('🎯 Equipment AI Analysis:', analysis);
          console.log('🔍 Detected equipment count:', analysis.detectedEquipment?.length || 0);
          
          // Create mapper
          const mapper = new EquipmentAnalysisMapper(
            equipmentData,
            setEquipmentData,
            updateEquipment
          );
          
          // Map AI response to form
          await mapper.mapResponseToForm(analysis);
          
          // Build success message based on detected equipment
          const detectedTypes = analysis.detectedEquipment?.map(eq => eq.type) || [];
          const equipmentList = detectedTypes.length > 0 
            ? detectedTypes.join(', ')
            : 'equipment';
          
          setAnalysisComplete(true);
          setAnalysisResult({
            success: true,
            confidence: Math.round((analysis.confidence || 0.85) * 100),
            message: `Detected: ${equipmentList} (${analysis.imagesAnalyzed} images analyzed)`,
          });
          
          // Log specific equipment if detected
          if (analysis.pump) {
            console.log('🔧 Pump detected:', analysis.pump);
          }
          if (analysis.filter) {
            console.log('🔧 Filter detected:', analysis.filter);
          }
          if (analysis.heater) {
            console.log('🔧 Heater detected:', analysis.heater);
          }
          if (analysis.sanitizer) {
            console.log('🔧 Sanitizer detected:', analysis.sanitizer);
          }
          
          // Comprehensive storage logging
          console.log('💾 EQUIPMENT ANALYSIS STORAGE:', {
            totalImages: photos.length,
            equipmentDetected: analysis.detectedEquipment?.length || 0,
            types: analysis.detectedEquipment?.map(eq => eq.type) || [],
            mappedData: {
              pump: !!equipmentData.pumpType,
              filter: !!equipmentData.filterType,
              sanitizer: !!equipmentData.sanitizerType,
              heater: !!equipmentData.heaterType,
            },
            storedInSession: !!session?.equipment,
          });
          
          console.log('🔍 EQUIPMENT FORM VALUES:', {
            pumpType: equipmentData.pumpType,
            pumpManufacturer: equipmentData.pumpManufacturer,
            filterType: equipmentData.filterType,
            filterManufacturer: equipmentData.filterManufacturer,
            sanitizerType: equipmentData.sanitizerType,
            heaterType: equipmentData.heaterType,
            timerType: equipmentData.timerType,
          });
          
          // Store equipment analysis
          if (session?.customerInfo?.id) {
            const equipmentStorageData = {
              timestamp: new Date().toISOString(),
              imageUris: photos,
              analysis: analysis,
              mappedData: equipmentData,
            };
            
            await aiAnalysisStorage.saveAnalysis(
              session.customerInfo.id,
              'equipment',
              equipmentStorageData
            );
            
            console.log('💾 Equipment Analysis Saved to AI Storage');
          }
        } else {
          throw new Error('AI analysis failed - no data returned');
        }
      } else {
        // Mock mode fallback
        console.log('🎭 Using mock mode for equipment analysis');
        setAnalysisComplete(true);
        setAnalysisResult({
          success: true,
          confidence: 95,
          message: 'Equipment analysis complete (demo mode)',
        });
      }
    } catch (error) {
      console.error('❌ Equipment analysis error:', error);
      Alert.alert('Error', 'Failed to analyze equipment. Please check your connection.');
    } finally {
      setAnalyzing(false);
      setCompressionProgress(null);
      setTimeout(() => setAnalysisResult(null), 5000);
    }
  };
  
  // Save data on field change
  const handleFieldChange = async (field: string, value: any) => {
    const updated = { ...equipmentData, [field]: value };
    setEquipmentData(updated);
    await updateEquipment(updated);
  };
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
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
        
        {compressionProgress && (
          <View style={styles.compressionProgress}>
            <Text style={styles.compressionProgressText}>{compressionProgress}</Text>
          </View>
        )}
        
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
          ref={ref => sectionRefs.current[section.id] = ref}
          style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection(section.id)}
          >
            <View style={styles.sectionTitle}>
              <Ionicons name={section.icon as any} size={24} color={theme.colors.blueGreen} />
              <Text style={styles.sectionTitleText}>{section.title}</Text>
            </View>
            <Ionicons 
              name={expandedSections.includes(section.id) ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={theme.colors.gray} 
            />
          </TouchableOpacity>
          
          {expandedSections.includes(section.id) && (
            <View style={styles.sectionContent}>
              {renderSectionContent(section.id, equipmentData, handleFieldChange)}
            </View>
          )}
        </View>
      ))}
      
      
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
        <EnhancedFloatingInput
          label="Manufacturer"
          value={data.pumpManufacturer || ''}
          onChangeText={(text) => onChange('pumpManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <EnhancedFloatingInput
          label="Model"
          value={data.pumpModel || ''}
          onChangeText={(text) => onChange('pumpModel', text)}
        />
      </View>
    </View>

    <EnhancedFloatingInput
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

    <EnhancedFloatingInput
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
        <EnhancedFloatingInput
          label="Manufacturer"
          value={data.filterManufacturer || ''}
          onChangeText={(text) => onChange('filterManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <EnhancedFloatingInput
          label="Model"
          value={data.filterModel || ''}
          onChangeText={(text) => onChange('filterModel', text)}
        />
      </View>
    </View>

    <EnhancedFloatingInput
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
      <>
        <EnhancedFloatingInput
          label="Cartridge Model"
          value={data.cartridgeModel || ''}
          onChangeText={(text) => onChange('cartridgeModel', text)}
        />
        
        <Text style={styles.fieldLabel}>Cartridge Condition</Text>
        <View style={styles.conditionGrid}>
          {CONDITION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.conditionOption,
                data.cartridgeCondition === option.value && { 
                  backgroundColor: option.color + '20',
                  borderColor: option.color 
                },
              ]}
              onPress={() => onChange('cartridgeCondition', option.value)}
            >
              <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
              <Text style={[
                styles.conditionLabel,
                data.cartridgeCondition === option.value && { 
                  color: option.color, 
                  fontWeight: '600' 
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    )}

    <EnhancedFloatingInput
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
        <EnhancedFloatingInput
          label="Manufacturer"
          value={data.sanitizerManufacturer || ''}
          onChangeText={(text) => onChange('sanitizerManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <EnhancedFloatingInput
          label="Model"
          value={data.sanitizerModel || ''}
          onChangeText={(text) => onChange('sanitizerModel', text)}
        />
      </View>
    </View>

    <EnhancedFloatingInput
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

    <EnhancedFloatingInput
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
        <EnhancedFloatingInput
          label="Manufacturer"
          value={data.heaterManufacturer || ''}
          onChangeText={(text) => onChange('heaterManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <EnhancedFloatingInput
          label="Model"
          value={data.heaterModel || ''}
          onChangeText={(text) => onChange('heaterModel', text)}
        />
      </View>
    </View>

    <EnhancedFloatingInput
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

    <EnhancedFloatingInput
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
        <EnhancedFloatingInput
          label="Manufacturer"
          value={data.timerManufacturer || ''}
          onChangeText={(text) => onChange('timerManufacturer', text)}
        />
      </View>
      <View style={styles.halfField}>
        <EnhancedFloatingInput
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
          <EnhancedFloatingInput
            label="Start Hour"
            value={data.timerStartHour || ''}
            onChangeText={(text) => onChange('timerStartHour', text)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={styles.thirdField}>
          <EnhancedFloatingInput
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
          <EnhancedFloatingInput
            label="End Hour"
            value={data.timerEndHour || ''}
            onChangeText={(text) => onChange('timerEndHour', text)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={styles.thirdField}>
          <EnhancedFloatingInput
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

    <EnhancedFloatingInput
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

    <EnhancedFloatingInput
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
    <EnhancedFloatingInput
      label="Pressure Gauge Reading (PSI)"
      value={data.pressureReading || ''}
      onChangeText={(text) => onChange('pressureReading', text)}
      keyboardType="numeric"
    />

    <EnhancedFloatingInput
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
    paddingHorizontal: theme.spacing.lg,
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
    color: theme.colors.darkBlue,
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitleText: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.md,
  },
  sectionContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
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
  compressionProgress: {
    backgroundColor: theme.colors.blueGreen + '20',
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.blueGreen,
  },
  compressionProgressText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.darkBlue,
    textAlign: 'center',
  },
});