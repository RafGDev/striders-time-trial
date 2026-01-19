import { initGraphQLTada } from "gql.tada";
import type { introspection } from "./graphql-env";

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    DateTime: string;
    Int: number;
    Float: number;
    String: string;
    Boolean: boolean;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";

// ============ Queries ============

export const MyClubsQuery = graphql(`
  query MyClubs {
    myClubs {
      role
      club {
        id
        name
      }
    }
  }
`);

export const ClubEventsQuery = graphql(`
  query ClubEvents($clubId: String!) {
    events(clubId: $clubId) {
      id
      date
      course {
        id
        name
        distanceKm
      }
    }
  }
`);

export const MyTimeTrialsQuery = graphql(`
  query MyTimeTrials($clubId: String!) {
    myTimeTrials(clubId: $clubId) {
      id
      timeMs
      createdAt
      event {
        id
        date
        course {
          id
          name
          distanceKm
        }
      }
    }
  }
`);

export const EventDetailsQuery = graphql(`
  query EventDetails($eventId: String!) {
    event(id: $eventId) {
      id
      date
      course {
        id
        name
        distanceKm
      }
      timeTrials {
        id
        timeMs
        user {
          id
          name
          avatarUrl
        }
      }
    }
  }
`);

export const StravaActivitiesQuery = graphql(`
  query StravaActivities($after: String, $before: String) {
    stravaActivities(after: $after, before: $before) {
      id
      name
      distance
      movingTime
      startDate
    }
  }
`);

// ============ Mutations ============

export const JoinClubMutation = graphql(`
  mutation JoinClub($input: JoinClubInput!) {
    joinClub(input: $input) {
      id
      role
      club {
        id
        name
      }
    }
  }
`);

export const CreateTimeTrialMutation = graphql(`
  mutation CreateTimeTrial($input: SubmitTimeTrialInput!) {
    submitTimeTrial(input: $input) {
      id
      timeMs
    }
  }
`);

export const CoursesQuery = graphql(`
  query Courses {
    courses {
      id
      name
      distanceKm
    }
  }
`);

export const CreateEventMutation = graphql(`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      date
      course {
        id
        name
      }
    }
  }
`);
