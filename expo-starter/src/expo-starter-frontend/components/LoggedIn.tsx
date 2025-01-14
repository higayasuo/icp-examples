import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  baseTextStyles,
  containerStyles,
  subheaderStyles,
  headerStyles,
  buttonStyles,
  disabledButtonStyles,
  buttonTextStyles,
} from './styles';
import { useAuth } from '../hooks/useAuth';
import { useBackend } from '@/hooks/useBackend';

interface LoggedInProps {
  logout: () => void;
}

function LoggedIn({ logout }: LoggedInProps) {
  const { identity } = useAuth();
  const { backend } = useBackend();
  const [who, setWho] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const whoami = async () => {
    if (!backend) {
      console.log('backend is not ready');
      return;
    }

    return backend.whoami();
  };

  return (
    <View style={containerStyles}>
      <Text style={headerStyles}>Hi everyone!</Text>
      <Text style={subheaderStyles}>You are authenticated!</Text>
      <Text style={baseTextStyles}>
        To see how a canister views you, click this button!
      </Text>
      <Pressable
        style={busy ? disabledButtonStyles : buttonStyles}
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
      {who && <Text style={baseTextStyles}>{who}</Text>}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Pressable
        style={busy ? disabledButtonStyles : buttonStyles}
        accessibilityRole="button"
        disabled={busy}
        accessibilityState={{ busy }}
        onPress={() => {
          logout();
        }}
      >
        <Text style={buttonTextStyles}>Log out</Text>
      </Pressable>
    </View>
  );
}

export default LoggedIn;
