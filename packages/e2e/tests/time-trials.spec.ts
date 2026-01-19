import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  graphql,
  getPrisma,
  closePrisma,
  cleanDatabase,
  generateTestToken,
} from "./helpers";

describe("Time Trials", () => {
  const prisma = getPrisma();
  let testUserId: string;
  let testToken: string;
  let testClubId: string;
  let testCourseId: string;
  let testEventId: string;
  let testEvent2Id: string;

  beforeEach(async () => {
    await cleanDatabase();

    const user = await prisma.user.create({
      data: { name: `Runner ${Date.now()}` },
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

    const course = await prisma.course.create({
      data: { name: `Bay Run 5K ${Date.now()}`, distanceKm: 5.0 },
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

    const event2 = await prisma.event.create({
      data: {
        date: new Date("2024-06-22"),
        courseId: testCourseId,
        clubId: testClubId,
      },
    });
    testEvent2Id = event2.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await closePrisma();
  });

  describe("Query: myTimeTrials", () => {
    it("should return empty array when user has no time trials", async () => {
      const response = await graphql<{ myTimeTrials: unknown[] }>(
        `
          query MyTimeTrials($clubId: String!) {
            myTimeTrials(clubId: $clubId) {
              id
              timeMs
            }
          }
        `,
        { clubId: testClubId },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.myTimeTrials).toEqual([]);
    });

    it("should return user's time trials for a club", async () => {
      const timeTrial1 = await prisma.timeTrial.create({
        data: {
          timeMs: 1500000,
          userId: testUserId,
          eventId: testEventId,
        },
      });

      const timeTrial2 = await prisma.timeTrial.create({
        data: {
          timeMs: 1450000,
          userId: testUserId,
          eventId: testEvent2Id,
        },
      });

      const response = await graphql<{
        myTimeTrials: Array<{
          id: string;
          timeMs: number;
          event: { id: string; date: string };
        }>;
      }>(
        `
          query MyTimeTrials($clubId: String!) {
            myTimeTrials(clubId: $clubId) {
              id
              timeMs
              event {
                id
                date
              }
            }
          }
        `,
        { clubId: testClubId },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.myTimeTrials).toHaveLength(2);

      const ids = response.data?.myTimeTrials.map((t) => t.id);
      expect(ids).toContain(timeTrial1.id);
      expect(ids).toContain(timeTrial2.id);
    });

    it("should only return time trials for the specified club", async () => {
      const otherClub = await prisma.club.create({
        data: {
          name: "Other Club",
          inviteCode: `OTHER${Date.now()}`,
          adminInviteCode: `OTHERADMIN${Date.now()}`,
        },
      });

      const otherEvent = await prisma.event.create({
        data: {
          date: new Date("2024-07-01"),
          courseId: testCourseId,
          clubId: otherClub.id,
        },
      });

      await prisma.timeTrial.create({
        data: {
          timeMs: 1500000,
          userId: testUserId,
          eventId: testEventId,
        },
      });

      await prisma.timeTrial.create({
        data: {
          timeMs: 1600000,
          userId: testUserId,
          eventId: otherEvent.id,
        },
      });

      const response = await graphql<{
        myTimeTrials: Array<{ id: string }>;
      }>(
        `
          query MyTimeTrials($clubId: String!) {
            myTimeTrials(clubId: $clubId) {
              id
            }
          }
        `,
        { clubId: testClubId },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.myTimeTrials).toHaveLength(1);
    });

    it("should fail without authentication", async () => {
      const response = await graphql(
        `
          query MyTimeTrials($clubId: String!) {
            myTimeTrials(clubId: $clubId) {
              id
            }
          }
        `,
        { clubId: testClubId }
      );

      expect(response.errors).toBeDefined();
    });
  });

  describe("Mutation: submitTimeTrial", () => {
    it("should create a new time trial", async () => {
      const response = await graphql<{
        submitTimeTrial: {
          id: string;
          timeMs: number;
          event: { id: string };
        };
      }>(
        `
          mutation SubmitTimeTrial($input: SubmitTimeTrialInput!) {
            submitTimeTrial(input: $input) {
              id
              timeMs
              event {
                id
              }
            }
          }
        `,
        { input: { eventId: testEventId, timeMs: 1520000 } },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.submitTimeTrial.timeMs).toBe(1520000);
      expect(response.data?.submitTimeTrial.event.id).toBe(testEventId);

      const timeTrial = await prisma.timeTrial.findUnique({
        where: { id: response.data?.submitTimeTrial.id },
      });
      expect(timeTrial).not.toBeNull();
      expect(timeTrial?.userId).toBe(testUserId);
      expect(timeTrial?.timeMs).toBe(1520000);
    });

    it("should fail without authentication", async () => {
      const response = await graphql(
        `
          mutation SubmitTimeTrial($input: SubmitTimeTrialInput!) {
            submitTimeTrial(input: $input) {
              id
            }
          }
        `,
        { input: { eventId: testEventId, timeMs: 1520000 } }
      );

      expect(response.errors).toBeDefined();
    });

    it("should fail with invalid eventId", async () => {
      const response = await graphql(
        `
          mutation SubmitTimeTrial($input: SubmitTimeTrialInput!) {
            submitTimeTrial(input: $input) {
              id
            }
          }
        `,
        { input: { eventId: "non-existent-event", timeMs: 1520000 } },
        testToken
      );

      expect(response.errors).toBeDefined();
    });

    it("should include user info in response", async () => {
      const response = await graphql<{
        submitTimeTrial: {
          id: string;
          user: { id: string; name: string };
        };
      }>(
        `
          mutation SubmitTimeTrial($input: SubmitTimeTrialInput!) {
            submitTimeTrial(input: $input) {
              id
              user {
                id
                name
              }
            }
          }
        `,
        { input: { eventId: testEventId, timeMs: 1520000 } },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.submitTimeTrial.user.id).toBe(testUserId);
    });
  });
});
