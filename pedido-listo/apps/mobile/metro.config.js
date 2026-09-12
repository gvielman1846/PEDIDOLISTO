const { getDefaultConfig } = require('expo/metro-config');

// SDK 57 detecta el monorepo npm workspaces solo; no hay que forzar watchFolders.
module.exports = getDefaultConfig(__dirname);
