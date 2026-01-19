import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  graphql,
  getPrisma,
  closePrisma,
  cleanDatabase,
  generateTestToken,
} from "./helpers";

describe("Clubs Resolver", () => {
  const prisma = getPrisma();
  let testUserId: string;
  let testToken: string;
  let testClubId: string;

  beforeEach(async () => {
    await cleanDatabase();

    const user = await prisma.user.create({
      data: { name: `Test User ${Date.now()}` },
    });
    testUserId = user.id;
    testToken = generateTestToken(user.id, user.name);

    const club = await prisma.club.create({
      data: {
        name: "Sydney Striders",
        inviteCode: "STRIDERS2024",
        adminInviteCode: "ADMIN2024",
      },
    });
    testClubId = club.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await closePrisma();
  });

  describe("Mutation: joinClub", () => {
    it("should allow authenticated user to join a club with valid invite code", async () => {
      const response = await graphql<{
        joinClub: {
          id: string;
          role: string;
          club: { id: string; name: string };
          user: { id: string; name: string };
        };
      }>(
        `
          mutation JoinClub($input: JoinClubInput!) {
            joinClub(input: $input) {
              id
              role
              club {
                id
                name
              }
              user {
                id
                name
              }
            }
          }
        `,
        { input: { inviteCode: "STRIDERS2024" } },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.joinClub.role).toBe("member");
      expect(response.data?.joinClub.club.id).toBe(testClubId);
      expect(response.data?.joinClub.club.name).toBe("Sydney Striders");
      expect(response.data?.joinClub.user.id).toBe(testUserId);

      const membership = await prisma.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: testUserId,
            clubId: testClubId,
          },
        },
      });
      expect(membership).not.toBeNull();
      expect(membership?.role).toBe("member");
    });

    it("should fail with invalid invite code", async () => {
      const response = await graphql(
        `
          mutation JoinClub($input: JoinClubInput!) {
            joinClub(input: $input) {
              id
            }
          }
        `,
        { input: { inviteCode: "INVALID_CODE" } },
        testToken
      );

      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toContain("Invalid invite code");
    });

    it("should return existing membership when user is already a member", async () => {
      const existingMembership = await prisma.clubMember.create({
        data: {
          userId: testUserId,
          clubId: testClubId,
          role: "member",
        },
      });

      const response = await graphql<{
        joinClub: { id: string; role: string };
      }>(
        `
          mutation JoinClub($input: JoinClubInput!) {
            joinClub(input: $input) {
              id
              role
            }
          }
        `,
        { input: { inviteCode: "STRIDERS2024" } },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.joinClub.id).toBe(existingMembership.id);
      expect(response.data?.joinClub.role).toBe("member");
    });

    it("should allow user to join as admin with admin invite code", async () => {
      const response = await graphql<{
        joinClub: {
          id: string;
          role: string;
          club: { id: string; name: string };
        };
      }>(
        `
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
        `,
        { input: { inviteCode: "ADMIN2024" } },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.joinClub.role).toBe("admin");
      expect(response.data?.joinClub.club.id).toBe(testClubId);

      const membership = await prisma.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: testUserId,
            clubId: testClubId,
          },
        },
      });
      expect(membership?.role).toBe("admin");
    });

    it("should upgrade existing member to admin when using admin code", async () => {
      await prisma.clubMember.create({
        data: {
          userId: testUserId,
          clubId: testClubId,
          role: "member",
        },
      });

      const response = await graphql<{
        joinClub: { id: string; role: string };
      }>(
        `
          mutation JoinClub($input: JoinClubInput!) {
            joinClub(input: $input) {
              id
              role
            }
          }
        `,
        { input: { inviteCode: "ADMIN2024" } },
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.joinClub.role).toBe("admin");

      const membership = await prisma.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: testUserId,
            clubId: testClubId,
          },
        },
      });
      expect(membership?.role).toBe("admin");
    });

    it("should fail without authentication", async () => {
      const response = await graphql(
        `
          mutation JoinClub($input: JoinClubInput!) {
            joinClub(input: $input) {
              id
            }
          }
        `,
        { input: { inviteCode: "STRIDERS2024" } }
      );

      expect(response.errors).toBeDefined();
    });
  });

  describe("Query: myClubs", () => {
    it("should return empty array when user has no club memberships", async () => {
      const response = await graphql<{ myClubs: unknown[] }>(
        `
          query MyClubs {
            myClubs {
              id
              role
              club {
                id
                name
              }
            }
          }
        `,
        {},
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.myClubs).toEqual([]);
    });

    it("should return user's club memberships", async () => {
      await prisma.clubMember.create({
        data: {
          userId: testUserId,
          clubId: testClubId,
          role: "member",
        },
      });

      const response = await graphql<{
        myClubs: Array<{
          id: string;
          role: string;
          club: { id: string; name: string };
        }>;
      }>(
        `
          query MyClubs {
            myClubs {
              id
              role
              club {
                id
                name
              }
            }
          }
        `,
        {},
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.myClubs).toHaveLength(1);
      expect(response.data?.myClubs[0].role).toBe("member");
      expect(response.data?.myClubs[0].club.name).toBe("Sydney Striders");
    });

    it("should fail without authentication", async () => {
      const response = await graphql(`
        query MyClubs {
          myClubs {
            id
          }
        }
      `);

      expect(response.errors).toBeDefined();
    });
  });
});
