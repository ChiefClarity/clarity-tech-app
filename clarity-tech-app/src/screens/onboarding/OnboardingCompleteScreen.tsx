import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../../components/ui/GradientButton';
import { theme } from '../../styles/theme';
import { apiClient } from '../../services/api/client';

export const OnboardingCompleteScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [analysisStatus, setAnalysisStatus] = useState('pending');
  const [analysisId, setAnalysisId] = useState(null);
  
  useEffect(() => {
    checkAnalysisStatus();
  }, []);
  
  const checkAnalysisStatus = async () => {
    try {
      const response = await apiClient.get(`/api/ai/analysis/session/${sessionId}`);
      if (response.data) {
        setAnalysisStatus('complete');
        setAnalysisId(response.data.id);
      }
    } catch (error) {
      // Analysis not ready yet
      setTimeout(checkAnalysisStatus, 5000); // Check again in 5 seconds
    }
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.blueGreen, theme.colors.darkBlue]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={analysisStatus === 'complete' ? 'checkmark-circle' : 'hourglass'} 
              size={80} 
              color="white" 
            />
          </View>
          
          <Text style={styles.title}>
            {analysisStatus === 'complete' ? 'Analysis Complete!' : 'Analyzing Pool Data...'}
          </Text>
          
          <Text style={styles.subtitle}>
            {analysisStatus === 'complete' 
              ? 'AI has analyzed the pool. CSM will review and send results to customer.'
              : 'Our AI is processing equipment photos, water chemistry, and voice notes...'}
          </Text>
          
          {analysisStatus === 'pending' && (
            <ActivityIndicator size="large" color="white" style={styles.loader} />
          )}
          
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.featureText}>Equipment identified with Gemini Vision</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="flask" size={24} color="white" />
              <Text style={styles.featureText}>Water chemistry analyzed by Claude</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="mic" size={24} color="white" />
              <Text style={styles.featureText}>Voice insights extracted</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="map" size={24} color="white" />
              <Text style={styles.featureText}>Property analyzed via satellite</Text>
            </View>
          </View>
          
          <GradientButton
            title="Back to Home"
            onPress={() => navigation.navigate('Home')}
            style={styles.button}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  loader: {
    marginBottom: theme.spacing.xl,
  },
  features: {
    marginBottom: theme.spacing.xxl,
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  featureText: {
    fontSize: theme.typography.small.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  button: {
    width: '80%',
  },
});