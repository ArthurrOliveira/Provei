import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VIBE_TAGS = [
  "Bom para date",
  "Pet friendly",
  "Preço justo",
  "Música alta",
  "Porções generosas",
  "Boa carta de vinhos",
  "Instagramável",
  "Atendimento top",
  "Demora pra servir",
  "Bom pra trabalhar",
];

async function main() {
  console.log("Seeding vibe tags...");
  for (const label of VIBE_TAGS) {
    await prisma.vibeTag.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }
  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
