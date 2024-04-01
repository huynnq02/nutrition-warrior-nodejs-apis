import express from "express";
const router = express.Router();

import { PostController } from "../controllers/post_controller.js";

PostRouter.post("/:userId", PostController.createPost); // POST /api/v1/posts/:userId
PostRouter.patch("/:postId", PostController.updatePost); // PATCH /api/v1/posts/:postId
PostRouter.delete("/:postId", PostController.deletePost); // DELETE /api/v1/posts/:postId
PostRouter.get("/others/:userId", PostController.getAllOtherPost); // GET /api/v1/posts/others/:userId
PostRouter.get("/", PostController.getAllPost); // GET /api/v1/posts
PostRouter.get("/:postId", PostController.getPostById); // GET /api/v1/posts/:postId
PostRouter.get("/users/:userId", PostController.getAllPostsOfUser); // GET /api/v1/posts/users/:userId
PostRouter.get("/deleted/:userId", PostController.getAllPostsDelete); // GET /api/v1/posts/deleted/:userId
PostRouter.get("/suggestText", PostController.suggestText); // GET /api/v1/posts/suggestText

export default router;
