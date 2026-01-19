import {
  View,
  StyleSheet,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Text, ListItem, Separator } from "tamagui";
import { useQuery } from "@apollo/client";
import { useAuthStore } from "../../stores/auth-store";
import { MyTimeTrialsQuery } from "@/lib/graphql";
import { format } from "date-fns";
import { LineChart } from "react-native-chart-kit";
import { STRIDERS_TEAL, getThemeColors } from "@/constants/theme";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = getThemeColors(isDark);
  const { club } = useAuthStore();
  const { data, loading: isLoading } = useQuery(MyTimeTrialsQuery, {
    variables: { clubId: club?.id ?? "" },
    skip: !club?.id,
  });

  const timeTrials = data?.myTimeTrials ?? [];
  const results = timeTrials
    .filter((r) => r.event?.course)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.event!.date).getTime() - new Date(a.event!.date).getTime()
    );

  const sortedResults = [...results].reverse();

  const chartData = {
    labels: sortedResults.map((r) => format(new Date(r.event!.date), "MMM d")),
    datasets: [
      {
        data:
          sortedResults.length > 0
            ? sortedResults.map((r) => r.timeMs / 1000)
            : [0],
        strokeWidth: 3,
      },
    ],
  };

  const formatYLabel = (seconds: string) => {
    const totalSeconds = Math.round(parseFloat(seconds));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text fontSize="$8" fontWeight="bold" color={theme.text}>
          📈 Progress
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={STRIDERS_TEAL} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {sortedResults.length > 1 && (
            <View style={styles.section}>
              <Text
                fontSize="$6"
                fontWeight="bold"
                color={theme.text}
                style={styles.sectionTitle}
              >
                📊 Time Progress
              </Text>
              <View
                style={[styles.chartCard, { backgroundColor: theme.surface }]}
              >
                <LineChart
                  data={chartData}
                  width={Dimensions.get("window").width - 64}
                  height={200}
                  formatYLabel={formatYLabel}
                  chartConfig={{
                    backgroundColor: theme.surface,
                    backgroundGradientFrom: theme.surface,
                    backgroundGradientTo: theme.surface,
                    decimalPlaces: 0,
                    color: () => STRIDERS_TEAL,
                    labelColor: () => theme.textSecondary,
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: STRIDERS_TEAL,
                    },
                    propsForBackgroundLines: {
                      stroke: isDark ? "#333333" : "#eeeeee",
                    },
                  }}
                  bezier
                  style={{
                    borderRadius: 12,
                  }}
                />
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text
              fontSize="$6"
              fontWeight="bold"
              color={theme.text}
              style={styles.sectionTitle}
            >
              🏆 Your Results
            </Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              {results && results.length > 0 ? (
                results.map((result, index: number) => (
                  <View key={result.id}>
                    <ListItem
                      title={result.event?.course?.name}
                      subTitle={format(
                        new Date(result.event!.date),
                        "MMM d, yyyy"
                      )}
                      iconAfter={
                        <View style={styles.resultInfo}>
                          <Text
                            fontSize="$5"
                            fontWeight="bold"
                            color={STRIDERS_TEAL}
                          >
                            {formatTime(result.timeMs)}
                          </Text>
                        </View>
                      }
                    />
                    {index < results.length - 1 && <Separator />}
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
  chartCard: {
    borderRadius: 12,
    padding: 16,
    height: 250,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  resultInfo: {
    alignItems: "flex-end",
  },
});
