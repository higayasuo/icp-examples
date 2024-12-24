import Toast from 'react-native-root-toast';
import {
  ActorProvider,
  InterceptorErrorData,
  InterceptorRequestData,
  InterceptorResponseData,
  createActorContext,
  createUseActorHook,
  isIdentityExpiredError,
} from 'ic-use-actor';
import {
  canisterId,
  idlFactory,
} from '../../declarations/expo-starter-backend';

import { ReactNode } from 'react';
import { _SERVICE } from '../../declarations/expo-starter-backend/expo-starter-backend.did';
import { useInternetIdentity } from 'ic-use-internet-identity';

const actorContext = createActorContext<_SERVICE>();
export const useBackend = createUseActorHook<_SERVICE>(actorContext);

export default function Actors({ children }: { children: ReactNode }) {
  const { identity, clear } = useInternetIdentity();

  const handleRequest = (data: InterceptorRequestData) => {
    console.log('onRequest', data.args, data.methodName);
    return data.args;
  };

  const handleResponse = (data: InterceptorResponseData) => {
    console.log('onResponse', data.args, data.methodName, data.response);
    return data.response;
  };

  const handleRequestError = (data: InterceptorErrorData) => {
    console.log('onRequestError', data.args, data.methodName, data.error);
    Toast.show('Request error', {
      duration: Toast.durations.LONG,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
    });
    // Toast.error("Request error" as string, {
    //   position: "bottom-right",
    // });
    return data.error;
  };

  const handleResponseError = (data: InterceptorErrorData) => {
    console.log('onResponseError', data.args, data.methodName, data.error);
    if (isIdentityExpiredError(data.error)) {
      Toast.show('Login expired.', {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
      });
      // toast.error("Login expired.", {
      //   id: "login-expired",
      //   position: "bottom-right",
      // });
      setTimeout(() => {
        clear(); // Clears the identity from the state and local storage. Effectively "logs the user out".
        window.location.reload(); // Reloads the page to reset the UI.
      }, 1000);
      return;
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      Toast.show(data.message, {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
      });
      // toast.error(data.message, {
      //   position: "bottom-right",
      // });
    }
  };

  return (
    <ActorProvider<_SERVICE>
      canisterId={canisterId}
      context={actorContext}
      identity={identity}
      idlFactory={idlFactory}
      onRequest={handleRequest}
      onResponse={handleResponse}
      onRequestError={handleRequestError}
      onResponseError={handleResponseError}
    >
      {children}
    </ActorProvider>
  );
}
