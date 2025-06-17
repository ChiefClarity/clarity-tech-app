/**
 * Web-compatible camera utilities using HTML5 file input
 * Replaces expo-image-picker for PWA compatibility
 */

export interface CameraOptions {
  mediaTypes: 'photo' | 'video' | 'all';
  allowsEditing?: boolean;
  quality?: number;
  base64?: boolean;
}

export interface CameraResult {
  cancelled: boolean;
  uri?: string;
  base64?: string;
  width?: number;
  height?: number;
  type?: 'image' | 'video';
}

/**
 * Request camera permissions (always granted on web)
 */
export const requestCameraPermissions = async (): Promise<{ granted: boolean }> => {
  // On web, file input doesn't require explicit permissions
  return { granted: true };
};

/**
 * Launch camera using HTML5 file input with capture attribute
 */
export const launchCamera = async (options: CameraOptions = { mediaTypes: 'photo' }): Promise<CameraResult> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    // Set accept attribute based on media type
    if (options.mediaTypes === 'photo') {
      input.accept = 'image/*';
      input.capture = 'environment'; // Use back camera if available
    } else if (options.mediaTypes === 'video') {
      input.accept = 'video/*';
      input.capture = 'environment';
    } else {
      input.accept = 'image/*,video/*';
      input.capture = 'environment';
    }

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      
      if (!file) {
        resolve({ cancelled: true });
        return;
      }

      try {
        const uri = URL.createObjectURL(file);
        const result: CameraResult = {
          cancelled: false,
          uri,
          type: file.type.startsWith('image/') ? 'image' : 'video',
        };

        // Get image dimensions if it's an image
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            result.width = img.width;
            result.height = img.height;
            
            // Convert to base64 if requested
            if (options.base64) {
              const reader = new FileReader();
              reader.onload = () => {
                result.base64 = (reader.result as string).split(',')[1];
                resolve(result);
              };
              reader.readAsDataURL(file);
            } else {
              resolve(result);
            }
          };
          img.src = uri;
        } else {
          resolve(result);
        }
      } catch (error) {
        console.error('Error processing camera input:', error);
        resolve({ cancelled: true });
      }
    };

    input.oncancel = () => {
      resolve({ cancelled: true });
    };

    // Trigger file picker
    input.click();
  });
};

/**
 * Launch image library using HTML5 file input
 */
export const launchImageLibrary = async (options: CameraOptions = { mediaTypes: 'photo' }): Promise<CameraResult> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    // Set accept attribute based on media type
    if (options.mediaTypes === 'photo') {
      input.accept = 'image/*';
    } else if (options.mediaTypes === 'video') {
      input.accept = 'video/*';
    } else {
      input.accept = 'image/*,video/*';
    }

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      
      if (!file) {
        resolve({ cancelled: true });
        return;
      }

      try {
        const uri = URL.createObjectURL(file);
        const result: CameraResult = {
          cancelled: false,
          uri,
          type: file.type.startsWith('image/') ? 'image' : 'video',
        };

        // Get image dimensions if it's an image
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            result.width = img.width;
            result.height = img.height;
            
            // Convert to base64 if requested
            if (options.base64) {
              const reader = new FileReader();
              reader.onload = () => {
                result.base64 = (reader.result as string).split(',')[1];
                resolve(result);
              };
              reader.readAsDataURL(file);
            } else {
              resolve(result);
            }
          };
          img.src = uri;
        } else {
          resolve(result);
        }
      } catch (error) {
        console.error('Error processing image library input:', error);
        resolve({ cancelled: true });
      }
    };

    input.oncancel = () => {
      resolve({ cancelled: true });
    };

    // Trigger file picker
    input.click();
  });
};

// Compatibility exports for expo-image-picker API
export const requestCameraPermissionsAsync = requestCameraPermissions;
export const launchCameraAsync = launchCamera;
export const launchImageLibraryAsync = launchImageLibrary;

export const MediaTypeOptions = {
  All: 'all' as const,
  Videos: 'video' as const,
  Images: 'photo' as const,
};

export default {
  requestCameraPermissions,
  requestCameraPermissionsAsync,
  launchCamera,
  launchCameraAsync,
  launchImageLibrary,
  launchImageLibraryAsync,
  MediaTypeOptions,
};