import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
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
  allowBatchAnalysis?: boolean;
}

export const AIPhotoAnalyzer: React.FC<AIPhotoAnalyzerProps> = ({
  title,
  onAnalyze,
  maxPhotos = 1,
  description,
  initialPhotos = [],
  allowBatchAnalysis = false,
}) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoCapture = async () => {
    if (photos.length >= maxPhotos) {
      // No alert - just return silently
      return;
    }

    setError(null); // Clear any previous errors
    
    try {
      const result = await launchCamera({ mediaTypes: 'photo' });
      
      if (!result.cancelled && result.uri) {
        const newPhotos = [...photos, result.uri];
        setPhotos(newPhotos);
        
        // For batch mode, DON'T analyze immediately
        if (!allowBatchAnalysis) {
          // Current behavior - analyze immediately
          setIsAnalyzing(true);
          try {
            await onAnalyze(newPhotos);
            setError(null);
          } catch (error) {
            console.error('AI analysis failed:', error);
            setError('Failed to analyze photo. Please try again.');
          } finally {
            setIsAnalyzing(false);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to take photo:', error);
      setError(error.message || 'Failed to capture photo. Please try again.');
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const handleBatchAnalysis = async () => {
    if (photos.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      await onAnalyze(photos);
    } catch (error) {
      console.error('Batch analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
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

      {/* Error message */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Photo display grid for multiple photos */}
      {photos.length > 0 && allowBatchAnalysis && (
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoThumbnail}>
              <Image source={{ uri: photo }} style={styles.thumbnailImage} />
              <TouchableOpacity
                style={styles.removeThumbnail}
                onPress={() => handleRemovePhoto(index)}
              >
                <Ionicons name="close-circle" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Single photo display for non-batch mode */}
      {photos.length > 0 && !allowBatchAnalysis && (
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
      )}

      {/* Capture button */}
      {photos.length < maxPhotos && (
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handlePhotoCapture}
        >
          <LinearGradient
            colors={[theme.colors.aiPink, theme.colors.aiPink]}
            style={styles.captureGradient}
          >
            <Ionicons name="camera" size={32} color="white" />
            <Text style={styles.captureText}>
              {photos.length > 0 ? 'Add Another Photo' : 'Take Photo'}
            </Text>
            <Text style={styles.captureSubtext}>
              {allowBatchAnalysis ? `${photos.length}/${maxPhotos} photos` : 'AI will auto-analyze'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Add more photos button for non-batch mode */}
      {photos.length > 0 && photos.length < maxPhotos && !allowBatchAnalysis && (
        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={handlePhotoCapture}
        >
          <Text style={styles.addMoreText}>+ Take Another Photo</Text>
        </TouchableOpacity>
      )}

      {/* Batch analysis button */}
      {allowBatchAnalysis && photos.length > 0 && (
        <TouchableOpacity
          style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
          onPress={handleBatchAnalysis}
          disabled={isAnalyzing}
        >
          <LinearGradient
            colors={[theme.colors.blueGreen, theme.colors.darkBlue]}
            style={styles.analyzeGradient}
          >
            {isAnalyzing ? (
              <>
                <Ionicons name="sync" size={20} color="white" />
                <Text style={styles.analyzeText}>Analyzing {photos.length} photos...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text style={styles.analyzeText}>Analyze All Photos</Text>
              </>
            )}
          </LinearGradient>
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
    borderColor: theme.colors.aiPink,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  addMoreText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.aiPink,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: theme.spacing.md,
  },
  photoThumbnail: {
    width: '31%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removeThumbnail: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  analyzeButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  analyzeText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    flex: 1,
  },
});

export default AIPhotoAnalyzer;