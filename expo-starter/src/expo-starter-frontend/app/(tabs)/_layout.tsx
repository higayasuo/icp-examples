import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Href, Redirect, Tabs, usePathname } from 'expo-router';
import { LogIn } from '@/components/LogIn';
import { LogOut } from '@/components/LogOut';
import { View, ActivityIndicator } from 'react-native';
import { useIIIntegrationContext } from 'expo-ii-integration';

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
  const { identity, login, logout, pathWhenLogin, clearPathWhenLogin } =
    useIIIntegrationContext();
  const pathname = usePathname();
  // const path = pathWhenLogin ?? pathname;

  // console.log('pathname', pathname);
  // console.log('pathWhenLogin', pathWhenLogin);
  // console.log('path', path);

  if (identity && pathWhenLogin) {
    clearPathWhenLogin();

    if (pathWhenLogin !== pathname) {
      console.log('redirecting to', pathWhenLogin);
      // Show loading indicator while redirecting
      return (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#007AFF" />
          <Redirect href={pathWhenLogin as Href} />
        </View>
      );
    }
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerRight: () =>
          identity ? <LogOut onLogout={logout} /> : <LogIn onLogin={login} />,
        headerStyle: {
          height: 110,
        },
      }}
      //initialRouteName={routeName}
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
