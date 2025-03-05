import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';

interface ErrorDisplayProps {
  message: string;
  onClose: () => void;
  visible: boolean;
}

export const ErrorDisplay = ({
  message,
  onClose,
  visible,
}: ErrorDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  return (
    <>
      <Pressable style={styles.overlay} />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.messageContainer}>
            <FontAwesome
              name="exclamation-circle"
              size={20}
              color="white"
              style={styles.icon}
            />
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.message}>{message}</Text>
            </ScrollView>
          </View>
          <View style={styles.buttonsContainer}>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <FontAwesome name="times" size={20} color="white" />
            </Pressable>
            <Pressable
              onPress={handleCopy}
              style={styles.copyButton}
              hitSlop={8}
            >
              <FontAwesome
                name={copied ? 'check' : 'copy'}
                size={18}
                color="white"
              />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
  },
  container: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '100%',
  },
  messageContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  scrollView: {
    flex: 1,
    maxHeight: 200,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    padding: 4,
  },
  copyButton: {
    padding: 4,
  },
});
