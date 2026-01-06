import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const club = await prisma.club.upsert({
    where: { inviteCode: "STRIDERS2024" },
    update: {},
    create: {
      name: "Sydney Striders",
      inviteCode: "STRIDERS2024",
    },
  });

  console.log(`Seeded club: ${club.name} (invite code: ${club.inviteCode})`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
