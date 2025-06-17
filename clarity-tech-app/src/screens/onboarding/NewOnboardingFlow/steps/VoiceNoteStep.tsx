import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';

export const VoiceNoteStep: React.FC = () => {
  const { session, recordVoiceNote, completeSession } = useOnboarding();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Check if we already have a recording
  useEffect(() => {
    if (session?.voiceNote) {
      setHasRecorded(true);
      setRecordingDuration(session.voiceNote.duration);
    }
  }, [session?.voiceNote]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);
  
  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Create blob from chunks
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Check duration
        if (recordingDuration < 30) {
          webAlert.alert(
            'Recording Too Short',
            'Please record at least 30 seconds of observations about the pool.',
            [{ text: 'OK' }]
          );
          setRecordingDuration(0);
          setAudioBlob(null);
          return;
        }
        
        if (recordingDuration > 180) {
          webAlert.alert(
            'Recording Too Long',
            'Please keep your recording under 3 minutes.',
            [{ text: 'OK' }]
          );
          setRecordingDuration(0);
          setAudioBlob(null);
          return;
        }
        
        // Convert blob to base64 for storage
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          await recordVoiceNote(base64, recordingDuration);
          setHasRecorded(true);
          webAlert.alert('Success', 'Voice note saved successfully!');
        };
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingDuration(seconds);
        
        // Auto-stop at 3 minutes
        if (seconds >= 180) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      console.error('Recording error:', err);
      webAlert.alert('Recording Error', 'Unable to access microphone. Please check your browser permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
    }
  };
  
  const playRecording = async () => {
    if (!session?.voiceNote?.uri && !audioBlob) return;
    
    try {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      
      // Create audio element
      const audio = new Audio();
      
      if (session?.voiceNote?.uri) {
        // Play from saved base64
        audio.src = session.voiceNote.uri;
      } else if (audioBlob) {
        // Play from blob
        const url = URL.createObjectURL(audioBlob);
        audio.src = url;
      }
      
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        webAlert.alert('Playback Error', 'Failed to play recording.');
        setIsPlaying(false);
      };
      
      await audio.play();
      setIsPlaying(true);
      
    } catch (err) {
      webAlert.alert('Playback Error', 'Failed to play recording.');
      setIsPlaying(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleNext = async () => {
    if (!hasRecorded) {
      webAlert.alert('Recording Required', 'Please record a voice note before continuing.');
      return;
    }
    
    try {
      await completeSession();
    } catch (err) {
      webAlert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };
  
  const reRecord = () => {
    setHasRecorded(false);
    setRecordingDuration(0);
    setAudioBlob(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Notes</Text>
        <Text style={styles.subtitle}>
          Record your observations about the pool. Mention any concerns, special features, or maintenance recommendations.
        </Text>
      </View>
      
      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>What to Include:</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>• Overall pool condition and cleanliness</Text>
            <Text style={styles.instructionItem}>• Any equipment issues or concerns</Text>
            <Text style={styles.instructionItem}>• Special features or automation</Text>
            <Text style={styles.instructionItem}>• Maintenance recommendations</Text>
            <Text style={styles.instructionItem}>• Customer-specific observations</Text>
          </View>
          <View style={styles.durationInfo}>
            <Ionicons name="time-outline" size={16} color={theme.colors.gray} />
            <Text style={styles.durationText}>30 seconds - 3 minutes</Text>
          </View>
        </View>
        
        {/* Recording Interface */}
        <View style={styles.recordingSection}>
          {isRecording ? (
            <View style={styles.recordingActive}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.recordButton}
                >
                  <Ionicons name="stop" size={40} color="white" />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.recordingTime}>{formatTime(recordingDuration)}</Text>
              <Text style={styles.recordingLabel}>Recording...</Text>
              <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
                <Text style={styles.stopButtonText}>Stop Recording</Text>
              </TouchableOpacity>
            </View>
          ) : hasRecorded ? (
            <View style={styles.recordingComplete}>
              <View style={styles.completedIcon}>
                <Ionicons name="checkmark-circle" size={60} color={theme.colors.success} />
              </View>
              <Text style={styles.completedText}>Voice Note Recorded</Text>
              <Text style={styles.completedDuration}>{formatTime(recordingDuration)}</Text>
              
              <View style={styles.playbackControls}>
                <TouchableOpacity onPress={playRecording} style={styles.playButton}>
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={24} 
                    color={theme.colors.blueGreen} 
                  />
                  <Text style={styles.playButtonText}>
                    {isPlaying ? 'Pause' : 'Play Recording'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={reRecord} 
                  style={styles.rerecordButton}
                >
                  <Ionicons name="refresh" size={20} color={theme.colors.gray} />
                  <Text style={styles.rerecordButtonText}>Re-record</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.recordingReady}>
              <TouchableOpacity onPress={startRecording}>
                <LinearGradient
                  colors={[theme.colors.blueGreen, theme.colors.darkBlue]}
                  style={styles.recordButton}
                >
                  <Ionicons name="mic" size={40} color="white" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.startText}>Tap to Start Recording</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Hidden submit handler */}
      <View style={{ height: 0, overflow: 'hidden' }}>
        <TouchableOpacity onPress={handleNext} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  instructionsBox: {
    backgroundColor: theme.colors.seaFoam + '30',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  instructionsTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
  },
  instructionsList: {
    marginBottom: theme.spacing.md,
  },
  instructionItem: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  durationText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
  recordingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingReady: {
    alignItems: 'center',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    marginTop: theme.spacing.lg,
  },
  recordingActive: {
    alignItems: 'center',
  },
  recordingTime: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '700',
    color: theme.colors.darkBlue,
    marginTop: theme.spacing.xl,
  },
  recordingLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  stopButton: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.xl,
  },
  stopButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.white,
    fontWeight: '600',
  },
  recordingComplete: {
    alignItems: 'center',
  },
  completedIcon: {
    marginBottom: theme.spacing.md,
  },
  completedText: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
  },
  completedDuration: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
  playbackControls: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.seaFoam,
    borderRadius: theme.borderRadius.xl,
  },
  playButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.blueGreen,
    fontWeight: '600',
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  rerecordButtonText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
  },
});