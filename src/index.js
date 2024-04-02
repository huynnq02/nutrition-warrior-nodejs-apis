//#region import package
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http, { get } from "http";

dotenv.config();

const app = express();

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
//#end region

// app.use(bodyParser.json());

//#region setup middleware
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cors());
//#end region

//#region import router
import KeyRouter from "./routers/key_router.js";
import ImageRouter from "./routers/image_router.js";
import PostRouter from "./routers/post_router.js";
import LikeRouter from "./routers/like_router.js";
import CommentRouter from "./routers/comment_router.js";
//#end region

//#region setup router
app.use("/api/v1/keys", KeyRouter);
app.use("/api/v1/images", ImageRouter);
app.use("/api/v1/posts", PostRouter);
app.use("/api/v1/comments", CommentRouter);
app.use("/api/v1/likes", LikeRouter);

//#end region

//#region connect to database

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB!!!");
  })
  .catch((e) => {
    console.log("Error connecting to MongoDB");
    console.log(e.message);
  });

//#end region

//#region start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port: http://localhost:${PORT}`);
});
//#end region

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Hello World!",
  });
});
export default app;
