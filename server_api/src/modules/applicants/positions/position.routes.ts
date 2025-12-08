import { Router } from "express";
import { PositionController } from "./position.controller";
import { verifyActiveAccount, checkPermission } from "../../users/user.middleware";
import { PERMISSIONS } from "../../../util/permissions";


const router = Router();

router.post(
  "/",
  verifyActiveAccount,
  checkPermission([PERMISSIONS.POSITION.CREATE]),
  PositionController.createPosition
);

router.get(
  "/",
  verifyActiveAccount,
  checkPermission([
    PERMISSIONS.POSITION.READ,
    PERMISSIONS.POSITION.CREATE,
    PERMISSIONS.POSITION.UPDATE,
    PERMISSIONS.POSITION.DELETE
  ]),
  PositionController.getPositions
);

router.put(
  "/:id",
  verifyActiveAccount,
  checkPermission([PERMISSIONS.POSITION.UPDATE]),
  PositionController.updatePosition
);

router.delete(
  "/:id",
  verifyActiveAccount,
  checkPermission([PERMISSIONS.POSITION.DELETE]),
  PositionController.deletePosition
);

export default router;
