import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GUIDELINES = [
  {
    category: "Getting started",
    title: "Setting up your farmer profile",
    body: "List your crops with clear titles, honest quantities, and fair prices. Add a description covering harvest date and growing method (organic, irrigated, etc.) so buyers know what they're getting.",
  },
  {
    category: "Getting started",
    title: "How buying directly works",
    body: "Browse the marketplace, message the farmer with any questions, then place an order for the quantity you need. The farmer will confirm and you'll coordinate pickup or delivery through chat.",
  },
  {
    category: "Crop health",
    title: "Using the disease scanner effectively",
    body: "Take photos in good daylight, close enough to show affected leaves or fruit clearly, but not so close that the whole plant's context is lost. Scan early — many diseases are easier to treat when caught early.",
  },
  {
    category: "Crop health",
    title: "Preventing common fungal diseases",
    body: "Avoid overhead watering late in the day, space plants for airflow, and rotate crops each season. Remove and destroy infected plant material rather than composting it.",
  },
  {
    category: "Selling",
    title: "Pricing your produce fairly",
    body: "Check what similar listings are priced at in the marketplace. Factor in your costs plus a fair margin — buyers on this platform are looking for direct-from-farm value, not the lowest possible price.",
  },
  {
    category: "Selling",
    title: "Managing your inventory",
    body: "Mark a listing sold out as soon as you're out of stock to avoid taking orders you can't fill. Update quantities regularly during harvest season.",
  },
  {
    category: "Safety",
    title: "Meeting buyers and farmers safely",
    body: "Arrange pickups in daylight at agreed public or farm locations. Use the in-app chat to keep a record of what was agreed, and confirm order details before exchanging goods and payment.",
  },
];

async function main() {
  for (const g of GUIDELINES) {
    const existing = await prisma.guideline.findFirst({ where: { title: g.title } });
    if (!existing) await prisma.guideline.create({ data: g });
  }
  console.log(`Seeded ${GUIDELINES.length} guidelines (skipping any that already exist).`);
}

main().finally(() => prisma.$disconnect());
