import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface Photo {
  uri: string;
  analysis?: any;
}

interface AIPhotoAnalyzerProps {
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos: number;
  analysisType: string;
  placeholder: string;
  instructions: string;
}

export const AIPhotoAnalyzer: React.FC<AIPhotoAnalyzerProps> = ({
  onPhotosChange,
  maxPhotos,
  analysisType,
  placeholder,
  instructions
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const addPhoto = () => {
    // Mock photo addition - in real app, this would open camera/gallery
    const newPhoto: Photo = {
      uri: `https://picsum.photos/200/200?random=${Date.now()}`,
      analysis: {
        material: 'plaster',
        confidence: 0.85,
        healthScore: 78,
        issues: {
          cracks: false,
          stains: true,
          stainSeverity: 0.3,
          stainType: 'mineral'
        }
      }
    };
    
    const updatedPhotos = [...photos, newPhoto];
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>{instructions}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.photosContainer}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          {photos.length < maxPhotos && (
            <TouchableOpacity style={styles.addButton} onPress={addPhoto}>
              <Ionicons name="camera" size={32} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>{placeholder}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  instructions: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  photosContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  photoWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 10,
    color: theme.colors.primary,
    marginTop: 4,
    textAlign: 'center',
  },
});