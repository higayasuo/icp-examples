import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export const AesProcessingView = () => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.contentContainer}>
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={styles.indicator}
        />
        <Text style={styles.loadingText}>Preparing Encryption...</Text>
        <Text style={styles.hintText}>This may take a moment...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: -80,
    paddingBottom: 20,
  },
  indicator: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
