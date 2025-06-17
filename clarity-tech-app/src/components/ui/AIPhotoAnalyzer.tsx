import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { launchCamera } from '../../utils/webCamera';

interface AIPhotoAnalyzerProps {
  title: string;
  onAnalyze: (photos: string[]) => void;
  maxPhotos?: number;
  description?: string;
  initialPhotos?: string[];
}

export const AIPhotoAnalyzer: React.FC<AIPhotoAnalyzerProps> = ({
  title,
  onAnalyze,
  maxPhotos = 1,
  description,
  initialPhotos = []
}) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePhotoCapture = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only upload ${maxPhotos} photo${maxPhotos > 1 ? 's' : ''}.`);
      return;
    }

    try {
      const result = await launchCamera({ mediaTypes: 'photo' });
      
      if (!result.cancelled && result.uri) {
        const newPhotos = [...photos, result.uri];
        setPhotos(newPhotos);
        setIsAnalyzing(true);
        
        try {
          await onAnalyze(newPhotos);
        } catch (error) {
          console.error('AI analysis failed:', error);
          Alert.alert('Analysis Error', 'Failed to analyze photo. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Camera Error', 'Unable to access camera. Please try again.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="camera" size={24} color={theme.colors.darkBlue} />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {photos.length > 0 ? (
        <View style={styles.photoContainer}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri: photo }} style={styles.photo} />
              {isAnalyzing && (
                <View style={styles.analysisOverlay}>
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.5)']}
                    style={styles.analysisGradient}
                  >
                    <Ionicons name="sync" size={24} color="white" />
                    <Text style={styles.analysisText}>AI is analyzing...</Text>
                  </LinearGradient>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePhoto(index)}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handlePhotoCapture}
        >
          <LinearGradient
            colors={['#F97316', '#EA580C']}
            style={styles.captureGradient}
          >
            <Ionicons name="camera" size={32} color="white" />
            <Text style={styles.captureText}>Take Photo</Text>
            <Text style={styles.captureSubtext}>AI will auto-analyze</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {photos.length > 0 && photos.length < maxPhotos && (
        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={handlePhotoCapture}
        >
          <Text style={styles.addMoreText}>+ Take Another Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.lg,
  },
  photoContainer: {
    marginBottom: theme.spacing.md,
  },
  photoWrapper: {
    position: 'relative',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.grayLight,
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  analysisGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  removeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  captureGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  captureText: {
    color: 'white',
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },
  captureSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: theme.typography.small.fontSize,
    marginTop: theme.spacing.xs,
  },
  addMoreButton: {
    borderWidth: 2,
    borderColor: theme.colors.blueGreen,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  addMoreText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.blueGreen,
  },
});