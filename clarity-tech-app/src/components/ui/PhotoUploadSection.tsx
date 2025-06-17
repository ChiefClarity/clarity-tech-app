import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { launchCamera } from '../../utils/webCamera';

interface PhotoUploadSectionProps {
  maxPhotos: number;
  onPhotosChange: (photos: string[]) => void;
  photos?: string[];
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  maxPhotos,
  onPhotosChange,
  photos = []
}) => {
  const [uploading, setUploading] = useState(false);

  const handleAddPhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only upload ${maxPhotos} photos.`);
      return;
    }

    try {
      setUploading(true);
      const result = await launchCamera({ mediaTypes: 'photo' });
      
      if (!result.cancelled && result.uri) {
        const newPhotos = [...photos, result.uri];
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Camera Error', 'Unable to access camera. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <View style={styles.container}>
      {photos.length > 0 && (
        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
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
      
      {photos.length < maxPhotos && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPhoto}
          disabled={uploading}
        >
          <Ionicons 
            name={uploading ? "hourglass-outline" : "camera-outline"} 
            size={24} 
            color={theme.colors.blueGreen} 
          />
          <Text style={styles.addButtonText}>
            {uploading ? 'Taking Photo...' : 'Add Photo'}
          </Text>
          <Text style={styles.addButtonSubtext}>
            {photos.length}/{maxPhotos} photos
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  photoContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.grayLight,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    borderWidth: 2,
    borderColor: theme.colors.blueGreen,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.blueGreen + '10',
  },
  addButtonText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.blueGreen,
    marginTop: theme.spacing.sm,
  },
  addButtonSubtext: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
});