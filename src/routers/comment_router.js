import express from "express";
const router = express.Router();

import { CommentController } from "../controllers/comment_controller.js";

router.post(
  "/:postId/:userCommentId/:parentCommentId",
  CommentController.addComment
); // POST /api/v1/comments/:postId/:userCommentId/:parentCommentId
router.delete("/:commentId", CommentController.deleteComment); // DELETE /api/v1/comments/:commentId
router.get("/post/:postId", CommentController.getAllCommentsOfAPost); // GET /api/v1/comments/post/:postId

export default router;
