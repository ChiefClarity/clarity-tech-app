import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface AIRecommendation {
  type: 'info' | 'warning' | 'success' | 'action';
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface AIRecommendationPanelProps {
  recommendations: AIRecommendation[];
  visible?: boolean;
}

export const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  recommendations,
  visible = true,
}) => {
  if (!visible || recommendations.length === 0) {
    return null;
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      case 'action':
        return 'bulb';
      default:
        return 'information-circle';
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return theme.colors.warning;
      case 'success':
        return theme.colors.success;
      case 'action':
        return theme.colors.blueGreen;
      default:
        return theme.colors.blueGreen;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(46, 125, 139, 0.05)', 'rgba(46, 125, 139, 0.02)']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="sparkles" size={20} color={theme.colors.blueGreen} />
          <Text style={styles.headerTitle}>AI Recommendations</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {recommendations.map((rec, index) => {
          const color = getRecommendationColor(rec.type);
          const icon = getRecommendationIcon(rec.type);

          return (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={16} color={color} />
                </View>
                <Text style={[styles.recommendationTitle, { color }]}>
                  {rec.title}
                </Text>
              </View>
              
              <Text style={styles.recommendationMessage}>
                {rec.message}
              </Text>

              {rec.action && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: color }]}
                  onPress={rec.action.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionButtonText, { color }]}>
                    {rec.action.label}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={color} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 139, 0.1)',
  },
  header: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 125, 139, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.blueGreen,
    marginLeft: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.md,
  },
  recommendationItem: {
    marginBottom: theme.spacing.md,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  recommendationTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  recommendationMessage: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    lineHeight: 18,
    marginLeft: 36, // Align with title
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginLeft: 36, // Align with text
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
  },
});