import { useState } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import {
  Text,
  ListItem,
  Separator,
  Button,
  Input,
  Select,
  Adapt,
  Sheet,
} from "tamagui";
import { router } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
import { useAuthStore } from "../../stores/auth-store";
import {
  ClubEventsQuery,
  CoursesQuery,
  CreateEventMutation,
} from "@/lib/graphql";
import { format, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import {
  STRIDERS_TEAL,
  STRAVA_ORANGE,
  getThemeColors,
} from "@/constants/theme";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = getThemeColors(isDark);
  const { user, club, signOut, isAdmin } = useAuthStore();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [eventDate, setEventDate] = useState("");

  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(ClubEventsQuery, {
    variables: { clubId: club?.id ?? "" },
    skip: !club?.id,
  });

  const { data: coursesData } = useQuery(CoursesQuery, {
    skip: !isAdmin,
  });

  const [createEvent, { loading: isCreating }] = useMutation(
    CreateEventMutation,
    {
      onCompleted: () => {
        Alert.alert("Success", "Event created!");
        setShowAddEvent(false);
        setSelectedCourseId("");
        setEventDate("");
        refetch();
      },
      onError: (err) => {
        Alert.alert("Error", err.message);
      },
    }
  );

  const todayStart = startOfDay(new Date());
  const events = data?.events ?? [];

  const todaysEvent = events.find(
    (e) => e.course && isSameDay(new Date(e.date), todayStart)
  );

  const upcomingEvents = events
    .filter(
      (e) => e.course && isAfter(startOfDay(new Date(e.date)), todayStart)
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const previousEvents = events
    .filter(
      (e) => e.course && isBefore(startOfDay(new Date(e.date)), todayStart)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleCreateEvent = () => {
    if (!selectedCourseId || !eventDate) {
      Alert.alert("Error", "Please select a course and enter a date");
      return;
    }
    createEvent({
      variables: {
        input: {
          courseId: selectedCourseId,
          date: eventDate,
          clubId: club?.id ?? "",
        },
      },
    });
  };

  const courses = coursesData?.courses ?? [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text fontSize="$4" color={theme.textSecondary}>
            Hey, {user?.name || "Athlete"} 👋
          </Text>
          <Text fontSize="$3" color={STRIDERS_TEAL} fontWeight="600">
            {club?.name || "No Club"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isAdmin && (
            <Pressable
              onPress={() => setShowAddEvent(true)}
              style={styles.addButton}
            >
              <Text fontSize="$5" color={STRIDERS_TEAL}>
                ➕
              </Text>
            </Pressable>
          )}
          <Pressable onPress={signOut}>
            <Text fontSize="$3" color={STRAVA_ORANGE}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Add Event Modal */}
      <Modal
        visible={showAddEvent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddEvent(false)}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View style={styles.modalHeader}>
            <Text fontSize="$6" fontWeight="bold" color={theme.text}>
              Add Event
            </Text>
            <Pressable onPress={() => setShowAddEvent(false)}>
              <Text fontSize="$5" color={STRAVA_ORANGE}>
                ✕
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text fontSize="$3" color={theme.textSecondary} mb="$2">
              Select Course
            </Text>
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disablePreventBodyScroll
            >
              <Select.Trigger width="100%" bg={theme.surface}>
                <Select.Value placeholder="Choose a course..." />
              </Select.Trigger>

              <Adapt when="sm" platform="touch">
                <Sheet
                  modal
                  dismissOnSnapToBottom
                  animationConfig={{
                    type: "spring",
                    damping: 20,
                    mass: 1.2,
                    stiffness: 250,
                  }}
                >
                  <Sheet.Frame>
                    <Sheet.ScrollView>
                      <Adapt.Contents />
                    </Sheet.ScrollView>
                  </Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Adapt>

              <Select.Content zIndex={200000}>
                <Select.Viewport>
                  <Select.Group>
                    <Select.Label>Courses</Select.Label>
                    {courses.map(
                      (
                        course: {
                          id: string;
                          name: string;
                          distanceKm: number;
                        },
                        i: number
                      ) => (
                        <Select.Item
                          key={course.id}
                          value={course.id}
                          index={i}
                        >
                          <Select.ItemText>
                            {course.name} ({course.distanceKm}km)
                          </Select.ItemText>
                        </Select.Item>
                      )
                    )}
                  </Select.Group>
                </Select.Viewport>
              </Select.Content>
            </Select>

            <Text fontSize="$3" color={theme.textSecondary} mt="$4" mb="$2">
              Event Date (YYYY-MM-DD)
            </Text>
            <Input
              placeholder="2026-01-15"
              value={eventDate}
              onChangeText={setEventDate}
              bg={theme.surface}
              color={theme.text}
              borderColor={theme.borderColor}
            />

            <Button
              bg={STRIDERS_TEAL}
              color="white"
              mt="$6"
              onPress={handleCreateEvent}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Event"}
            </Button>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={STRIDERS_TEAL} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Today's Event - Only shows if there's an event today */}
          {todaysEvent && (
            <View style={styles.section}>
              <Text
                fontSize="$6"
                fontWeight="bold"
                color={theme.text}
                style={styles.sectionTitle}
              >
                🏃 Today's Event
              </Text>
              <View
                style={[styles.todayCard, { backgroundColor: STRIDERS_TEAL }]}
              >
                <Text fontSize="$7" fontWeight="bold" color="white">
                  {todaysEvent.course?.name}
                </Text>
                <Text
                  fontSize="$4"
                  color="rgba(255,255,255,0.8)"
                  style={styles.todayDate}
                >
                  {format(todaysEvent.date, "MMM d, yyyy")}
                </Text>
                <Button
                  size="$4"
                  bg="white"
                  color={STRIDERS_TEAL}
                  style={styles.todayButton}
                  pressStyle={{ bg: "rgba(255,255,255,0.9)" }}
                  onPress={() => router.push(`/event/${todaysEvent.id}`)}
                >
                  View Event →
                </Button>
              </View>
            </View>
          )}

          {/* Upcoming Events */}
          <View style={styles.section}>
            <Text
              fontSize="$6"
              fontWeight="bold"
              color={theme.text}
              style={styles.sectionTitle}
            >
              📅 Upcoming Events
            </Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <View key={event.id}>
                    <Pressable
                      onPress={() => router.push(`/event/${event.id}`)}
                    >
                      <ListItem
                        title={event.course?.name}
                        subTitle={format(new Date(event.date), "MMM d, yyyy")}
                        pressTheme
                        iconAfter={
                          <Text fontSize="$5" color={STRIDERS_TEAL}>
                            →
                          </Text>
                        }
                      />
                    </Pressable>
                    {index < upcomingEvents.length - 1 && <Separator />}
                  </View>
                ))
              ) : (
                <Text
                  fontSize="$3"
                  color={theme.textSecondary}
                  style={{ padding: 16, textAlign: "center" }}
                >
                  No upcoming events
                </Text>
              )}
            </View>
          </View>

          {/* Previous Events */}
          {previousEvents && previousEvents.length > 0 && (
            <View style={styles.section}>
              <Text
                fontSize="$6"
                fontWeight="bold"
                color={theme.text}
                style={styles.sectionTitle}
              >
                📜 Previous Events
              </Text>
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                {previousEvents.map((event, index) => (
                  <View key={event.id}>
                    <ListItem
                      title={event.course?.name}
                      subTitle={format(new Date(event.date), "MMM d, yyyy")}
                      pressTheme
                      onPress={() => router.push(`/event/${event.id}`)}
                      iconAfter={
                        <Text fontSize="$5" color={theme.textSecondary}>
                          →
                        </Text>
                      }
                    />
                    {index < previousEvents.length - 1 && <Separator />}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  todayCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: STRIDERS_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  todayDate: {
    marginTop: 4,
  },
  todayButton: {
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  modalContent: {
    flex: 1,
  },
});
