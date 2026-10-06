import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | undefined;

export async function connectToDatabase(uri = process.env.MONGODB_URI): Promise<typeof mongoose> {
  if (!uri) throw new Error("MONGODB_URI must be configured before starting the API.");
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== "production",
    serverSelectionTimeoutMS: 10_000,
  }).catch((error: unknown) => {
    connectionPromise = undefined;
    throw error;
  });

  return connectionPromise;
}

export async function disconnectFromDatabase(): Promise<void> {
  connectionPromise = undefined;
  await mongoose.disconnect();
}
