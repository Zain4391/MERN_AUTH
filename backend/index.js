import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";
dotenv.config();
const __dirname = path.resolve();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;
const url = `http://localhost:${PORT}`;

app.use(morgan("dev"));
app.use(express.json()); //allows JSON parsing for incoming requests
app.use(cookieParser()); //allows us to parse incoming cookies

//from the routes dir
app.use("/api/auth", authRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
} else {
  // Fallback route for development
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on ${url}`);
});
