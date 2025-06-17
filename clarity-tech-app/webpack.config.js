const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@react-native-community/netinfo']
    }
  }, argv);

  // Customize the config for Replit
  config.devServer = {
    ...config.devServer,
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all',
    historyApiFallback: true,
    compress: true,
    hot: true,
    liveReload: true,
  };

  return config;
};