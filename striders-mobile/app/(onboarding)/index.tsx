import { useState } from "react";
import {
  Alert,
  View,
  StyleSheet,
  useColorScheme,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Button, Input, Text, YStack, XStack, Separator } from "tamagui";
import { router } from "expo-router";
import { useMutation } from "@apollo/client";
import { useAuthStore } from "../../stores/auth-store";
import { JoinClubMutation } from "../../lib/graphql";
import {
  STRIDERS_TEAL,
  STRAVA_ORANGE,
  getThemeColors,
} from "@/constants/theme";

export default function JoinClubScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = getThemeColors(isDark);
  const { user, signOut, setClub } = useAuthStore();

  const [joinClub, { loading: isJoining }] = useMutation(JoinClubMutation, {
    onCompleted: async (data) => {
      if (data.joinClub.club) {
        const role = (data.joinClub.role as "member" | "admin") ?? "member";
        await setClub(data.joinClub.club, role);
      }
      Alert.alert("Welcome! 🎉", `You've joined ${data.joinClub.club?.name}!`, [
        {
          text: "Let's Go!",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
      setInviteCode("");
    },
    onError: (err) => {
      setError(err.message || "Failed to join club");
    },
  });

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleScanQR = () => {
    router.push("/(onboarding)/scan");
  };

  const handleJoinWithCode = () => {
    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter an invite code.");
      return;
    }

    setError(null);
    joinClub({ variables: { input: { inviteCode: code } } });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with user info */}
      <View style={styles.header}>
        <Text fontSize="$4" color={theme.textSecondary}>
          Hey, {user?.name || "Athlete"} 👋
        </Text>
        <Pressable onPress={handleSignOut}>
          <Text fontSize="$3" color={STRAVA_ORANGE}>
            Sign Out
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <YStack gap="$4" width="100%">
          <Text
            fontSize="$8"
            fontWeight="bold"
            style={styles.title}
            color={theme.text}
          >
            🏃 Join a Club
          </Text>

          <Text
            fontSize="$3"
            color={theme.textSecondary}
            style={styles.subtitle}
          >
            Enter your club's invite code to get started
          </Text>

          <Button
            size="$5"
            bg={STRIDERS_TEAL}
            color="white"
            pressStyle={{ bg: "#006B5E" }}
            hoverStyle={{ bg: "#008272" }}
            onPress={handleScanQR}
          >
            📷 Scan QR Code
          </Button>

          <XStack gap="$3" style={styles.separator}>
            <Separator />
            <Text color={theme.textSecondary}>or</Text>
            <Separator />
          </XStack>

          <YStack gap="$3">
            <Input
              size="$4"
              placeholder="Enter invite code..."
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              editable={!isJoining}
            />

            {error && (
              <Text fontSize="$3" color="#DC2626" style={styles.errorText}>
                {error}
              </Text>
            )}

            <Button
              size="$4"
              onPress={handleJoinWithCode}
              disabled={isJoining}
              opacity={isJoining ? 0.7 : 1}
            >
              {isJoining ? (
                <XStack gap="$2" style={{ alignItems: "center" }}>
                  <ActivityIndicator
                    size="small"
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text>Joining...</Text>
                </XStack>
              ) : (
                "Join with Code"
              )}
            </Button>
          </YStack>
        </YStack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  separator: {
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
  },
});
