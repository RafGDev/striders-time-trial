import { useState } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Button } from "tamagui";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation } from "@apollo/client";
import { useAuthStore } from "../../stores/auth-store";
import { JoinClubMutation } from "../../lib/graphql";
import { STRIDERS_TEAL, getThemeColors } from "@/constants/theme";

export default function ScanQRScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = getThemeColors(isDark);
  const { setClub } = useAuthStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const [joinClub, { loading: isJoining }] = useMutation(JoinClubMutation, {
    onCompleted: async (result) => {
      if (result.joinClub.club) {
        const role = (result.joinClub.role as "member" | "admin") ?? "member";
        await setClub(result.joinClub.club, role);
      }

      Alert.alert(
        "Welcome! 🎉",
        `You've joined ${result.joinClub.club?.name}!`,
        [
          {
            text: "Let's Go!",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    },
    onError: (err) => {
      Alert.alert("Error", err.message || "Failed to join club", [
        { text: "Try Again", onPress: () => setScanned(false) },
        { text: "Cancel", onPress: () => router.back() },
      ]);
    },
  });

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned || isJoining) return;
    setScanned(true);

    let inviteCode = data;

    try {
      const url = new URL(data);
      const codeParam = url.searchParams.get("code");
      if (codeParam) {
        inviteCode = codeParam;
      }
    } catch {
      inviteCode = data.trim().toUpperCase();
    }

    if (!inviteCode) {
      Alert.alert(
        "Invalid QR Code",
        "This QR code doesn't contain a valid invite code.",
        [
          { text: "Try Again", onPress: () => setScanned(false) },
          { text: "Cancel", onPress: () => router.back() },
        ]
      );
      return;
    }

    joinClub({
      variables: { input: { inviteCode: inviteCode.toUpperCase() } },
    });
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={STRIDERS_TEAL} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Text fontSize="$6" style={styles.permissionEmoji}>
            📷
          </Text>
          <Text
            fontSize="$6"
            fontWeight="bold"
            color={theme.text}
            style={styles.permissionTitle}
          >
            Camera Access Required
          </Text>
          <Text
            fontSize="$4"
            color={theme.textSecondary}
            style={styles.permissionText}
          >
            We need camera access to scan QR codes for joining clubs
          </Text>
          <Button
            size="$5"
            bg={STRIDERS_TEAL}
            color="white"
            pressStyle={{ bg: "#006B5E" }}
            onPress={requestPermission}
            style={styles.permissionButton}
          >
            Grant Permission
          </Button>
          <Pressable onPress={() => router.back()} style={styles.cancelButton}>
            <Text fontSize="$4" color={theme.textSecondary}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text fontSize="$5" color="white" fontWeight="600">
              ← Back
            </Text>
          </Pressable>
        </View>

        <View style={styles.scannerFrameContainer}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.instructions}>
          {isJoining ? (
            <>
              <ActivityIndicator size="large" color="white" />
              <Text
                fontSize="$5"
                color="white"
                fontWeight="600"
                style={styles.instructionText}
              >
                Joining club...
              </Text>
            </>
          ) : (
            <>
              <Text
                fontSize="$5"
                color="white"
                fontWeight="600"
                style={styles.instructionText}
              >
                Point at QR Code
              </Text>
              <Text
                fontSize="$3"
                color="rgba(255,255,255,0.7)"
                style={styles.instructionSubtext}
              >
                Align the club's QR code within the frame
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
  },
  scannerFrameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: 280,
    height: 280,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: STRIDERS_TEAL,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  instructions: {
    paddingBottom: 100,
    alignItems: "center",
  },
  instructionText: {
    marginTop: 16,
    textAlign: "center",
  },
  instructionSubtext: {
    marginTop: 4,
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  permissionEmoji: {
    marginBottom: 16,
  },
  permissionTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    marginBottom: 16,
  },
  cancelButton: {
    padding: 12,
  },
});
