const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for Boomer Buddy Native
 * Optimized for production APK builds
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    // Enable Hermes for better performance
    hermesCommand: './node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc',
    minifierPath: require.resolve('metro-minify-terser'),
    minifierConfig: {
      // Terser options for production optimization
      ecma: 8,
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
      compress: {
        drop_console: true, // Remove console.log in production
      },
    },
  },
  resolver: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@services': './src/services',
      '@utils': './src/utils',
    },
  },
  serializer: {
    // Optimize bundle size
    createModuleIdFactory: () => (path) => {
      // Create shorter module IDs for production
      return require('crypto').createHash('md5').update(path).digest('hex').substr(0, 8);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);