import mongoose from "mongoose";

export const connectDB = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${connection.connection.host}`);
};
