import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from '../../utils/webAudioRecorder';

import { Card } from '../../components/ui/Card';
import { GradientButton } from '../../components/ui/GradientButton';
import { theme } from '../../styles/theme';

interface VoiceNoteStepProps {
  data: any;
  onNext: (data: { voiceNoteUri?: string }) => void;
  onBack: () => void;
}

export const VoiceNoteStep: React.FC<VoiceNoteStepProps> = ({
  data,
  onNext,
  onBack,
}) => {
  const [recording, setRecording] = useState<InstanceType<typeof Audio.Recording> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | undefined>(
    data.voiceNoteUri
  );
  const [sound, setSound] = useState<InstanceType<typeof Audio.Sound> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [sound]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Microphone permission is required to record audio.');
        return;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      // Haptic feedback not available on web

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      // Haptic feedback not available on web
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  const playSound = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis || 0);
          setPlaybackDuration(status.durationMillis || 0);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackPosition(0);
          }
        }
      });
    } catch (error) {
      console.error('Error playing sound', error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this voice note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRecordingUri(undefined);
            setPlaybackPosition(0);
            setPlaybackDuration(0);
            if (sound) {
              sound.unloadAsync();
              setSound(null);
            }
          },
        },
      ]
    );
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    onNext({ voiceNoteUri: recordingUri });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Voice Note (Optional)</Text>
        <Text style={styles.subtitle}>
          Record any additional notes or observations about this pool onboarding.
        </Text>

        <Card style={styles.recordingCard} variant="elevated">
          {!recordingUri ? (
            <View style={styles.recordingSection}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={32}
                  color={theme.colors.white}
                />
              </TouchableOpacity>
              
              <Text style={styles.recordingInstruction}>
                {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
              </Text>
              
              {isRecording && (
                <Text style={styles.recordingTimer}>
                  {formatTime(recordingDuration * 1000)}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.playbackSection}>
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={isPlaying ? stopSound : playSound}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={24}
                    color={theme.colors.blueGreen}
                  />
                </TouchableOpacity>
                
                <View style={styles.playbackInfo}>
                  <Text style={styles.playbackTime}>
                    {formatTime(playbackPosition)} / {formatTime(playbackDuration)}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: playbackDuration > 0
                            ? `${(playbackPosition / playbackDuration) * 100}%`
                            : '0%',
                        },
                      ]}
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={deleteRecording}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        <Text style={styles.tip}>
          💡 Tip: Use voice notes to record any special instructions, concerns, or observations that might be helpful for future visits.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <GradientButton
            title="Back"
            onPress={onBack}
            variant="outline"
            size="large"
            style={styles.backButton}
          />
          <GradientButton
            title="Complete"
            onPress={handleNext}
            size="large"
            style={styles.nextButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  recordingCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  recordingSection: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.blueGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  recordButtonActive: {
    backgroundColor: theme.colors.error,
  },
  recordingInstruction: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  recordingTimer: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.blueGreen,
  },
  playbackSection: {
    width: '100%',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.seaFoam,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  playbackInfo: {
    flex: 1,
  },
  playbackTime: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.blueGreen,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  tip: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.gray,
    backgroundColor: theme.colors.lightGray,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  nextButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});