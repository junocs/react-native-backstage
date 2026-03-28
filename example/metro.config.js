const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Watch the library source files
config.watchFolders = [workspaceRoot]

// Only resolve node_modules from the example dir first, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Block react/react-native from resolving from the workspace root to avoid duplicates
config.resolver.blockList = [
  new RegExp(path.resolve(workspaceRoot, 'node_modules', 'react', '.*').replace(/\//g, '\\/')),
  new RegExp(
    path.resolve(workspaceRoot, 'node_modules', 'react-native', '.*').replace(/\//g, '\\/'),
  ),
]

module.exports = config
