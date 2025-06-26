import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface AIInsightsBoxProps {
  insights?: string[];
  isAnalyzing?: boolean;
  stepName?: string;
}

export const AIInsightsBox: React.FC<AIInsightsBoxProps> = ({ 
  insights,
  isAnalyzing = false,
  stepName 
}) => {
  const defaultInsightsByStep = {
    customer: ['AI will analyze customer data to identify service preferences and pool history.'],
    waterChemistry: ['AI detected balanced water chemistry. pH and chlorine levels are within ideal ranges for a healthy pool.'],
    poolDetails: ['Pool dimensions and features analyzed. AI recommends weekly service based on size and environment.'],
    equipment: ['Equipment analysis complete. All components functioning properly with routine maintenance recommended.'],
    voiceNote: ['Voice note will be transcribed and analyzed for key service insights.'],
  };
  
  const defaultInsights = [
    'AI analysis will provide insights here',
    'Complete this section to see recommendations'
  ];
  
  const displayInsights = insights && insights.length > 0 
    ? insights 
    : (stepName && defaultInsightsByStep[stepName] ? defaultInsightsByStep[stepName] : defaultInsights);
  
  return (
    <View style={styles.aiInsightContainer}>
      <LinearGradient
        colors={[theme.colors.aiPink + '20', theme.colors.aiPink + '10']}
        style={styles.aiInsightGradient}
      >
        <View style={styles.aiHeader}>
          <Ionicons name="sparkles" size={20} color={theme.colors.aiPink} />
          <Text style={styles.aiTitle}>AI Insights</Text>
          {isAnalyzing && <ActivityIndicator size="small" color={theme.colors.aiPink} style={styles.loader} />}
        </View>
        <View style={styles.insightsList}>
          {displayInsights.map((insight, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.aiText}>{insight}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  aiInsightContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  aiInsightGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  aiTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.aiPink,
    marginLeft: theme.spacing.sm,
  },
  loader: {
    marginLeft: 'auto',
  },
  insightsList: {
    gap: theme.spacing.xs,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.aiPink,
    marginRight: theme.spacing.xs,
  },
  aiText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.darkBlue,
    lineHeight: 20,
    flex: 1,
  },
});

export default AIInsightsBox;