import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AIPhotoAnalyzer } from '../../../../../components/ui/AIPhotoAnalyzer';
import { theme } from '../../../../../styles/theme';
import { aiAnalysisStorage, AIEnvironmentAnalysis } from '../../../../../services/aiAnalysis/asyncStorage';
import { FEATURES } from '../../../../../config/features';
import { useOnboarding } from '../../../../../contexts/OnboardingContext';
import { aiService } from '../../../../../services/api/ai';
import { weatherService } from '../../../../../services/ai/weatherService';

interface EnvironmentAnalysisProps {
  session?: any;
  address?: string;
}

export const EnvironmentAnalysis: React.FC<EnvironmentAnalysisProps> = ({ session, address }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisData, setAnalysisData] = useState<AIEnvironmentAnalysis | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather data when component mounts or address changes
  useEffect(() => {
    if (address) {
      fetchWeatherData();
    }
  }, [address]);

  const fetchWeatherData = async () => {
    try {
      const data = await weatherService.getWeatherAndPollenData(address || '');
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  const handleEnvironmentPhotosChange = useCallback(async (photos: any[]) => {
    if (!photos || photos.length === 0) return;

    try {
      setIsAnalyzing(true);
      setAnalysisComplete(false);
      setError(null);

      // Prepare images for API
      const imageUris = photos.map(photo => photo.uri);
      
      if (FEATURES.USE_REAL_AI && FEATURES.AI_ENVIRONMENT_ANALYSIS) {
        try {
          // Call the real API endpoint
          const response = await aiService.analyzeEnvironment(
            imageUris,
            session?.id || 'temp-session'
          );

          if (response.success && response.analysis) {
            // Structure the complete analysis with weather data
            const analysis: AIEnvironmentAnalysis = {
              timestamp: new Date().toISOString(),
              imageUri: photos[0].uri, // Primary image
              trees: {
                detected: response.analysis.vegetation?.treesPresent || false,
                count: response.analysis.vegetation?.treeCount || 0,
                types: response.analysis.vegetation?.treeTypes || [],
                overhangRisk: convertRiskLevel(response.analysis.vegetation?.overhangRisk),
                leafDropEstimate: response.analysis.vegetation?.debrisRisk || 'minimal'
              },
              screenEnclosure: {
                detected: response.analysis.structures?.screenEnclosure || false,
                condition: response.analysis.structures?.enclosureCondition || 'not applicable',
                coverage: response.analysis.structures?.screenEnclosure ? 100 : 0
              },
              foliage: {
                density: calculateFoliageDensity(response.analysis.vegetation),
                proximityToPool: convertProximity(response.analysis.vegetation?.proximityToPool),
                maintenanceImpact: response.analysis.maintenanceChallenges?.length > 2 ? 'high' : 
                                   response.analysis.maintenanceChallenges?.length > 0 ? 'medium' : 'low'
              },
              weatherPatterns: weatherData || {
                avgRainfall: 0,
                windPatterns: 'Unknown',
                seasonalFactors: {},
                pollenData: response.analysis.pollenData
              },
              sunExposure: {
                hoursPerDay: calculateSunHours(response.analysis.environmentalFactors?.sunExposure),
                shadedAreas: calculateShadedPercentage(response.analysis.environmentalFactors?.sunExposure)
              },
              rawAnalysisData: response.analysis
            };

            // Save to storage
            if (session?.customerInfo?.id) {
              await aiAnalysisStorage.saveAnalysis(
                session.customerInfo.id,
                'environment',
                analysis
              );
            }

            setAnalysisData(analysis);
          } else {
            throw new Error('Invalid response from AI analysis');
          }
        } catch (apiError: any) {
          console.error('AI analysis error:', apiError);
          setError(apiError.message || 'Failed to analyze environment');
          // Use fallback analysis
          await performFallbackAnalysis(photos);
        }
      } else {
        // Mock analysis for development
        await performFallbackAnalysis(photos);
      }

      setAnalysisComplete(true);
    } catch (error: any) {
      console.error('Environment analysis error:', error);
      setError(error.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [session, weatherData]);

  // Helper methods
  const convertRiskLevel = (risk: string): number => {
    const riskMap: Record<string, number> = {
      'none': 0,
      'low': 0.25,
      'medium': 0.5,
      'high': 0.75,
      'very high': 1
    };
    return riskMap[risk?.toLowerCase()] || 0;
  };

  const convertProximity = (proximity: string): number => {
    const proximityMap: Record<string, number> = {
      'far': 0.2,
      'moderate': 0.5,
      'close': 0.8,
      'very close': 1
    };
    return proximityMap[proximity?.toLowerCase()] || 0.5;
  };

  const calculateFoliageDensity = (vegetation: any): number => {
    if (!vegetation) return 0;
    const treeCount = vegetation.treeCount || 0;
    const density = Math.min(treeCount / 10, 1); // Normalize to 0-1
    return density;
  };

  const calculateSunHours = (sunExposure: string): number => {
    const hoursMap: Record<string, number> = {
      'full sun': 8,
      'partial shade': 5,
      'heavy shade': 2,
      'mostly shaded': 3
    };
    return hoursMap[sunExposure?.toLowerCase()] || 6;
  };

  const calculateShadedPercentage = (sunExposure: string): number => {
    const shadedMap: Record<string, number> = {
      'full sun': 10,
      'partial shade': 40,
      'heavy shade': 80,
      'mostly shaded': 70
    };
    return shadedMap[sunExposure?.toLowerCase()] || 30;
  };

  const performFallbackAnalysis = async (photos: any[]) => {
    // Fallback analysis when API is unavailable
    const mockAnalysis: AIEnvironmentAnalysis = {
      timestamp: new Date().toISOString(),
      imageUri: photos[0].uri,
      trees: {
        detected: true,
        count: 3,
        types: ['Oak', 'Palm'],
        overhangRisk: 0.5,
        leafDropEstimate: 'moderate'
      },
      screenEnclosure: {
        detected: false,
        condition: 'not applicable',
        coverage: 0
      },
      foliage: {
        density: 0.6,
        proximityToPool: 0.5,
        maintenanceImpact: 'medium'
      },
      weatherPatterns: weatherData || {
        avgRainfall: 52.4,
        windPatterns: 'Moderate easterly winds',
        seasonalFactors: {
          summer: { avgTemp: 85, humidity: 75 },
          winter: { avgTemp: 65, humidity: 60 }
        }
      },
      sunExposure: {
        hoursPerDay: 6,
        shadedAreas: 30
      },
      rawAnalysisData: null
    };

    setAnalysisData(mockAnalysis);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.title}>Environment Analysis</Text>
      </View>

      {/* AI Photo Analysis */}
      <View style={styles.photoSection}>
        <AIPhotoAnalyzer
          onPhotosChange={handleEnvironmentPhotosChange}
          maxPhotos={4}
          analysisType="pool_environment"
          placeholder="Capture pool surroundings"
          instructions="Take photos showing trees, landscaping, and structures around the pool"
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
                <Text style={styles.analysisStatusText}>
                  Analyzing environment with AI...
                </Text>
              </>
            ) : error ? (
              <>
                <Ionicons name="warning" size={20} color={theme.colors.error} />
                <Text style={[styles.analysisStatusText, styles.errorText]}>
                  {error}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.analysisStatusText}>
                  AI Environment Analysis Complete
                </Text>
              </>
            )}
          </LinearGradient>

          {analysisComplete && analysisData && !error && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Ionicons name="tree" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.summaryText}>
                  {analysisData.trees.detected 
                    ? `${analysisData.trees.count} trees detected (${analysisData.trees.types.join(', ')})`
                    : 'No trees detected'}
                </Text>
              </View>
              
              {analysisData.screenEnclosure.detected && (
                <View style={styles.summaryRow}>
                  <Ionicons name="shield-checkmark" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.summaryText}>Screen enclosure present</Text>
                </View>
              )}
              
              <View style={styles.summaryRow}>
                <Ionicons name="sunny" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.summaryText}>
                  {analysisData.sunExposure.hoursPerDay}+ hours sun exposure
                </Text>
              </View>
              
              {weatherData && (
                <>
                  <View style={styles.summaryRow}>
                    <Ionicons name="rainy" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.summaryText}>
                      Avg rainfall: {weatherData.avgRainfall}" per year
                    </Text>
                  </View>
                  
                  {weatherData.pollenData && (
                    <View style={styles.summaryRow}>
                      <Ionicons name="flower" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.summaryText}>
                        Pollen: {weatherData.pollenData.currentLevel}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
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
  errorText: {
    color: theme.colors.error,
  },
  summaryContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    marginLeft: 8,
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },
});