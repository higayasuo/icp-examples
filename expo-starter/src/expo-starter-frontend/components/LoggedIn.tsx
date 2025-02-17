import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Principal } from '@dfinity/principal';
import {
  baseTextStyles,
  containerStyles,
  subheaderStyles,
  headerStyles,
  buttonStyles,
  disabledButtonStyles,
  buttonTextStyles,
} from './styles';
import { IBECipher } from './IBECipher';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from '@/icp/expo-starter-backend.did';

interface LoggedInProps {
  onLogout: () => Promise<void>;
  backend: ActorSubclass<_SERVICE> | undefined;
  principal: Principal | undefined;
}

function LoggedIn({ onLogout, backend, principal }: LoggedInProps) {
  const [who, setWho] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const whoami = async () => {
    if (!backend) {
      throw new Error('backend is not ready');
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
      {who && <Text style={baseTextStyles}>{who}</Text>}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <IBECipher backend={backend} principal={principal} />
      <Pressable
        style={busy ? disabledButtonStyles : buttonStyles}
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
        <Text style={buttonTextStyles}>Log out</Text>
      </Pressable>
    </View>
  );
}

export default LoggedIn;
