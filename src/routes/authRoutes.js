import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"});
}

router.post("/register", async (req, resp) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return resp.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return resp
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }
    if (username.length < 3) {
      return resp
        .status(400)
        .json({ message: "Username must be at least 3 characters long" });
    }

    const exisitingEmail = await User.findOne({ email });
    if (exisitingEmail) {
      return resp.status(400).json({ message: "Email already exists" });
    }

    const exisitingUsername = await User.findOne({ username });
    if (exisitingUsername) {
      return resp.status(400).json({ message: "Username already exists" });
    }

    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const user = new User({
      email,
      username,
      password,
      profileImage,
    });

    await user.save();

    const token = generateToken(user._id);

    resp.status(201).json({
        token,
        user:{
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage
        }
    })
  } catch (error) {
    console.log("Error in register route", error);
    resp.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, resp) => {
  try {
    const {email, password} = req.body;
    if(!email || !password){
        resp.status(400).json({message: "All fields are required"});
    }

    const user = await User.findOne({email});
    if(!user){
        return resp.status(400).json({message: "Invalid email or password"});
    }
    const isPasswordValid = await user.comparePassword(password);
    if(!isPasswordValid){
        return resp.status(400).json({message: "Invalid email or password"});
    }

    const token = generateToken(user._id);
    resp.status(200).json({
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        }
    })

  } catch (error) {
    console.log("Error in login route", error);
    resp.status(500).json({ message: "Internal server error" });
  }
});

export default router;
