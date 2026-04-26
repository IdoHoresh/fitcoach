const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Co-located *.test.tsx files under app/ are picked up by Expo Router's
// file-based scan and pull @testing-library/react-native (Node-only deps
// like `console`) into the runtime bundle. Block them at resolver level
// so they're invisible to Metro but still discoverable by Jest.
config.resolver.blockList = [/\.test\.(ts|tsx|js|jsx)$/, /\.spec\.(ts|tsx|js|jsx)$/]

module.exports = config
