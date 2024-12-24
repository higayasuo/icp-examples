const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure for web
config.resolver.sourceExts = [...config.resolver.sourceExts, 'bundle'];

module.exports = config;
