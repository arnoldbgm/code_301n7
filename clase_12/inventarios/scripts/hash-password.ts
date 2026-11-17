import { hash } from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run auth:hash -- "your-password"');
  process.exitCode = 1;
} else {
  // Cost 10, matching the hash checked by src/lib/credentials.ts.
  const bcryptHash = await hash(password, 10);

  // Next.js expands "$" inside .env values, which would corrupt a raw bcrypt
  // hash ("$2b$10$..."). The base64 value for ADMIN_PASSWORD_HASH_B64 keeps it
  // intact; the app decodes it before calling bcrypt.
  console.log(Buffer.from(bcryptHash, "utf8").toString("base64"));
}
