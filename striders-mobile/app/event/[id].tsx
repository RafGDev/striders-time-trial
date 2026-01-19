import {
  View,
  StyleSheet,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Text, YStack, ListItem, Separator, Button } from "tamagui";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@apollo/client";
import { useAuthStore } from "../../stores/auth-store";
import { EventDetailsQuery } from "@/lib/graphql";
import { format } from "date-fns";
import {
  STRIDERS_TEAL,
  STRAVA_ORANGE,
  getThemeColors,
} from "@/constants/theme";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = getThemeColors(isDark);
  const { user } = useAuthStore();

  const { data, loading: isLoading } = useQuery(EventDetailsQuery, {
    variables: { eventId: id! },
    pollInterval: 10000,
    skip: !id,
  });

  const timeTrials = data?.event?.timeTrials ?? [];
  const myTimeTrial = timeTrials.find((trial) => trial.user?.id === user?.id);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={STRIDERS_TEAL} />
        </View>
      ) : data?.event ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.eventCard, { backgroundColor: STRIDERS_TEAL }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text
                fontSize="$4"
                fontWeight="600"
                color="rgba(255,255,255,0.9)"
              >
                ← Back
              </Text>
            </Pressable>
            <Text fontSize="$8" fontWeight="bold" color="white">
              {data?.event?.course?.name}
            </Text>
            <Text
              fontSize="$4"
              color="rgba(255,255,255,0.8)"
              style={styles.eventDate}
            >
              {format(
                new Date(data?.event?.date ?? new Date()),
                "EEEE, MMMM d, yyyy"
              )}
            </Text>
            <Text
              fontSize="$3"
              color="rgba(255,255,255,0.7)"
              style={styles.eventDistance}
            >
              {data?.event?.course?.distanceKm} km
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              fontSize="$6"
              fontWeight="bold"
              color={theme.text}
              style={styles.sectionTitle}
            >
              🏅 Your Time
            </Text>
            <View
              style={[styles.myResultCard, { backgroundColor: theme.surface }]}
            >
              {myTimeTrial ? (
                <Text fontSize="$9" fontWeight="bold" color={STRIDERS_TEAL}>
                  {formatTime(myTimeTrial.timeMs)}
                </Text>
              ) : (
                <YStack gap="$3" style={{ alignItems: "center" }}>
                  <Text
                    fontSize="$4"
                    color={theme.textSecondary}
                    style={{ textAlign: "center" }}
                  >
                    No time recorded yet
                  </Text>
                  <Button
                    size="$4"
                    bg={STRAVA_ORANGE}
                    color="white"
                    pressStyle={{ bg: "#E04400" }}
                    icon={
                      <Text fontSize="$4" color="white">
                        ⚡
                      </Text>
                    }
                    onPress={() => {
                      router.push({
                        pathname: "/strava-import",
                        params: { eventId: id },
                      });
                    }}
                  >
                    Import from Strava
                  </Button>
                </YStack>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text
              fontSize="$6"
              fontWeight="bold"
              color={theme.text}
              style={styles.sectionTitle}
            >
              🏆 Leaderboard
            </Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              {data?.event?.timeTrials && data?.event?.timeTrials.length > 0 ? (
                [...data.event.timeTrials]
                  .sort((a, b) => a.timeMs - b.timeMs)
                  .map((trial, index) => (
                    <View key={trial.id}>
                      <ListItem
                        title={trial.user?.name}
                        iconAfter={
                          <View style={styles.trialInfo}>
                            <Text
                              fontSize="$5"
                              fontWeight="bold"
                              color={STRIDERS_TEAL}
                            >
                              {formatTime(trial.timeMs)}
                            </Text>
                          </View>
                        }
                        icon={
                          <View style={styles.positionBadge}>
                            <Text
                              fontSize="$4"
                              fontWeight="bold"
                              color={
                                index < 3 ? "#FFD700" : theme.textSecondary
                              }
                            >
                              #{index + 1}
                            </Text>
                          </View>
                        }
                      />
                      {index < data.event!.timeTrials!.length - 1 && (
                        <Separator />
                      )}
                    </View>
                  ))
              ) : (
                <Text
                  fontSize="$3"
                  color={theme.textSecondary}
                  style={{ padding: 16, textAlign: "center" }}
                >
                  No results yet
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text fontSize="$5" color={theme.textSecondary}>
            Event not found
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  eventCard: {
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  eventDate: {
    marginTop: 8,
  },
  eventDistance: {
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  myResultCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  trialInfo: {
    alignItems: "flex-end",
  },
  positionBadge: {
    width: 36,
    alignItems: "center",
  },
});
