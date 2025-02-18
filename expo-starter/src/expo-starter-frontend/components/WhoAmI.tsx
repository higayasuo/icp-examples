import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { ActorSubclass, Identity, Actor } from '@dfinity/agent';
import { _SERVICE } from '@/icp/expo-starter-backend.did';
import {
  baseTextStyles,
  buttonStyles,
  disabledButtonStyles,
  buttonTextStyles,
} from './styles';

interface WhoAmIProps {
  backend: ActorSubclass<_SERVICE> | undefined;
}

/**
 * Component that displays the whoami functionality
 */
export const WhoAmI = ({ backend }: WhoAmIProps) => {
  const [who, setWho] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const agent = backend ? Actor.agentOf(backend) : undefined;
  const { width } = useWindowDimensions();

  useEffect(() => {
    setWho(undefined);
  }, [agent]);

  const whoami = async () => {
    if (!backend) {
      throw new Error('backend is not ready');
    }
    return backend.whoami();
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
