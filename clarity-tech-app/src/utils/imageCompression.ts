import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from './logger';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: ImageManipulator.SaveFormat;
}

interface CompressionResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

export class ImageCompressor {
  private static readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  };

  /**
   * Compress a single image with optimal settings for AI analysis
   */
  static async compressForAI(
    imageUri: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      logger.debug('Starting image compression', { 
        uri: imageUri,
        options: finalOptions 
      }, 'image');

      // Get original image info
      const originalInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { base64: false }
      );

      // Calculate resize dimensions maintaining aspect ratio
      const { width, height } = this.calculateDimensions(
        originalInfo.width,
        originalInfo.height,
        finalOptions.maxWidth!,
        finalOptions.maxHeight!
      );

      // Perform compression and resize
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width, height } }],
        {
          compress: finalOptions.quality,
          format: finalOptions.format,
          base64: true,
        }
      );

      // Calculate compression stats
      const originalSize = this.estimateBase64Size(imageUri);
      const compressedSize = manipResult.base64 ? manipResult.base64.length : 0;
      const compressionRatio = originalSize > 0 ? 
        ((originalSize - compressedSize) / originalSize) * 100 : 0;

      const result: CompressionResult = {
        uri: manipResult.uri,
        base64: manipResult.base64,
        width: manipResult.width,
        height: manipResult.height,
        originalSize,
        compressedSize,
        compressionRatio,
      };

      const duration = Date.now() - startTime;
      logger.info(`Image compressed successfully in ${duration}ms`, {
        originalDimensions: `${originalInfo.width}x${originalInfo.height}`,
        compressedDimensions: `${width}x${height}`,
        compressionRatio: `${compressionRatio.toFixed(1)}%`,
        finalSize: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`
      }, 'image');

      return result;
    } catch (error) {
      logger.error('Image compression failed', error, 'image');
      throw new Error(`Failed to compress image: ${error.message}`);
    }
  }

  /**
   * Compress multiple images in parallel
   */
  static async compressMultipleForAI(
    imageUris: string[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    logger.info(`Compressing ${imageUris.length} images`, null, 'image');
    
    const compressionPromises = imageUris.map(uri => 
      this.compressForAI(uri, options)
    );
    
    return Promise.all(compressionPromises);
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    // If image is smaller than max dimensions, don't upscale
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    // Calculate scale factors
    const widthScale = maxWidth / originalWidth;
    const heightScale = maxHeight / originalHeight;
    const scale = Math.min(widthScale, heightScale);

    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
    };
  }

  /**
   * Estimate base64 size from image URI (rough estimate)
   */
  private static estimateBase64Size(uri: string): number {
    // This is a rough estimate - actual implementation would
    // fetch the file size if available
    if (uri.startsWith('data:image')) {
      return uri.length;
    }
    // Default estimate for file URIs
    return 0;
  }

  /**
   * Get compression settings for specific use cases
   */
  static getPresetOptions(preset: 'testStrip' | 'equipment' | 'pool' | 'general'): CompressionOptions {
    switch (preset) {
      case 'testStrip':
        // Higher quality for color accuracy
        return {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        };
      
      case 'equipment':
        // Balance between detail and size
        return {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        };
      
      case 'pool':
        // Can be lower quality for general pool shots
        return {
          maxWidth: 1280,
          maxHeight: 720,
          quality: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        };
      
      case 'general':
      default:
        return this.DEFAULT_OPTIONS;
    }
  }
}

// Export convenience functions
export const compressImageForAI = ImageCompressor.compressForAI.bind(ImageCompressor);
export const compressMultipleImagesForAI = ImageCompressor.compressMultipleForAI.bind(ImageCompressor);
export const getCompressionPreset = ImageCompressor.getPresetOptions.bind(ImageCompressor);