import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config();
dotenv.config({ path: "backend/.env", override: false });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI no está configurado.");
  process.exit(1);
}

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

try {
  await mongoose.connect(uri, {
    dbName: "test",
    serverSelectionTimeoutMS: 10000
  });

  const users = mongoose.connection.collection("users");
  const cursor = users.find({
    password: { $type: "string" }
  });

  let migrated = 0;
  let alreadyHashed = 0;

  for await (const user of cursor) {
    if (isBcryptHash(user.password)) {
      alreadyHashed += 1;
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    await users.updateOne(
      { _id: user._id, password: user.password },
      { $set: { password: hashedPassword } }
    );
    migrated += 1;
  }

  console.log(`Migración completada: ${migrated} contraseñas convertidas, ${alreadyHashed} ya estaban protegidas.`);
} catch (error) {
  console.error("No se pudo completar la migración:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
