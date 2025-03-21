import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { buttonTextStyles } from './styles';

interface LogOutProps {
  onLogout: () => Promise<void>;
}

/**
 * Component that handles the logout functionality
 */
export const LogOut = ({ onLogout }: LogOutProps) => {
  const [busy, setBusy] = React.useState(false);

  return (
    <Pressable
      style={[styles.headerButton, busy && styles.disabled]}
      accessibilityRole="button"
      disabled={busy}
      accessibilityState={{ busy }}
      onPress={async () => {
        setBusy(true);
        try {
          await onLogout();
        } finally {
          setBusy(false);
        }
      }}
    >
      <Text style={styles.headerButtonText}>Log out</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 15,
  },
  headerButtonText: {
    ...buttonTextStyles,
    color: '#007AFF',
  },
  disabled: {
    opacity: 0.5,
  },
});
