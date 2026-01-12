import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./model/userModel.js";

dotenv.config();

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.Mongodb_uri);
        console.log("Connected to DB");
    } catch (error) {
        console.error("DB Connection Error:", error);
    }
};

const checkUsers = async () => {
    await connectDb();
    const users = await User.find({});
    console.log("Users found:", users.length);
    users.forEach(u => {
        console.log(`ID: ${u._id}, Name: "${u.fullname}", Email: ${u.email}`);
    });
    process.exit();
};

checkUsers();
