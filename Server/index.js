import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { authRoute } from "./src/routes/auth.route.js";
import { testRoute } from "./src/routes/testDatabase.route.js";
import cors from "cors";
// import WebSocketServer from "ws";
// import { WebSoketServer } from "ws";

import {WebSocketServer} from "ws";
dotenv.config();
const app = express();
// const wss = new WebSocketServer({ port: 8080 });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());


// wss.on("connection", (ws) => {
// console.log("Client connected");

// ws.on("message", (message) => {
// console.log("Message Received: ", message.toString());
// });
// });

app.use("/api/auth", authRoute);
app.use("/api/test", testRoute);

app.get("/", (req, res)=> {
  res.send("Hello from khanakhoj server");
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});