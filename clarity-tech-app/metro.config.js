const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Replit-specific configuration
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs'];
config.resolver.assetExts = ['db', 'mp3', 'ttf', 'obj', 'png', 'jpg'];

module.exports = config;