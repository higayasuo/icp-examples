import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  baseTextStyles,
  buttonStyles,
  disabledButtonStyles,
  buttonTextStyles,
} from './styles';
import { createBackend } from '@/backend';
import { useError } from '@/contexts/ErrorContext';
import { useIIIntegrationContext } from 'expo-ii-integration';
/**
 * Component that displays the whoami functionality
 */
export const WhoAmI = () => {
  const { identity } = useIIIntegrationContext();
  const [who, setWho] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { width } = useWindowDimensions();
  const { showError } = useError();

  useEffect(() => {
    setWho(undefined);
  }, [identity]);

  const whoami = async () => {
    const backend = createBackend(identity);

    if (!backend) {
      throw new Error('backend is not ready');
    }
    try {
      return await backend.whoami();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <View style={[styles.container, { maxWidth: Math.min(800, width - 32) }]}>
      <View style={styles.textContainer}>
        <Text style={baseTextStyles}>
          To see how a canister views you, click this button!
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable
          style={[busy ? disabledButtonStyles : buttonStyles, styles.button]}
          accessibilityRole="button"
          disabled={busy}
          accessibilityState={{ busy }}
          onPress={() => {
            setBusy(true);
            setError(undefined); // Clear previous error
            whoami()
              .then((who) => {
                if (who) {
                  setWho(who);
                }
              })
              .catch((error) => {
                setWho(undefined);
                setError(
                  'Error occurred while fetching identity: ' + error.message,
                );
              })
              .finally(() => {
                setBusy(false);
              });
          }}
        >
          <Text style={buttonTextStyles}>whoami</Text>
        </Pressable>
      </View>
      <View style={styles.resultContainer}>
        {who && <Text style={baseTextStyles}>{who}</Text>}
        {error && (
          <Text style={[styles.errorText, baseTextStyles]}>{error}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 24,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 4,
    minHeight: 24,
  },
  button: {
    width: 120,
  },
  errorText: {
    color: 'red',
  },
});
