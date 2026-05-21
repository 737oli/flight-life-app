import Colors from '@/constants/Colors';
import { Tabs } from 'expo-router';
import { CalendarDays, CheckSquare, Home, Settings } from "lucide-react-native";
import React from 'react';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: true,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="decisions"
        options={{
          title: "Decisions",
          tabBarIcon: ({ color }) => <CheckSquare color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
