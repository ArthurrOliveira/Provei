import * as dotenv from "dotenv";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

const BADGES = [
  // REVIEWER
  {
    slug: "first-review",
    label: "Primeira Prova",
    description: "Fez sua primeira avaliação",
    category: "REVIEWER" as const,
    threshold: { reviewCount: 1 },
  },
  {
    slug: "frequent-reviewer",
    label: "Provador Frequente",
    description: "Fez 10 avaliações",
    category: "REVIEWER" as const,
    threshold: { reviewCount: 10 },
  },
  {
    slug: "official-critic",
    label: "Crítico Oficial",
    description: "Fez 50 avaliações",
    category: "REVIEWER" as const,
    threshold: { reviewCount: 50 },
  },
  {
    slug: "neighborhood-voice",
    label: "Voz do Bairro",
    description: "Fez 5+ avaliações em restaurantes da mesma região",
    category: "REVIEWER" as const,
    threshold: { neighborhoodReviews: 5 },
  },
  // SOCIAL
  {
    slug: "influencer",
    label: "Influenciador",
    description: "Tem 20 ou mais seguidores",
    category: "SOCIAL" as const,
    threshold: { followerCount: 20 },
  },
  {
    slug: "opinion-maker",
    label: "Formador de Opinião",
    description: "Suas mídias receberam 50 ou mais curtidas",
    category: "SOCIAL" as const,
    threshold: { mediaLikeCount: 50 },
  },
  {
    slug: "curator",
    label: "Curador",
    description: "Criou 5 ou mais listas públicas",
    category: "SOCIAL" as const,
    threshold: { listCount: 5 },
  },
  // EXPLORER
  {
    slug: "explorer",
    label: "Explorador",
    description: "Avaliou 20 restaurantes diferentes",
    category: "EXPLORER" as const,
    threshold: { uniqueRestaurants: 20 },
  },
  {
    slug: "eclectic",
    label: "Eclético",
    description: "Usou 8 ou mais vibe tags diferentes",
    category: "EXPLORER" as const,
    threshold: { uniqueVibeTags: 8 },
  },
  {
    slug: "pioneer",
    label: "Pioneiro",
    description: "Foi o primeiro a avaliar 3 restaurantes no app",
    category: "EXPLORER" as const,
    threshold: { firstReviewCount: 3 },
  },
];

const FAKE_USERS = [
  { name: "Ana Souza",         email: "ana.souza@mangut.fake" },
  { name: "Carlos Mendes",     email: "carlos.mendes@mangut.fake" },
  { name: "Beatriz Lima",      email: "bia.lima@mangut.fake" },
  { name: "Rafael Costa",      email: "rafael.costa@mangut.fake" },
  { name: "Fernanda Oliveira", email: "fernanda.oliveira@mangut.fake" },
  { name: "Lucas Pereira",     email: "lucas.pereira@mangut.fake" },
  { name: "Juliana Santos",    email: "juliana.santos@mangut.fake" },
  { name: "Thiago Ferreira",   email: "thiago.ferreira@mangut.fake" },
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

  console.log("Seeding badges...");
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        label: badge.label,
        description: badge.description,
        category: badge.category,
        threshold: badge.threshold,
      },
      create: badge,
    });
  }

  console.log("Seeding fake users...");
  for (const u of FAKE_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email },
    });
    console.log(`  ✓ ${user.name} (${user.id})`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
