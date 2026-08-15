// Bootstraps an admin account. Not exposed via any HTTP route — admins can only
// be created from the server's own filesystem, so public registration can never
// grant admin access to itself.
//
// Usage: npm run create-admin -- --name "Ops Admin" --email admin@farmlink.ai --password "changeme123"
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const name = arg("name");
  const email = arg("email");
  const password = arg("password");

  if (!name || !email || !password) {
    console.error('Usage: npm run create-admin -- --name "Ops Admin" --email admin@farmlink.ai --password "changeme123"');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`${email} is already an admin.`);
      return;
    }
    console.error(`An account with this email already exists with role ${existing.role}. Refusing to overwrite.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" },
  });
  console.log(`Created admin account: ${admin.email} (${admin.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
