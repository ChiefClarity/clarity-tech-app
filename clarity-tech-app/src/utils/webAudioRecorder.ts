/**
 * Web-compatible audio recording utilities using MediaRecorder API
 * Replaces expo-av for PWA compatibility
 */

export interface RecordingOptions {
  android?: {
    extension: string;
    outputFormat: number;
    audioEncoder: number;
  };
  ios?: {
    extension: string;
    outputFormat: string;
    audioQuality: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    linearPCMBitDepth: number;
    linearPCMIsBigEndian: boolean;
    linearPCMIsFloat: boolean;
  };
  web?: {
    mimeType: string;
    bitsPerSecond: number;
  };
}

export interface RecordingStatus {
  canRecord: boolean;
  isRecording: boolean;
  isDoneRecording: boolean;
  durationMillis: number;
}

export interface Sound {
  loadAsync: (source: { uri: string }) => Promise<void>;
  playAsync: () => Promise<void>;
  pauseAsync: () => Promise<void>;
  stopAsync: () => Promise<void>;
  unloadAsync: () => Promise<void>;
  setOnPlaybackStatusUpdate: (callback: (status: any) => void) => void;
  getStatusAsync: () => Promise<any>;
}

class WebAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private stream: MediaStream | null = null;
  private recordingStatus: RecordingStatus = {
    canRecord: false,
    isRecording: false,
    isDoneRecording: false,
    durationMillis: 0,
  };

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<{ granted: boolean }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
      return { granted: true };
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return { granted: false };
    }
  }

  /**
   * Prepare recording
   */
  async prepareToRecordAsync(options?: RecordingOptions): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const mimeType = options?.web?.mimeType || 'audio/webm;codecs=opus';
      const bitsPerSecond = options?.web?.bitsPerSecond || 128000;

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm',
        bitsPerSecond,
      });

      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.recordingStatus.canRecord = true;
    } catch (error) {
      console.error('Error preparing to record:', error);
      throw error;
    }
  }

  /**
   * Start recording
   */
  async startAsync(): Promise<void> {
    if (!this.mediaRecorder || this.recordingStatus.isRecording) {
      throw new Error('Recording not prepared or already recording');
    }

    this.startTime = Date.now();
    this.mediaRecorder.start(100); // Collect data every 100ms
    this.recordingStatus.isRecording = true;
    this.recordingStatus.isDoneRecording = false;
  }

  /**
   * Stop recording and return URI
   */
  async stopAndUnloadAsync(): Promise<{ uri: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.recordingStatus.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const uri = URL.createObjectURL(audioBlob);
        
        this.recordingStatus.isRecording = false;
        this.recordingStatus.isDoneRecording = true;
        this.recordingStatus.durationMillis = Date.now() - this.startTime;

        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        resolve({ uri });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get current recording status
   */
  getStatusAsync(): Promise<RecordingStatus> {
    if (this.recordingStatus.isRecording) {
      this.recordingStatus.durationMillis = Date.now() - this.startTime;
    }
    return Promise.resolve({ ...this.recordingStatus });
  }
}

class WebAudioPlayer implements Sound {
  private audio: HTMLAudioElement | null = null;
  private onPlaybackStatusUpdate: ((status: any) => void) | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  async loadAsync(source: { uri: string }): Promise<void> {
    this.audio = new Audio(source.uri);
    
    this.audio.addEventListener('loadedmetadata', () => {
      this.notifyStatusUpdate();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.notifyStatusUpdate();
    });

    this.audio.addEventListener('ended', () => {
      this.notifyStatusUpdate();
    });

    return new Promise((resolve, reject) => {
      if (!this.audio) return reject(new Error('Audio not initialized'));
      
      this.audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      this.audio.addEventListener('error', reject, { once: true });
    });
  }

  async playAsync(): Promise<void> {
    if (!this.audio) throw new Error('Audio not loaded');
    await this.audio.play();
    this.startStatusUpdates();
  }

  async pauseAsync(): Promise<void> {
    if (!this.audio) throw new Error('Audio not loaded');
    this.audio.pause();
    this.stopStatusUpdates();
  }

  async stopAsync(): Promise<void> {
    if (!this.audio) throw new Error('Audio not loaded');
    this.audio.pause();
    this.audio.currentTime = 0;
    this.stopStatusUpdates();
  }

  async unloadAsync(): Promise<void> {
    this.stopStatusUpdates();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }

  setOnPlaybackStatusUpdate(callback: (status: any) => void): void {
    this.onPlaybackStatusUpdate = callback;
  }

  async getStatusAsync(): Promise<any> {
    if (!this.audio) return { isLoaded: false };

    return {
      isLoaded: true,
      isPlaying: !this.audio.paused,
      positionMillis: this.audio.currentTime * 1000,
      durationMillis: this.audio.duration * 1000,
      shouldPlay: !this.audio.paused,
    };
  }

  private notifyStatusUpdate(): void {
    if (this.onPlaybackStatusUpdate) {
      this.getStatusAsync().then(status => {
        if (this.onPlaybackStatusUpdate) {
          this.onPlaybackStatusUpdate(status);
        }
      });
    }
  }

  private startStatusUpdates(): void {
    this.stopStatusUpdates();
    this.updateInterval = setInterval(() => {
      this.notifyStatusUpdate();
    }, 100);
  }

  private stopStatusUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Export Audio-like interface for compatibility
export const Audio = {
  Recording: WebAudioRecorder,
  Sound: WebAudioPlayer,
  
  // Recording methods
  async requestPermissionsAsync() {
    const recorder = new WebAudioRecorder();
    return recorder.requestPermissions();
  },

  async setAudioModeAsync(mode: any) {
    // No-op on web
    return Promise.resolve();
  },

  // Constants for compatibility
  RECORDING_OPTIONS_PRESET_HIGH_QUALITY: {
    web: {
      mimeType: 'audio/webm;codecs=opus',
      bitsPerSecond: 128000,
    }
  },

  INTERRUPTION_MODE_IOS_DO_NOT_MIX: 0,
  INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS: 1,
  INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 1,
  INTERRUPTION_MODE_ANDROID_DUCK_OTHERS: 2,
};

export default Audio;