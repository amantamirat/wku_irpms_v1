import { Router } from "express";
import { PositionController } from "./position.controller";
import { verifyActiveAccount } from "../../users/auth/auth.middleware";

const router: Router = Router();

// CRUD routes
router.post("/", verifyActiveAccount, PositionController.createPosition);
router.get("/", verifyActiveAccount, PositionController.getPositions);
router.put("/:id", verifyActiveAccount, PositionController.updatePosition);
router.delete("/:id", verifyActiveAccount, PositionController.deletePosition);

export default router;
