import express from "express";
const router = express.Router();

import { PostController } from "../controllers/post_controller.js";

router.post("/:userId", PostController.createPost); // POST /api/v1/posts/:userId
router.patch("/:postId", PostController.updatePost); // PATCH /api/v1/posts/:postId
router.delete("/:postId", PostController.deletePost); // DELETE /api/v1/posts/:postId
router.get("/others/:userId", PostController.getAllOtherPost); // GET /api/v1/posts/others/:userId
router.get("/", PostController.getAllPost); // GET /api/v1/posts
router.get("/:postId", PostController.getPostById); // GET /api/v1/posts/:postId
router.get("/users/:userId", PostController.getAllPostsOfUser); // GET /api/v1/posts/users/:userId
router.get("/deleted/:userId", PostController.getAllPostsDelete); // GET /api/v1/posts/deleted/:userId
router.get("/suggestText", PostController.suggestText); // GET /api/v1/posts/suggestText

export default router;
