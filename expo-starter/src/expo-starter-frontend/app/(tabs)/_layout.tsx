import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, usePathname } from 'expo-router';
import { LogIn } from '@/components/LogIn';
import { LogOut } from '@/components/LogOut';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { identity, login, logout, lastPath } = useAuthContext();
  const pathname = usePathname();
  const path = lastPath ?? pathname;

  const routeName = path === '/' ? 'index' : path.slice(1);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerRight: () =>
          identity ? <LogOut onLogout={logout} /> : <LogIn onLogin={login} />,
      }}
      initialRouteName={routeName}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Identity',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Encryption',
          tabBarIcon: ({ color }) => <TabBarIcon name="lock" color={color} />,
        }}
      />
    </Tabs>
  );
}
