import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export let isMongoConnected = false;
export let connectionErrorMsg = "";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    isMongoConnected = false;
    connectionErrorMsg = "Configura MONGODB_URI en tu entorno local.";
    console.error(connectionErrorMsg);
    return false;
  }

  try {
    if (mongoose.connection.readyState >= 1) {
      isMongoConnected = true;
      return true;
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri, {
      dbName: "test",
      serverSelectionTimeoutMS: 10000
    });

    isMongoConnected = true;
    connectionErrorMsg = "";
    console.log("Successfully connected to MongoDB Atlas!");
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    connectionErrorMsg = err.message;
    isMongoConnected = false;
    return false;
  }
}

export default connectDB;
