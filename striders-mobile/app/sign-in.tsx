import { useState } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Pressable,
  Alert,
} from "react-native";
import { Text } from "tamagui";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { print } from "graphql";
import { useAuthStore } from "../stores/auth-store";
import { MyClubsQuery } from "../lib/graphql";
import { STRAVA_ORANGE, getThemeColors } from "@/constants/theme";

WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || "";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "stridersmobile",
  path: "oauth",
});

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = getThemeColors(isDark);
  const [isLoading, setIsLoading] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);

  const handleStravaSignIn = async () => {
    setIsLoading(true);

    try {
      const authUrl = new URL("https://www.strava.com/oauth/mobile/authorize");
      authUrl.searchParams.set("client_id", STRAVA_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "read,activity:read");

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        redirectUri
      );

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          Alert.alert("Authorization Failed", error);
          return;
        }

        if (!code) {
          Alert.alert("Error", "No authorization code received");
          return;
        }

        const tokenResponse = await fetch(`${API_URL}/auth/strava/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error("Token exchange failed:", errorData);
          Alert.alert("Error", "Failed to complete sign in");
          return;
        }

        const data = await tokenResponse.json();

        let userClub = null;
        let userClubRole: "member" | "admin" | null = null;
        try {
          // Direct fetch since Apollo client doesn't have the token yet
          const clubsResponse = await fetch(`${API_URL}/graphql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({
              query: print(MyClubsQuery),
            }),
          });
          const clubsResult = await clubsResponse.json();

          if (clubsResult.data?.myClubs?.length > 0) {
            userClub = clubsResult.data.myClubs[0].club;
            userClubRole = clubsResult.data.myClubs[0].role ?? "member";
          }
        } catch (clubError) {
          console.error("Failed to fetch clubs:", clubError);
        }

        await signIn(
          data.token,
          data.refreshToken,
          {
            id: data.user.id,
            name: data.user.name,
            avatarUrl: data.user.avatarUrl,
          },
          userClub,
          userClubRole
        );
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Logo/Brand */}
        <View style={styles.brandContainer}>
          <Text fontSize="$10" style={styles.emoji}>
            🏃
          </Text>
          <Text
            fontSize="$9"
            fontWeight="bold"
            color={theme.text}
            style={styles.title}
          >
            Striders
          </Text>
          <Text
            fontSize="$5"
            color={theme.textSecondary}
            style={styles.subtitle}
          >
            Time Trial
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.stravaButton,
            pressed && styles.stravaButtonPressed,
            isLoading && styles.stravaButtonDisabled,
          ]}
          onPress={handleStravaSignIn}
          disabled={isLoading}
        >
          <View style={styles.stravaButtonContent}>
            <Text style={styles.stravaLogo}>⚡</Text>
            <Text style={styles.stravaButtonText}>
              {isLoading ? "Connecting..." : "Connect with Strava"}
            </Text>
          </View>
        </Pressable>

        {/* Footer */}
        <Text fontSize="$2" color={theme.textSecondary} style={styles.footer}>
          Sign in to track your time trials
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  emoji: {
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
  },
  stravaButton: {
    width: "100%",
    backgroundColor: STRAVA_ORANGE,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: STRAVA_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stravaButtonPressed: {
    backgroundColor: "#E34402",
    transform: [{ scale: 0.98 }],
  },
  stravaButtonDisabled: {
    opacity: 0.7,
  },
  stravaButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stravaLogo: {
    fontSize: 20,
  },
  stravaButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    marginTop: 32,
    textAlign: "center",
  },
});
