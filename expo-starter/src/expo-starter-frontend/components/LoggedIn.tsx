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
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { useBackend } from '@/hooks/useBackend';

interface LoggedInProps {
  logout: () => void;
}

function LoggedIn({ logout }: LoggedInProps) {
  const { identity } = useAuth();
  const { backend } = useBackend();
  const [who, setWho] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);

  const whoami = async () => {
    // if (!identity) return;

    // const agent = new HttpAgent({
    //   identity,
    //   host: 'https://icp-api.io',
    //   fetchOptions: {
    //     reactNative: {
    //       __nativeResponseType: 'base64',
    //     },
    //   },
    //   verifyQuerySignatures: true,
    //   callOptions: {
    //     reactNative: {
    //       textStreaming: true,
    //     },
    //   },
    // });

    // // @ts-ignore - IDL type issues are known in the dfinity ecosystem
    // const idlFactory = ({ IDL }) => {
    //   return IDL.Service({ whoami: IDL.Func([], [IDL.Principal], ['query']) });
    // };

    // const actor = Actor.createActor(idlFactory, {
    //   agent,
    //   canisterId: 'ivcos-eqaaa-aaaab-qablq-cai',
    // });

    // const response = await actor.whoami();
    if (!backend) return;

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
          whoami().then((who) => {
            if (who) {
              setWho(who);
            }
            setBusy(false);
          });
        }}
      >
        <Text style={buttonTextStyles}>whoami</Text>
      </Pressable>
      {who && <Text style={baseTextStyles}>who: {who}</Text>}
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
