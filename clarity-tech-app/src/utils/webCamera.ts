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
  return new Promise((resolve, reject) => {
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

    let timeoutId: NodeJS.Timeout;
    
    // Add timeout for file processing
    const setupTimeout = () => {
      timeoutId = setTimeout(() => {
        console.warn('Camera operation timed out');
        resolve({ cancelled: true });
      }, 30000); // 30 second timeout
    };

    input.onchange = async (event) => {
      clearTimeout(timeoutId);
      const file = (event.target as HTMLInputElement).files?.[0];
      
      if (!file) {
        resolve({ cancelled: true });
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        console.error('File too large. Maximum size is 10MB');
        reject(new Error('File size exceeds 10MB limit'));
        return;
      }

      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
      
      if (options.mediaTypes === 'photo' && !validImageTypes.includes(file.type)) {
        console.error('Invalid image type:', file.type);
        reject(new Error('Invalid image format. Please use JPEG, PNG, GIF, or WebP'));
        return;
      }
      
      if (options.mediaTypes === 'video' && !validVideoTypes.includes(file.type)) {
        console.error('Invalid video type:', file.type);
        reject(new Error('Invalid video format. Please use MP4 or MOV'));
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
          
          // Add error handling for image loading
          img.onerror = (error) => {
            console.error('Failed to load image:', error);
            URL.revokeObjectURL(uri);
            reject(new Error('Failed to process image. Please try again'));
          };
          
          img.onload = () => {
            result.width = img.width;
            result.height = img.height;
            
            // Validate image dimensions (min 100x100, max 5000x5000)
            if (img.width < 100 || img.height < 100) {
              URL.revokeObjectURL(uri);
              reject(new Error('Image too small. Minimum size is 100x100 pixels'));
              return;
            }
            
            if (img.width > 5000 || img.height > 5000) {
              URL.revokeObjectURL(uri);
              reject(new Error('Image too large. Maximum size is 5000x5000 pixels'));
              return;
            }
            
            // Convert to base64 if requested
            if (options.base64) {
              const reader = new FileReader();
              
              reader.onerror = () => {
                console.error('Failed to read file');
                URL.revokeObjectURL(uri);
                reject(new Error('Failed to read image file'));
              };
              
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
        reject(new Error('Failed to process image. Please try again'));
      }
    };

    input.oncancel = () => {
      clearTimeout(timeoutId);
      resolve({ cancelled: true });
    };

    // Setup timeout before triggering file picker
    setupTimeout();
    
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
        reject(new Error('Failed to process image. Please try again'));
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