import express from "express";
const router = express.Router();

import { LikeController } from "../controllers/like_controller.js";

router.post("/:postId/:userLikeId", LikeController.addLike); // POST /api/v1/likes/:postId/:userLikeId
router.delete("/:postId/:userLikeId", LikeController.deleteLike); // DELETE /api/v1/likes/:postId/:userLikeId

export default router;
