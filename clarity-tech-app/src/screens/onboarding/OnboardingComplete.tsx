import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { GradientButton } from '../../components/ui/GradientButton';
import { theme } from '../../styles/theme';

export const OnboardingComplete: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { sessionId, message } = route.params as any;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Onboarding Complete!</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.sessionId}>Session: {sessionId}</Text>
      
      <GradientButton
        title="Return to Dashboard"
        onPress={() => navigation.navigate('Dashboard' as any)}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.darkBlue,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: theme.colors.gray,
  },
  sessionId: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: 40,
  },
  button: {
    width: '100%',
  },
});