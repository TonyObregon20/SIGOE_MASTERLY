import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export let isMongoConnected = false;
export let connectionErrorMsg = "";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://202120468_db_user:9nU94F6p8F1H93zd@masterly.ffk2uoy.mongodb.net/test?retryWrites=true&w=majority";

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
