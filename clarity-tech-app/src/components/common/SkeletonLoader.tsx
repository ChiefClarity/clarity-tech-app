import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../../styles/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = theme.borderRadius.sm,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  showImage?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = false,
  lines = 3,
}) => {
  return (
    <View style={styles.card}>
      {showImage && (
        <SkeletonLoader
          width="100%"
          height={120}
          borderRadius={theme.borderRadius.md}
          style={styles.imageLoader}
        />
      )}
      
      <View style={styles.content}>
        <SkeletonLoader
          width="80%"
          height={24}
          borderRadius={theme.borderRadius.sm}
          style={styles.titleLoader}
        />
        
        {[...Array(lines)].map((_, index) => (
          <SkeletonLoader
            key={index}
            width={index === lines - 1 ? '60%' : '100%'}
            height={16}
            borderRadius={theme.borderRadius.sm}
            style={styles.lineLoader}
          />
        ))}
      </View>
    </View>
  );
};

interface SkeletonListProps {
  items?: number;
  showImage?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 3,
  showImage = false,
}) => {
  return (
    <View style={styles.list}>
      {[...Array(items)].map((_, index) => (
        <SkeletonCard key={index} showImage={showImage} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.seaFoam,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  content: {
    flex: 1,
  },
  imageLoader: {
    marginBottom: theme.spacing.md,
  },
  titleLoader: {
    marginBottom: theme.spacing.sm,
  },
  lineLoader: {
    marginBottom: theme.spacing.xs,
  },
  list: {
    flex: 1,
  },
});