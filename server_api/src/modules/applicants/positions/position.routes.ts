import { Router } from "express";
import { PositionController } from "./position.controller";
import { verifyActiveAccount, checkPermission } from "../../users/auth/auth.middleware";

const router = Router();

router.post(
  "/",
  verifyActiveAccount,
  checkPermission("position:create"),
  PositionController.createPosition
);

router.get(
  "/",
  verifyActiveAccount,
  checkPermission(["position:read", "position:create", "position:update", "position:delete"]),
  PositionController.getPositions
);

router.put(
  "/:id",
  verifyActiveAccount,
  checkPermission("position:update"),
  PositionController.updatePosition
);

router.delete(
  "/:id",
  verifyActiveAccount,
  checkPermission("position:delete"),
  PositionController.deletePosition
);

export default router;
