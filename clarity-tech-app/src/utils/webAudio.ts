/**
 * Web-compatible audio recording utilities using Web Audio API
 * Replaces expo-av for PWA compatibility
 */

export interface AudioRecording {
  getURI(): string | null;
  startAsync(): Promise<void>;
  stopAndUnloadAsync(): Promise<void>;
  _recorder?: MediaRecorder;
  _audioChunks?: Blob[];
  _audioBlob?: Blob;
  _uri?: string;
}

export interface AudioRecordingOptions {
  android?: {
    extension?: string;
    outputFormat?: string;
    audioEncoder?: string;
  };
  ios?: {
    extension?: string;
    outputFormat?: string;
    audioQuality?: string;
  };
  web?: {
    mimeType?: string;
    bitsPerSecond?: number;
  };
}

export const RecordingOptionsPresets = {
  HIGH_QUALITY: {
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  },
  LOW_QUALITY: {
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 64000,
    },
  },
};

/**
 * Request microphone permissions
 */
export const requestPermissionsAsync = async (): Promise<{ status: 'granted' | 'denied' }> => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return { status: 'granted' };
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return { status: 'denied' };
  }
};

/**
 * Set audio mode (no-op on web)
 */
export const setAudioModeAsync = async (options: any): Promise<void> => {
  // No-op on web, browser handles audio mode automatically
  return Promise.resolve();
};

/**
 * Create a new audio recording
 */
export const createRecording = (options: AudioRecordingOptions = RecordingOptionsPresets.HIGH_QUALITY): AudioRecording => {
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let audioBlob: Blob | null = null;
  let audioUri: string | null = null;

  const recording: AudioRecording = {
    getURI(): string | null {
      return audioUri;
    },

    async startAsync(): Promise<void> {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const mimeType = options.web?.mimeType || 'audio/webm';
        const bitsPerSecond = options.web?.bitsPerSecond || 128000;

        mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm',
          bitsPerSecond,
        });

        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          audioBlob = new Blob(audioChunks, { type: mimeType });
          audioUri = URL.createObjectURL(audioBlob);
          
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
      } catch (error) {
        throw new Error(`Failed to start recording: ${error}`);
      }
    },

    async stopAndUnloadAsync(): Promise<void> {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        return new Promise((resolve) => {
          mediaRecorder!.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioUri = URL.createObjectURL(audioBlob);
            resolve();
          };
          mediaRecorder!.stop();
        });
      }
    },

    _recorder: mediaRecorder || undefined,
    _audioChunks: audioChunks,
    _audioBlob: audioBlob || undefined,
    _uri: audioUri || undefined,
  };

  return recording;
};

/**
 * Audio class with static methods (expo-av compatibility)
 */
export const Audio = {
  requestPermissionsAsync,
  setAudioModeAsync,
  Recording: {
    createAsync: async (options: AudioRecordingOptions = RecordingOptionsPresets.HIGH_QUALITY): Promise<{ recording: AudioRecording }> => {
      const recording = createRecording(options);
      return { recording };
    },
  },
  RecordingOptionsPresets,
};

export default Audio;