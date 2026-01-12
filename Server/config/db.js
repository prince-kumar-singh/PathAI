import mongoose from 'mongoose';

export const connectDb=async()=>{
   try {
    await mongoose.connect(process.env.Mongodb_uri)
    console.log("Database connected successfully");
    
   } catch (error) {
    console.log("Database connection failed",error);
   }}