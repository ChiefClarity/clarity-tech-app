import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AudioRecording } from '../../../utils/webAudio';

import { GradientButton } from '../../../components/ui/GradientButton';
import { theme } from '../../../styles/theme';
import { FEATURES, AI_ENDPOINTS } from '../../../config/features';

interface ModernVoiceNoteStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSubmit?: (data: any) => void;
}

export const ModernVoiceNoteStep = React.forwardRef<
  { submitForm: () => void },
  ModernVoiceNoteStepProps
>(({ data, onNext, onBack, onSubmit }, ref) => {
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(!!data.voiceNoteUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulse = () => {
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
        ]).start(pulse);
      };
      pulse();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= FEATURES.VOICE_MAX_DURATION) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // TODO: Integrate Claude API for voice transcription
  const transcribeVoice = async (voiceUri: string) => {
    if (FEATURES.USE_REAL_AI) {
      try {
        const response = await fetch(AI_ENDPOINTS.TRANSCRIBE_VOICE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceUri }),
          timeout: FEATURES.AI_ANALYSIS_TIMEOUT,
        });
        return await response.json();
      } catch (error) {
        console.error('TODO: Voice transcription failed:', error);
        throw error;
      }
    }
    
    // Mock transcription for development
    return {
      transcription: 'Pool looks great today. Water is crystal clear. Customer mentioned they had some algae issues last week but it\'s completely resolved now. Equipment is running smoothly, pump sounds good. Recommended weekly maintenance schedule.',
      confidence: 0.95,
      keyInsights: ['Pool condition: Excellent', 'Previous issue: Algae (resolved)', 'Equipment status: Good']
    };
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to record voice notes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      // Start recording immediately
      await recording.startAsync();
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Unable to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && recordingDuration >= FEATURES.VOICE_MIN_DURATION) {
        setHasRecording(true);
        setIsAnalyzing(true);
        
        try {
          const transcriptionResult = await transcribeVoice(uri);
          setTranscription(transcriptionResult.transcription);
          console.log(`🎙️ [AI] Voice transcribed with ${Math.round(transcriptionResult.confidence * 100)}% confidence`);
        } catch (error) {
          console.error('AI transcription failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      } else if (recordingDuration < FEATURES.VOICE_MIN_DURATION) {
        Alert.alert(
          'Recording Too Short', 
          `Please record for at least ${FEATURES.VOICE_MIN_DURATION} seconds to continue.`
        );
        setHasRecording(false);
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
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
            setHasRecording(false);
            setRecordingDuration(0);
            setTranscription('');
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    if (!hasRecording || recordingDuration < FEATURES.VOICE_MIN_DURATION) {
      Alert.alert(
        'Voice Note Required',
        `Please record a voice note of at least ${FEATURES.VOICE_MIN_DURATION} seconds before continuing.`
      );
      return;
    }
    
    const voiceData = {
      voiceNoteUri: recording?.getURI(),
      duration: recordingDuration,
      transcription,
    };
    
    if (onSubmit) {
      onSubmit(voiceData);
    } else {
      onNext(voiceData);
    }
  };

  // Expose submitForm to parent via ref
  React.useImperativeHandle(ref, () => ({
    submitForm: handleContinue,
    getCurrentData: () => ({
      voiceNoteUri: data.voiceNoteUri || '',
      transcription: transcription,
      textNote: ''
    }) // Returns current voice note data
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Voice Notes</Text>
        <Text style={styles.headerSubtitle}>
          Record your observations and notes about the pool
        </Text>
      </LinearGradient>

      {/* Recording Interface */}
      <View style={styles.recordingCard}>
        <View style={styles.recordingInterface}>
          {/* Record Button */}
          <TouchableOpacity
            style={styles.recordButtonContainer}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
          >
            <Animated.View
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <LinearGradient
                colors={isRecording ? ['#EF4444', '#DC2626'] : ['#8B5CF6', '#7C3AED']}
                style={styles.recordButtonGradient}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={40}
                  color="white"
                />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Timer */}
          <Text style={styles.timer}>
            {formatTime(recordingDuration)} / {formatTime(FEATURES.VOICE_MAX_DURATION)}
          </Text>

          {/* Status */}
          <View style={styles.statusContainer}>
            {isRecording && (
              <View style={styles.recordingStatus}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording...</Text>
              </View>
            )}
            {isAnalyzing && (
              <View style={styles.analyzingStatus}>
                <Ionicons name="sync" size={16} color={theme.colors.blueGreen} />
                <Text style={styles.analyzingText}>AI is analyzing...</Text>
              </View>
            )}
            {hasRecording && !isRecording && !isAnalyzing && (
              <View style={styles.completedStatus}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.completedText}>Recording complete</Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            {isRecording
              ? 'Tap the stop button when finished'
              : hasRecording
              ? `Minimum ${FEATURES.VOICE_MIN_DURATION}s recorded • Ready to continue`
              : `Record for at least ${FEATURES.VOICE_MIN_DURATION} seconds`}
          </Text>
        </View>

        {/* Recording Actions */}
        {hasRecording && !isRecording && (
          <View style={styles.recordingActions}>
            <TouchableOpacity style={styles.deleteButton} onPress={deleteRecording}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.rerecordButton} onPress={startRecording}>
              <Ionicons name="refresh-outline" size={20} color={theme.colors.blueGreen} />
              <Text style={styles.rerecordButtonText}>Re-record</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* AI Transcription */}
      {transcription && (
        <View style={styles.transcriptionCard}>
          <View style={styles.transcriptionHeader}>
            <Ionicons name="document-text" size={20} color={theme.colors.blueGreen} />
            <Text style={styles.transcriptionTitle}>AI Transcription</Text>
          </View>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      )}

      {/* AI Insight */}
      <View style={styles.aiInsight}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.aiInsightGradient}
        >
          <View style={styles.aiHeader}>
            <Ionicons name="bulb" size={20} color="#8B5CF6" />
            <Text style={styles.aiTitle}>AI Insight</Text>
          </View>
          <Text style={styles.aiText}>
            {hasRecording
              ? 'AI will analyze your voice notes to extract key insights and action items for the pool service report.'
              : 'Voice notes help AI understand pool conditions and generate comprehensive service recommendations.'}
          </Text>
        </LinearGradient>
      </View>


    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  recordingCard: {
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
  recordingInterface: {
    alignItems: 'center',
  },
  recordButtonContainer: {
    marginBottom: theme.spacing.lg,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  recordButtonActive: {
    shadowColor: '#EF4444',
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginBottom: theme.spacing.md,
    fontFamily: 'monospace',
  },
  statusContainer: {
    minHeight: 24,
    marginBottom: theme.spacing.md,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: theme.spacing.xs,
  },
  recordingText: {
    color: '#EF4444',
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
  analyzingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzingText: {
    color: theme.colors.blueGreen,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    color: theme.colors.success,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  instructions: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 18,
  },
  recordingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  rerecordButtonText: {
    color: theme.colors.blueGreen,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  transcriptionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(210, 226, 225, 1)',
  },
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  transcriptionTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.darkBlue,
    marginLeft: theme.spacing.sm,
  },
  transcriptionText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.gray,
    lineHeight: 20,
  },
  aiInsight: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiInsightGradient: {
    padding: theme.spacing.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  aiTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: theme.spacing.sm,
  },
  aiText: {
    fontSize: theme.typography.small.fontSize,
    color: '#6B46C1',
    lineHeight: 18,
  },
});