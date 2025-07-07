import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';

import { ModernSelect } from '../../../../../components/ui/ModernSelect';
import { AIPhotoAnalyzer } from '../../../../../components/ui/AIPhotoAnalyzer';
import { theme } from '../../../../../styles/theme';
import { aiAnalysisStorage, AIPoolSurfaceAnalysis } from '../../../../../services/aiAnalysis/asyncStorage';
import { FEATURES } from '../../../../../config/features';
import { useOnboarding } from '../../../../../contexts/OnboardingContext';

interface SurfaceAnalysisProps {
  control: Control<any>;
  errors?: FieldErrors<any>;
  session?: any;
}

const MATERIAL_OPTIONS = [
  { label: 'Plaster', value: 'plaster' },
  { label: 'Pebble', value: 'pebble' },
  { label: 'Fiberglass', value: 'fiberglass' },
  { label: 'Vinyl', value: 'vinyl' },
  { label: 'Tile', value: 'tile' },
  { label: 'Other', value: 'other' }
];

const CONDITION_OPTIONS = [
  { label: 'Excellent', value: 'excellent' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Poor', value: 'poor' }
];

export const SurfaceAnalysis: React.FC<SurfaceAnalysisProps> = ({ control, errors, session }) => {
  const { updateOnboarding } = useOnboarding();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AIPoolSurfaceAnalysis | null>(null);

  const handleSurfacePhotosChange = useCallback(async (photos: any[]) => {
    if (!photos || photos.length === 0) return;

    try {
      setIsAnalyzing(true);
      setAnalysisComplete(false);

      // Analyze the most recent photo
      const latestPhoto = photos[photos.length - 1];
      
      if (FEATURES.USE_REAL_AI && latestPhoto.analysis) {
        // Process AI response
        const analysis: AIPoolSurfaceAnalysis = {
          timestamp: new Date().toISOString(),
          imageUri: latestPhoto.uri,
          material: {
            detected: latestPhoto.analysis.material || 'unknown',
            confidence: latestPhoto.analysis.confidence || 0,
            alternatives: latestPhoto.analysis.alternatives || []
          },
          issues: {
            cracks: {
              detected: latestPhoto.analysis.issues?.cracks || false,
              severity: latestPhoto.analysis.issues?.crackSeverity || 0,
              locations: []
            },
            stains: {
              detected: latestPhoto.analysis.issues?.stains || false,
              severity: latestPhoto.analysis.issues?.stainSeverity || 0,
              type: latestPhoto.analysis.issues?.stainType || 'unknown'
            },
            algae: {
              detected: latestPhoto.analysis.issues?.algae || false,
              coverage: latestPhoto.analysis.issues?.algaeCoverage || 0,
              type: latestPhoto.analysis.issues?.algaeType || 'unknown'
            },
            discoloration: {
              detected: latestPhoto.analysis.issues?.discoloration || false,
              severity: latestPhoto.analysis.issues?.discolorationSeverity || 0
            },
            roughness: {
              estimated: latestPhoto.analysis.roughness || 5,
              confidence: latestPhoto.analysis.roughnessConfidence || 0.5
            }
          },
          overallHealthScore: latestPhoto.analysis.healthScore || 75,
          recommendedActions: latestPhoto.analysis.recommendations || [],
          rawAnalysisData: latestPhoto.analysis
        };

        // Save to storage
        if (session?.customerInfo?.id) {
          await aiAnalysisStorage.saveAnalysis(
            session.customerInfo.id,
            'surface',
            analysis
          );
        }

        setAnalysisData(analysis);
        setAiSuggestion(analysis.material.detected);
        
        // Update form with AI suggestion
        if (analysis.material.confidence > 0.7) {
          control._formValues.surfaceType = analysis.material.detected;
        }
      }

      setAnalysisComplete(true);
    } catch (error) {
      console.error('Surface analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [control, session]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="water-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.title}>Pool Surface Analysis</Text>
      </View>

      {/* AI Photo Analysis */}
      <View style={styles.photoSection}>
        <AIPhotoAnalyzer
          onPhotosChange={handleSurfacePhotosChange}
          maxPhotos={6}
          analysisType="pool_surface"
          placeholder="Take photos of pool surface"
          instructions="Capture close-up photos of the pool surface from multiple angles"
        />
      </View>

      {/* AI Analysis Status */}
      {(isAnalyzing || analysisComplete) && (
        <View style={styles.analysisStatus}>
          <LinearGradient
            colors={[theme.colors.aiPink + '20', theme.colors.aiBlue + '20']}
            style={styles.analysisStatusGradient}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator size="small" color={theme.colors.aiPink} />
                <Text style={styles.analysisStatusText}>Analyzing surface...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.analysisStatusText}>
                  AI Analysis Complete
                  {analysisData && ` - Health Score: ${analysisData.overallHealthScore}%`}
                </Text>
              </>
            )}
          </LinearGradient>
        </View>
      )}

      {/* Manual Inputs */}
      <View style={styles.inputSection}>
        <Controller
          control={control}
          name="surfaceType"
          render={({ field: { onChange, value } }) => (
            <View>
              <ModernSelect
                label="Surface Material"
                value={value}
                onValueChange={onChange}
                items={MATERIAL_OPTIONS}
                error={errors?.surfaceType?.message}
                placeholder="Select surface material"
              />
              {aiSuggestion && value !== aiSuggestion && (
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => onChange(aiSuggestion)}
                >
                  <Text style={styles.suggestionText}>
                    AI suggests: {aiSuggestion}
                  </Text>
                  <Ionicons name="sparkles" size={16} color={theme.colors.aiPink} />
                </TouchableOpacity>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="surfaceCondition"
          render={({ field: { onChange, value } }) => (
            <ModernSelect
              label="Surface Condition"
              value={value}
              onValueChange={onChange}
              items={CONDITION_OPTIONS}
              error={errors?.surfaceCondition?.message}
              placeholder="Select condition"
            />
          )}
        />
      </View>

      {/* Hidden data for report generation */}
      {analysisData && (
        <View style={styles.hiddenData}>
          {/* This view is not visible but stores the analysis reference */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  photoSection: {
    marginBottom: 16,
  },
  analysisStatus: {
    marginBottom: 16,
  },
  analysisStatusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  analysisStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  inputSection: {
    gap: 16,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.aiPink + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 12,
    color: theme.colors.aiPink,
    marginRight: 4,
  },
  hiddenData: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
});