import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { graphql, getPrisma, closePrisma, cleanDatabase } from "./helpers";

describe("Events", () => {
  const prisma = getPrisma();
  let testUserId: string;
  let testClubId: string;
  let testCourseId: string;
  let testCourseName: string;
  let testEventId: string;
  let testTimeTrialId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create test user
    const user = await prisma.user.create({
      data: { name: `Runner ${Date.now()}` },
    });
    testUserId = user.id;

    // Create test club
    const club = await prisma.club.create({
      data: {
        name: `Test Club ${Date.now()}`,
        inviteCode: `CLUB${Date.now()}`,
      },
    });
    testClubId = club.id;

    // Create test course
    testCourseName = `Bay Run 5K ${Date.now()}`;
    const course = await prisma.course.create({
      data: { name: testCourseName, distanceKm: 5.0 },
    });
    testCourseId = course.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        date: new Date("2024-06-15"),
        courseId: testCourseId,
        clubId: testClubId,
      },
    });
    testEventId = event.id;

    // Create test time trial
    const timeTrial = await prisma.timeTrial.create({
      data: {
        timeMs: 1500000, // 25 minutes
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
        { id: testEventId }
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
        { id: testEventId }
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
        { id: "non-existent-id" }
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.event).toBeNull();
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
      // Create an older event
      await prisma.event.create({
        data: {
          date: new Date("2024-01-01"),
          courseId: testCourseId,
          clubId: testClubId,
        },
      });

      // Create a newer event
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
});
