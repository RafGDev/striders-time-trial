import {
  View,
  StyleSheet,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { Text, ListItem, Separator, Button } from "tamagui";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import {
  StravaActivitiesQuery,
  EventDetailsQuery,
  CreateTimeTrialMutation,
} from "@/lib/graphql";
import { format } from "date-fns";
import {
  STRIDERS_TEAL,
  STRAVA_ORANGE,
  getThemeColors,
} from "@/constants/theme";

interface StravaActivity {
  id: string;
  name: string;
  distance: number;
  movingTime: number;
  startDate: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
}

export default function StravaImportScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = getThemeColors(isDark);
  const client = useApolloClient();

  const {
    data: activitiesData,
    loading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = useQuery(StravaActivitiesQuery);

  const { data: eventData } = useQuery(EventDetailsQuery, {
    variables: { eventId: eventId! },
    skip: !eventId,
  });

  const [createTimeTrial, { loading: isSubmitting }] = useMutation(
    CreateTimeTrialMutation,
    {
      onCompleted: () => {
        // Refetch event and time trials data
        client.refetchQueries({
          include: ["EventDetails", "MyTimeTrials"],
        });

        Alert.alert("Success! 🎉", "Your time has been recorded.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Failed to submit time trial");
      },
    }
  );

  const activities = activitiesData?.stravaActivities ?? [];
  const courseDistanceKm = eventData?.event?.course?.distanceKm ?? null;
  const courseName = eventData?.event?.course?.name ?? "";
  const isLoading = activitiesLoading;
  const error = activitiesError?.message ?? null;

  const submitActivity = (activity: StravaActivity) => {
    createTimeTrial({
      variables: {
        input: {
          eventId: eventId!,
          timeMs: activity.movingTime * 1000,
        },
      },
    });
  };

  const handleSelectActivity = (activity: StravaActivity) => {
    if (!eventId) return;

    if (courseDistanceKm !== null) {
      const activityDistanceKm = activity.distance / 1000;
      const differenceKm = Math.abs(activityDistanceKm - courseDistanceKm);
      const differenceMeters = differenceKm * 1000;

      if (differenceMeters > 500) {
        const activityStr = formatDistance(activity.distance);
        const courseStr = courseDistanceKm.toFixed(2);
        const diffStr = (differenceMeters / 1000).toFixed(2);

        Alert.alert(
          "Distance Mismatch ⚠️",
          `This activity is ${activityStr} km, but ${courseName} is ${courseStr} km.\n\nThat's a ${diffStr} km difference. Are you sure you want to use this activity?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Use Anyway",
              style: "destructive",
              onPress: () => submitActivity(activity),
            },
          ]
        );
        return;
      }
    }

    submitActivity(activity);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text fontSize="$4" color={STRIDERS_TEAL}>
            ← Back
          </Text>
        </Pressable>
        <Text fontSize="$7" fontWeight="bold" color={theme.text}>
          ⚡ Import from Strava
        </Text>
        <Text fontSize="$3" color={theme.textSecondary} style={styles.subtitle}>
          Select an activity to import
        </Text>
        {courseName && courseDistanceKm !== null && (
          <View style={styles.courseInfo}>
            <Text fontSize="$3" color={STRIDERS_TEAL} fontWeight="600">
              📍 {courseName} ({courseDistanceKm.toFixed(2)} km)
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={STRAVA_ORANGE} />
          <Text
            fontSize="$4"
            color={theme.textSecondary}
            style={styles.loadingText}
          >
            Loading activities...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text fontSize="$6" style={styles.emptyEmoji}>
            😕
          </Text>
          <Text
            fontSize="$4"
            color={theme.textSecondary}
            style={styles.emptyText}
          >
            {error}
          </Text>
          <Button
            size="$4"
            bg={STRAVA_ORANGE}
            color="white"
            pressStyle={{ bg: "#E04400" }}
            style={styles.retryButton}
            onPress={() => refetchActivities()}
          >
            Try Again
          </Button>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <View key={activity.id}>
                  <ListItem
                    title={activity.name}
                    subTitle={format(
                      new Date(activity.startDate),
                      "MMM d, h:mm a"
                    )}
                    pressTheme
                    disabled={isSubmitting}
                    onPress={() => handleSelectActivity(activity)}
                    iconAfter={
                      <View style={styles.activityInfo}>
                        <Text
                          fontSize="$5"
                          fontWeight="bold"
                          color={STRAVA_ORANGE}
                        >
                          {formatTime(activity.movingTime)}
                        </Text>
                        <Text fontSize="$3" color={theme.textSecondary}>
                          {formatDistance(activity.distance)} km
                        </Text>
                      </View>
                    }
                  />
                  {index < activities.length - 1 && <Separator />}
                </View>
              ))
            ) : (
              <Text
                fontSize="$3"
                color={theme.textSecondary}
                style={styles.noActivities}
              >
                No recent run activities found
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {isSubmitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color={STRAVA_ORANGE} />
          <Text fontSize="$4" color="white" style={styles.submittingText}>
            Submitting...
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 4,
  },
  courseInfo: {
    marginTop: 12,
    backgroundColor: "rgba(0, 162, 144, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  activityInfo: {
    alignItems: "flex-end",
  },
  noActivities: {
    padding: 16,
    textAlign: "center",
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  submittingText: {
    marginTop: 12,
  },
});
