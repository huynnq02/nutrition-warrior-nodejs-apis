import express from "express";
import { KeyController } from "../controllers/key_controller.js";
const router = express.Router();

router.get("/", KeyController.getAllKeys);
router.post("/", KeyController.addKey);
router.delete("/:id", KeyController.deleteKey);
router.get("/random", KeyController.getRandomKey);

export default router;
