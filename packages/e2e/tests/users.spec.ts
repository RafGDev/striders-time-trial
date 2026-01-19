import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  graphql,
  getPrisma,
  closePrisma,
  cleanDatabase,
  generateTestToken,
} from "./helpers";

describe("Users", () => {
  const prisma = getPrisma();
  let testUserId: string;
  let testUserName: string;
  let testToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    testUserName = `Test User ${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        name: testUserName,
        avatarUrl: "https://example.com/avatar.jpg",
        stravaId: "12345678",
      },
    });
    testUserId = user.id;
    testToken = generateTestToken(user.id, user.name);
  });

  afterAll(async () => {
    await cleanDatabase();
    await closePrisma();
  });

  describe("Query: me", () => {
    it("should return the current authenticated user", async () => {
      const response = await graphql<{
        me: {
          id: string;
          name: string;
          avatarUrl: string;
          stravaId: string;
        };
      }>(
        `
          query Me {
            me {
              id
              name
              avatarUrl
              stravaId
            }
          }
        `,
        {},
        testToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.me.id).toBe(testUserId);
      expect(response.data?.me.name).toBe(testUserName);
      expect(response.data?.me.avatarUrl).toBe(
        "https://example.com/avatar.jpg"
      );
      expect(response.data?.me.stravaId).toBe("12345678");
    });

    it("should return null fields when user has no avatar or stravaId", async () => {
      const minimalUser = await prisma.user.create({
        data: { name: `Minimal User ${Date.now()}` },
      });
      const minimalToken = generateTestToken(minimalUser.id, minimalUser.name);

      const response = await graphql<{
        me: {
          id: string;
          name: string;
          avatarUrl: string | null;
          stravaId: string | null;
        };
      }>(
        `
          query Me {
            me {
              id
              name
              avatarUrl
              stravaId
            }
          }
        `,
        {},
        minimalToken
      );

      expect(response.errors).toBeUndefined();
      expect(response.data?.me.id).toBe(minimalUser.id);
      expect(response.data?.me.avatarUrl).toBeNull();
      expect(response.data?.me.stravaId).toBeNull();
    });

    it("should fail without authentication", async () => {
      const response = await graphql(`
        query Me {
          me {
            id
            name
          }
        }
      `);

      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toBe("Unauthorized");
    });

    it("should fail with invalid token", async () => {
      const response = await graphql(
        `
          query Me {
            me {
              id
              name
            }
          }
        `,
        {},
        "invalid-token"
      );

      expect(response.errors).toBeDefined();
    });

    it("should fail when user no longer exists", async () => {
      await prisma.user.delete({ where: { id: testUserId } });

      const response = await graphql(
        `
          query Me {
            me {
              id
              name
            }
          }
        `,
        {},
        testToken
      );

      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toContain("User not found");
    });
  });
});
