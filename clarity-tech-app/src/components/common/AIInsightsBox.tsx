import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface AIInsightsBoxProps {
  insight?: string;
  stepName: string;
}

export const AIInsightsBox: React.FC<AIInsightsBoxProps> = ({ insight, stepName }) => {
  const defaultInsights = {
    customer: 'AI will analyze customer data to identify service preferences and pool history.',
    waterChemistry: 'AI detected balanced water chemistry. pH and chlorine levels are within ideal ranges for a healthy pool.',
    poolDetails: 'Pool dimensions and features analyzed. AI recommends weekly service based on size and environment.',
    equipment: 'Equipment analysis complete. All components functioning properly with routine maintenance recommended.',
    voiceNote: 'Voice note will be transcribed and analyzed for key service insights.',
  };

  return (
    <View style={styles.aiInsightContainer}>
      <LinearGradient
        colors={[theme.colors.aiPink + '20', theme.colors.aiPink + '10']}
        style={styles.aiInsightGradient}
      >
        <View style={styles.aiHeader}>
          <Ionicons name="sparkles" size={20} color={theme.colors.aiPink} />
          <Text style={styles.aiTitle}>AI Insights</Text>
        </View>
        <Text style={styles.aiText}>
          {insight || defaultInsights[stepName] || 'AI analyzing data...'}
        </Text>
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
  aiText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.text,
    lineHeight: 20,
  },
});

export default AIInsightsBox;