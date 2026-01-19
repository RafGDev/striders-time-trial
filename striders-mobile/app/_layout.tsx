import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { ApolloProvider } from "@apollo/client";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import "react-native-reanimated";
import { TamaguiProvider } from "tamagui";

import { STRIDERS_TEAL } from "@/constants/theme";
import { config } from "../tamagui.config";
import { useAuthStore } from "../stores/auth-store";
import { apolloClient } from "@/lib/apollo";

export const unstable_settings = {
  initialRouteName: "sign-in",
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, club, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0];
    const isOnSignIn = currentRoute === "sign-in";
    const isOnOnboarding = currentRoute === "(onboarding)";
    const isOnTabs = currentRoute === "(tabs)";
    const isOnEvent = currentRoute === "event";
    const isOnStravaImport = currentRoute === "strava-import";

    if (!isAuthenticated) {
      if (!isOnSignIn) {
        router.replace("/sign-in");
      }
    } else {
      if (!club) {
        if (!isOnOnboarding) {
          router.replace("/(onboarding)");
        }
      } else {
        if (!isOnTabs && !isOnEvent && !isOnStravaImport) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [isAuthenticated, isLoading, club, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={STRIDERS_TEAL} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ApolloProvider client={apolloClient}>
      <TamaguiProvider config={config} defaultTheme={colorScheme ?? "light"}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AuthGate>
            <Stack>
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen
                name="(onboarding)"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="event/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="strava-import"
                options={{ headerShown: false, presentation: "modal" }}
              />
            </Stack>
          </AuthGate>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TamaguiProvider>
    </ApolloProvider>
  );
}
