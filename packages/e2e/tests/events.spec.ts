import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  graphql,
  getPrisma,
  closePrisma,
  cleanDatabase,
  generateTestToken,
} from "./helpers";

describe("Events", () => {
  const prisma = getPrisma();
  let testUserId: string;
  let testUserName: string;
  let testToken: string;
  let testClubId: string;
  let testCourseId: string;
  let testCourseName: string;
  let testEventId: string;
  let testTimeTrialId: string;

  beforeEach(async () => {
    await cleanDatabase();

    testUserName = `Runner ${Date.now()}`;
    const user = await prisma.user.create({
      data: { name: testUserName },
    });
    testUserId = user.id;
    testToken = generateTestToken(user.id, user.name);

    const club = await prisma.club.create({
      data: {
        name: `Test Club ${Date.now()}`,
        inviteCode: `CLUB${Date.now()}`,
        adminInviteCode: `ADMIN${Date.now()}`,
      },
    });
    testClubId = club.id;

    testCourseName = `Bay Run 5K ${Date.now()}`;
    const course = await prisma.course.create({
      data: { name: testCourseName, distanceKm: 5.0 },
    });
    testCourseId = course.id;

    const event = await prisma.event.create({
      data: {
        date: new Date("2024-06-15"),
        courseId: testCourseId,
        clubId: testClubId,
      },
    });
    testEventId = event.id;

    const timeTrial = await prisma.timeTrial.create({
      data: {
        timeMs: 1500000,
        userId: testUserId,
        eventId: testEventId,
      },
    });
    testTimeTrialId = timeTrial.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await closePrisma();
  });

  describe("Query: event", () => {
    it("should return an event by ID with course and club", async () => {
      const response = await graphql<{
        event: {
          id: string;
          date: string;
          course: { id: string; name: string; distanceKm: number };
          club: { id: string; name: string };
        };
      }>(
        `
          query GetEvent($id: String!) {
            event(id: $id) {
              id
              date
              course {
                id
                name
                distanceKm
              }
              club {
                id
                name
              }
            }
          }
        `,
        { id: testEventId },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.event.id).toBe(testEventId);
      expect(response.data?.event.course.id).toBe(testCourseId);
      expect(response.data?.event.course.name).toBe(testCourseName);
      expect(response.data?.event.course.distanceKm).toBe(5.0);
      expect(response.data?.event.club.id).toBe(testClubId);
    });

    it("should return an event with time trials", async () => {
      const response = await graphql<{
        event: {
          id: string;
          timeTrials: Array<{
            id: string;
            timeMs: number;
            user: { id: string; name: string };
          }>;
        };
      }>(
        `
          query GetEvent($id: String!) {
            event(id: $id) {
              id
              timeTrials {
                id
                timeMs
                user {
                  id
                  name
                }
              }
            }
          }
        `,
        { id: testEventId },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.event.timeTrials).toHaveLength(1);
      expect(response.data?.event.timeTrials[0].id).toBe(testTimeTrialId);
      expect(response.data?.event.timeTrials[0].timeMs).toBe(1500000);
      expect(response.data?.event.timeTrials[0].user.id).toBe(testUserId);
    });

    it("should return null for non-existent event", async () => {
      const response = await graphql<{ event: null }>(
        `
          query GetEvent($id: String!) {
            event(id: $id) {
              id
            }
          }
        `,
        { id: "non-existent-id" },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.event).toBeNull();
    });

    it("should fail without authentication", async () => {
      const response = await graphql(
        `
          query GetEvent($id: String!) {
            event(id: $id) {
              id
            }
          }
        `,
        { id: testEventId }
      );

      expect(response.errors).toBeDefined();
    });
  });

  describe("Query: latestEventByCourseName", () => {
    it("should return the latest event for a course", async () => {
      const response = await graphql<{
        latestEventByCourseName: {
          id: string;
          date: string;
          course: { name: string };
        };
      }>(
        `
          query LatestEvent($courseName: String!) {
            latestEventByCourseName(courseName: $courseName) {
              id
              date
              course {
                name
              }
            }
          }
        `,
        { courseName: testCourseName }
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.latestEventByCourseName.id).toBe(testEventId);
      expect(response.data?.latestEventByCourseName.course.name).toBe(
        testCourseName
      );
    });

    it("should return the most recent event when multiple exist", async () => {
      await prisma.event.create({
        data: {
          date: new Date("2024-01-01"),
          courseId: testCourseId,
          clubId: testClubId,
        },
      });

      const newerEvent = await prisma.event.create({
        data: {
          date: new Date("2024-12-01"),
          courseId: testCourseId,
          clubId: testClubId,
        },
      });

      const response = await graphql<{
        latestEventByCourseName: { id: string; date: string };
      }>(
        `
          query LatestEvent($courseName: String!) {
            latestEventByCourseName(courseName: $courseName) {
              id
              date
            }
          }
        `,
        { courseName: testCourseName }
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.latestEventByCourseName.id).toBe(newerEvent.id);
    });

    it("should include time trials with user info", async () => {
      const response = await graphql<{
        latestEventByCourseName: {
          timeTrials: Array<{
            id: string;
            timeMs: number;
            user: { id: string; name: string };
          }>;
        };
      }>(
        `
          query LatestEvent($courseName: String!) {
            latestEventByCourseName(courseName: $courseName) {
              timeTrials {
                id
                timeMs
                user {
                  id
                  name
                }
              }
            }
          }
        `,
        { courseName: testCourseName }
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.latestEventByCourseName.timeTrials).toHaveLength(1);
      expect(response.data?.latestEventByCourseName.timeTrials[0].id).toBe(
        testTimeTrialId
      );
    });

    it("should return null for non-existent course", async () => {
      const response = await graphql<{ latestEventByCourseName: null }>(
        `
          query LatestEvent($courseName: String!) {
            latestEventByCourseName(courseName: $courseName) {
              id
            }
          }
        `,
        { courseName: "Non-existent Course" }
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.latestEventByCourseName).toBeNull();
    });
  });

  describe("Query: events (by club)", () => {
    it("should return events for a club when authenticated", async () => {
      const response = await graphql<{
        events: Array<{
          id: string;
          date: string;
          course: { id: string; name: string };
          club: { id: string; name: string };
        }>;
      }>(
        `
          query Events($clubId: String!) {
            events(clubId: $clubId) {
              id
              date
              course {
                id
                name
              }
              club {
                id
                name
              }
            }
          }
        `,
        { clubId: testClubId },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.events).toHaveLength(1);
      expect(response.data?.events[0].id).toBe(testEventId);
      expect(response.data?.events[0].course.id).toBe(testCourseId);
      expect(response.data?.events[0].club.id).toBe(testClubId);
    });

    it("should return empty array for club with no events", async () => {
      const emptyClub = await prisma.club.create({
        data: {
          name: "Empty Club",
          inviteCode: `EMPTY${Date.now()}`,
          adminInviteCode: `EMPTYADMIN${Date.now()}`,
        },
      });

      const response = await graphql<{ events: unknown[] }>(
        `
          query Events($clubId: String!) {
            events(clubId: $clubId) {
              id
            }
          }
        `,
        { clubId: emptyClub.id },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.events).toEqual([]);
    });

    it("should fail without authentication", async () => {
      const response = await graphql(
        `
          query Events($clubId: String!) {
            events(clubId: $clubId) {
              id
            }
          }
        `,
        { clubId: testClubId }
      );

      expect(response.errors).toBeDefined();
    });
  });

  describe("ResolveField: myTimeTrial", () => {
    it("should return current user's time trial for the event", async () => {
      const response = await graphql<{
        event: {
          id: string;
          myTimeTrial: { id: string; timeMs: number };
        };
      }>(
        `
          query GetEvent($id: String!) {
            event(id: $id) {
              id
              myTimeTrial {
                id
                timeMs
              }
            }
          }
        `,
        { id: testEventId },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.event.myTimeTrial).not.toBeNull();
      expect(response.data?.event.myTimeTrial.id).toBe(testTimeTrialId);
      expect(response.data?.event.myTimeTrial.timeMs).toBe(1500000);
    });

    it("should return null when user has no time trial for the event", async () => {
      const otherUser = await prisma.user.create({
        data: { name: `Other User ${Date.now()}` },
      });
      const otherToken = generateTestToken(otherUser.id, otherUser.name);

      const response = await graphql<{
        event: {
          id: string;
          myTimeTrial: null;
        };
      }>(
        `
          query GetEvent($id: String!) {
            event(id: $id) {
              id
              myTimeTrial {
                id
                timeMs
              }
            }
          }
        `,
        { id: testEventId },
        otherToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.event.myTimeTrial).toBeNull();
    });
  });
});
