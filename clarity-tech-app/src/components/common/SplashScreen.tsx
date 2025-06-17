import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('../../../../assets/images/splash.png')}
          style={styles.splashImage}
          resizeMode="stretch"
          onLoad={() => console.log('Splash image loaded successfully')}
          onError={(error) => console.log('Splash image failed to load:', error)}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D2E2E1', // Fallback background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: width,
    height: height,
    minWidth: 300,
    minHeight: 500,
  },
});