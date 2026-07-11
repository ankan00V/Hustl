const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro look for modules in the workspace node_modules first, then project node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Make sure Metro resolves symlinks correctly
config.resolver.unstable_enableSymlinks = true;

// 5. Preserving Expo's resolver and adding react-native-maps mock
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/'))) {
    return {
      filePath: path.resolve(projectRoot, 'src/mocks/react-native-maps.js'),
      type: 'sourceFile',
    };
  }
  
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
