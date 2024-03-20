import express from "express";
import upload from "../services/multer.js";

import { ImageController } from "../controllers/image_controller.js";
const router = express.Router();

router.post("/", upload.single("image"), ImageController.describeAndAdvice);

export default router;
