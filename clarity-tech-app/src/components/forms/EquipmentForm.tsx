import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from '../../utils/webCamera';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModernInput } from '../ui/ModernInput';
import { GradientButton } from '../ui/GradientButton';
import { theme } from '../../styles/theme';
import { Equipment } from '../../types';
import { EQUIPMENT_TYPES, CONDITION_OPTIONS } from '../../constants/api';

const equipmentSchema = z.object({
  type: z.enum(['pump', 'filter', 'sanitizer', 'heater', 'cleaner', 'other']),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  serial: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  installDate: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onSave: (equipment: any) => void;
  onCancel: () => void;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  onSave,
  onCancel,
}) => {
  const [photoUri, setPhotoUri] = useState<string | undefined>(equipment?.photoUri);
  const [selectedType, setSelectedType] = useState(equipment?.type || 'pump');
  const [selectedCondition, setSelectedCondition] = useState(equipment?.condition || 'good');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      type: equipment?.type || 'pump',
      manufacturer: equipment?.manufacturer || '',
      model: equipment?.model || '',
      serial: equipment?.serial || '',
      condition: equipment?.condition || 'good',
      installDate: equipment?.installDate || '',
    },
  });

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onSubmit = (data: EquipmentFormData) => {
    const equipmentData = {
      ...data,
      photoUri,
      id: equipment?.id,
    };
    onSave(equipmentData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {equipment ? 'Edit Equipment' : 'Add Equipment'}
      </Text>

      <Text style={styles.label}>Equipment Type</Text>
      <View style={styles.typeGrid}>
        {EQUIPMENT_TYPES.map((type: { value: string; label: string }) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeOption,
              selectedType === type.value && styles.typeOptionSelected,
            ]}
            onPress={() => setSelectedType(type.value as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.typeOptionText,
                selectedType === type.value && styles.typeOptionTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Controller
        control={control}
        name="manufacturer"
        render={({ field: { onChange, onBlur, value } }) => (
          <ModernInput
            label="Manufacturer"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.manufacturer?.message}
            placeholder="e.g., Pentair"
          />
        )}
      />

      <Controller
        control={control}
        name="model"
        render={({ field: { onChange, onBlur, value } }) => (
          <ModernInput
            label="Model"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.model?.message}
            placeholder="e.g., SuperFlo VS"
          />
        )}
      />

      <Controller
        control={control}
        name="serial"
        render={({ field: { onChange, onBlur, value } }) => (
          <ModernInput
            label="Serial Number (Optional)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.serial?.message}
          />
        )}
      />

      <Text style={styles.label}>Condition</Text>
      <View style={styles.conditionGrid}>
        {CONDITION_OPTIONS.map((condition: { value: string; label: string }) => (
          <TouchableOpacity
            key={condition.value}
            style={[
              styles.conditionOption,
              selectedCondition === condition.value && styles.conditionOptionSelected,
            ]}
            onPress={() => setSelectedCondition(condition.value as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.conditionOptionText,
                selectedCondition === condition.value && styles.conditionOptionTextSelected,
              ]}
            >
              {condition.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.photoButton} onPress={takePhoto} activeOpacity={0.7}>
        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <View style={styles.photoOverlay}>
              <Ionicons name="camera" size={24} color={theme.colors.white} />
              <Text style={styles.photoOverlayText}>Change Photo</Text>
            </View>
          </View>
        ) : (
          <>
            <Ionicons name="camera-outline" size={32} color={theme.colors.blueGreen} />
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <GradientButton
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.cancelButton}
        />
        <GradientButton
          title="Save"
          onPress={() => {
            const formData = {
              type: selectedType,
              manufacturer: control._formValues.manufacturer,
              model: control._formValues.model,
              serial: control._formValues.serial,
              condition: selectedCondition,
              installDate: control._formValues.installDate,
            };
            handleSubmit(() => onSubmit(formData as EquipmentFormData))();
          }}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  typeOption: {
    flex: 1,
    minWidth: '30%',
    margin: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  typeOptionSelected: {
    borderColor: theme.colors.blueGreen,
    backgroundColor: theme.colors.seaFoam,
  },
  typeOptionText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: theme.colors.darkBlue,
  },
  conditionGrid: {
    flexDirection: 'row',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  conditionOption: {
    flex: 1,
    margin: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  conditionOptionSelected: {
    borderColor: theme.colors.blueGreen,
    backgroundColor: theme.colors.seaFoam,
  },
  conditionOptionText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  conditionOptionTextSelected: {
    color: theme.colors.darkBlue,
  },
  photoButton: {
    height: 150,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.lg,
    overflow: 'hidden',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlayText: {
    color: theme.colors.white,
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.xs,
  },
  photoButtonText: {
    color: theme.colors.blueGreen,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
  },
  cancelButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  saveButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});