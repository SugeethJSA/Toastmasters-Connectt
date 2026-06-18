import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is required");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["member", "officer", "admin"], default: "member" },
  clubId: { type: String, default: "sophrosyne-vit-f4-120" },
  isActive: { type: Boolean, default: true },
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB");

    const adminEmail = "admin@toastmasters.club";
    const existingAdmin = await (UserModel as any).findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin user already exists, skipping seed.");
    } else {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await (UserModel as any).create({
        email: adminEmail,
        password: hashedPassword,
        name: "Club Admin",
        role: "admin",
        clubId: "sophrosyne-vit-f4-120",
      });
      console.log("Admin user created:");
      console.log("  Email: admin@toastmasters.club");
      console.log("  Password: admin123");
    }

    const memberUsers = [
      { email: "sarah@toastmasters.club", name: "Sarah Jenkins", role: "officer" },
      { email: "audrey@toastmasters.club", name: "Audrey Chen", role: "member" },
      { email: "david@toastmasters.club", name: "David Vance", role: "member" },
    ];

    for (const u of memberUsers) {
      const existing = await (UserModel as any).findOne({ email: u.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash("member123", 10);
        await UserModel.create({ ...u, password: hashedPassword, clubId: "sophrosyne-vit-f4-120" });
        console.log(`Created user: ${u.email} / member123`);
      } else {
        console.log(`User ${u.email} already exists`);
      }
    }

    console.log("Seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();