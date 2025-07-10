import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, resp, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return resp.status(401).json({ message: "Unauthorized access" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return resp.status(401).json({ message: "Unauthorized access" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    resp.status(401).json({ message: "Token is not valid" });
  }
};

export default protectRoute;
