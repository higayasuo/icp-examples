import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { buttonTextStyles } from './styles';

interface LogInProps {
  onLogin: () => Promise<void>;
}

/**
 * Component that handles the login functionality
 */
export const LogIn = ({ onLogin }: LogInProps) => {
  const [busy, setBusy] = React.useState(false);

  function handlePress() {
    setBusy(true);
    onLogin().finally(() => {
      setBusy(false);
    });
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.headerButton,
        busy && styles.disabled,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      disabled={busy}
      accessibilityState={{ busy }}
      onPress={handlePress}
    >
      <Text style={styles.headerButtonText}>Log in</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 15,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtonText: {
    ...buttonTextStyles,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
