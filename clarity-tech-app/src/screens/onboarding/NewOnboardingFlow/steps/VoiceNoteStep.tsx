import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboarding } from '../../../../contexts/OnboardingContext';
import { AIInsightsBox } from '../../../../components/common/AIInsightsBox';
import { theme } from '../../../../styles/theme';
import { webAlert } from '../utils/webAlert';

export const VoiceNoteStep: React.FC = () => {
  const { session, recordVoiceNote, completeSession } = useOnboarding();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingError, setRecordingError] = useState<string>('');
  const [playbackError, setPlaybackError] = useState<string>('');
  
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
      // Detect supported audio format for current browser
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4'; // Safari fallback

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined
      });

      // Store the mime type for later use
      const recordingMimeType = mediaRecorder.mimeType || 'audio/webm';
      console.log('[VoiceNote] Recording with mimeType:', recordingMimeType);
      const chunks: Blob[] = [];
      const startTime = Date.now(); // Track actual time

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Use actual elapsed time for validation
        const actualDuration = Math.floor((Date.now() - startTime) / 1000);
        
        // Create blob from chunks
        // Use the actual mimeType that was used for recording
        const blob = new Blob(chunks, { type: recordingMimeType });
        console.log('[VoiceNote] Created blob with type:', blob.type, 'size:', blob.size);
        setAudioBlob(blob);
        
        // Check duration with actual time
        if (actualDuration < 30) {
          // Show inline message instead of alert
          setRecordingError('Please record at least 30 seconds of observations about the pool.');
          setRecordingDuration(0);
          setAudioBlob(null);
          setHasRecorded(false);
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
          // Success - no popup needed
        };
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordingError(''); // Clear any previous errors

      // Start duration timer with proper ref
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds = Math.floor((Date.now() - startTime) / 1000); // Use actual elapsed time
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
    if (!audioBlob && !session?.voiceNote?.uri) {
      console.error('[VoiceNote] No audio blob available');
      return;
    }
    
    try {
      // Stop current playback if any
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      
      // Create audio element if not exists
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      // Create object URL from blob or use saved URI
      let audioUrl: string;
      if (audioBlob) {
        audioUrl = URL.createObjectURL(audioBlob);
        console.log('[VoiceNote] Created blob URL for playback');
      } else if (session?.voiceNote?.uri) {
        audioUrl = session.voiceNote.uri;
      } else {
        throw new Error('No audio source available');
      }
      
      audioRef.current.src = audioUrl;
      
      // Set up event handlers
      audioRef.current.onloadeddata = () => {
        console.log('[VoiceNote] Audio loaded successfully');
      };
      
      audioRef.current.onended = () => {
        console.log('[VoiceNote] Playback ended');
        setIsPlaying(false);
        if (audioBlob) URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.onerror = (e) => {
        console.error('[VoiceNote] Playback error:', e);
        setIsPlaying(false);
        
        // Browser-specific playback not supported message
        const userAgent = navigator.userAgent.toLowerCase();
        let message = 'Playback not available in this browser. Recording saved successfully.';
        
        if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
          message = 'Safari playback not supported. Recording saved successfully.';
        }
        
        setPlaybackError(message);
        setTimeout(() => setPlaybackError(''), 4000);
      };
      
      // Attempt playback
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[VoiceNote] Playback started');
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('[VoiceNote] Play promise rejected:', error.name, error.message);
            setIsPlaying(false);
            
            // Don't show error - recording is still saved
            setPlaybackError('Playback unavailable. Recording saved successfully.');
            setTimeout(() => setPlaybackError(''), 4000);
          });
      }
    } catch (error) {
      console.error('[VoiceNote] Playback setup failed:', error);
      setPlaybackError('Recording saved successfully.');
      setTimeout(() => setPlaybackError(''), 4000);
      setIsPlaying(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleNext = async () => {
    if (!hasRecorded || !audioBlob) {
      webAlert.alert(
        'Voice Note Required',
        'A voice note is REQUIRED to complete the onboarding.'
      );
      return;
    }
    
    if (recordingDuration < 30) {
      webAlert.alert(
        'Recording Too Short',
        `Please record at least 30 seconds. Your recording was only ${recordingDuration} seconds.`
      );
      return;
    }
    
    try {
      // Create object URL for local storage
      const blobUrl = URL.createObjectURL(audioBlob);
      
      // Save voice note with blob URL (for local playback)
      await recordVoiceNote(blobUrl, recordingDuration);
      
      // Complete session
      await completeSession();
    } catch (err: any) {
      console.error('[VoiceNoteStep] Error:', err);
      webAlert.alert('Error', err.message || 'Failed to complete onboarding. Please try again.');
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
      {/* Header with gradient */}
      <LinearGradient
        colors={[theme.colors.blueGreen, theme.colors.darkBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Voice Notes</Text>
        <Text style={styles.headerSubtitle}>
          Record your observations about the pool
        </Text>
      </LinearGradient>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Voice Recording Card */}
        <View style={styles.voiceCard}>
          {/* Instructions */}
          <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>
            Voice Note Required (30 seconds - 3 minutes)
          </Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>• Overall pool condition and cleanliness</Text>
            <Text style={styles.instructionItem}>• Equipment issues or concerns</Text>
            <Text style={styles.instructionItem}>• Special circumstances affecting pricing</Text>
            <Text style={styles.instructionItem}>• Tree coverage and debris load</Text>
            <Text style={styles.instructionItem}>• Access challenges or safety issues</Text>
            <Text style={styles.instructionItem}>• Customer-specific requirements</Text>
          </View>
          <View style={styles.mandatoryNotice}>
            <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
            <Text style={styles.mandatoryText}>
              This step is MANDATORY for AI pricing analysis
            </Text>
          </View>
        </View>
        
        {/* Error Message */}
        {recordingError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>{recordingError}</Text>
          </View>
        )}
        
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
              
              {/* Playback Error Message */}
              {playbackError && (
                <Text style={styles.playbackError}>{playbackError}</Text>
              )}
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
        
        {/* Recording Success Indicator */}
        {hasRecorded && !isRecording && recordingDuration >= 30 && (
          <View style={styles.successContainer}>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.successText}>
                Recording saved ({formatTime(recordingDuration)})
              </Text>
            </View>
            {playbackError && (
              <Text style={styles.playbackNote}>{playbackError}</Text>
            )}
          </View>
        )}
        </View>
        
        {/* AI Insights */}
        <AIInsightsBox stepName="voiceNote" />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  voiceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    flex: 1,
  },
  playbackError: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.warning,
    textAlign: 'center',
  },
  mandatoryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mandatoryText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.error,
    fontWeight: '600',
    flex: 1,
  },
  successContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${theme.colors.success}30`,
  },
  successText: {
    marginLeft: 8,
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  playbackNote: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
});