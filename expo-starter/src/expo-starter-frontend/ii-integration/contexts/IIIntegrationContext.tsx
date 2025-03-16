import React, { createContext, useContext } from 'react';
import { useIIIntegration } from '../hooks/useIIIntegration';

type IIIntegrationContextType = ReturnType<typeof useIIIntegration>;

const IIIntegrationContext = createContext<
  IIIntegrationContextType | undefined
>(undefined);

export function useIIIntegrationContext() {
  const context = useContext(IIIntegrationContext);
  if (context === undefined) {
    throw new Error(
      'useIIIntegrationAuthContext must be used within an IIIntegrationAuthProvider',
    );
  }
  return context;
}

interface IIIntegrationProviderProps {
  children: React.ReactNode;
  value: IIIntegrationContextType;
}

export function IIIntegrationProvider({
  children,
  value,
}: IIIntegrationProviderProps) {
  return (
    <IIIntegrationContext.Provider value={value}>
      {children}
    </IIIntegrationContext.Provider>
  );
}
