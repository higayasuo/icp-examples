import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LogIn } from '@/components/LogIn';
import { LogOut } from '@/components/LogOut';
import Colors from '@/constants/Colors';
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
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { identity, login, logout } = useAuthContext();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerRight: () =>
          identity ? <LogOut onLogout={logout} /> : <LogIn onLogin={login} />,
      }}
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
