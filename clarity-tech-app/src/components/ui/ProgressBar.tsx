import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../styles/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  showPercentage?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = false,
  height = 8,
  color = theme.colors.blueGreen,
  backgroundColor = theme.colors.lightGray,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: theme.animation.normal,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const widthPercentage = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.progressContainer,
          { height, backgroundColor },
        ]}
      >
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: widthPercentage,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentageText}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: theme.borderRadius.full,
  },
  percentageText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    minWidth: 40,
    textAlign: 'right',
  },
});