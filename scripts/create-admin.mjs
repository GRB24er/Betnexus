/**
 * Betnexus — Admin Seed Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a new admin user OR promotes an existing user to admin role.
 *
 * Usage:
 *   node scripts/create-admin.mjs
 *
 * Requirements:
 *   - MONGODB_URI must be set in your .env.local file
 *   - Run from the project root: cd /your/project && node scripts/create-admin.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createInterface } from "readline";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local manually (no dotenv dependency needed) ───────────────────
function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  try {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
    console.log("✅ Loaded .env.local");
  } catch {
    console.warn("⚠️  Could not load .env.local — using existing environment variables");
  }
}

// ── Prompt helper ─────────────────────────────────────────────────────────────
function prompt(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      let input = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", function handler(char) {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener("data", handler);
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (char === "\u0003") {
          process.exit();
        } else if (char === "\u007f") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(question + "*".repeat(input.length));
          }
        } else {
          input += char;
          process.stdout.write("*");
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ MONGODB_URI is not set. Add it to .env.local and try again.");
    process.exit(1);
  }

  // Dynamically import mongoose (available in node_modules)
  const { default: mongoose } = await import("mongoose");
  const { default: bcrypt } = await import("bcryptjs");

  console.log("\n🔐 Betnexus Admin Setup\n" + "─".repeat(40));

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB\n");

  // Define a minimal User schema inline (matches the real model)
  const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, lowercase: true },
    password: String,
    phone: String,
    role: { type: String, default: "user" },
    status: { type: String, default: "active" },
    balance: { type: Number, default: 0 },
    kycStatus: { type: String, default: "none" },
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const email = (await prompt("Enter admin email: ")).toLowerCase();

  // Check if user already exists
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === "admin") {
      console.log(`\n✅ ${email} is already an admin. You can log in at /admin`);
    } else {
      const confirm = await prompt(`\nUser "${email}" exists with role "${existing.role}". Promote to admin? (yes/no): `);
      if (confirm.toLowerCase() === "yes" || confirm.toLowerCase() === "y") {
        await User.updateOne({ email }, { $set: { role: "admin", status: "active" } });
        console.log(`\n✅ ${email} has been promoted to admin!`);
        console.log("   → Log in at /login then visit /admin");
      } else {
        console.log("Aborted.");
      }
    }
  } else {
    console.log(`\nNo user found with email "${email}". Creating a new admin account.\n`);
    const firstName = await prompt("First name: ");
    const lastName = await prompt("Last name: ");
    const phone = await prompt("Phone number (optional, press Enter to skip): ");
    const password = await prompt("Password (min 8 chars): ", true);
    const confirm = await prompt("Confirm password: ", true);

    if (password !== confirm) {
      console.error("\n❌ Passwords do not match.");
      await mongoose.disconnect();
      process.exit(1);
    }
    if (password.length < 8) {
      console.error("\n❌ Password must be at least 8 characters.");
      await mongoose.disconnect();
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      phone: phone || undefined,
      role: "admin",
      status: "active",
      balance: 0,
      kycStatus: "none",
    });

    console.log(`\n✅ Admin account created!`);
    console.log(`   Email:    ${email}`);
    console.log(`   Name:     ${firstName} ${lastName}`);
    console.log(`   Role:     admin`);
    console.log(`\n   → Log in at /login then visit /admin`);
  }

  await mongoose.disconnect();
  console.log("\n✅ Done. Database connection closed.\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
