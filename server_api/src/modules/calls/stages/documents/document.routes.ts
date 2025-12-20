import express from "express";
import { ProjectDocController } from "./document.controller";
import { upload } from "../../../../util/multer";
import { checkPermission, verifyActiveAccount } from "../../../users/user.middleware";
import { PERMISSIONS } from "../../../../common/constants/permissions";

const controller = new ProjectDocController();
const router = express.Router();

router.post("/", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.CREATE]),
    upload.single("document"), controller.create);

router.get("/", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.READ]),
    controller.get);
/*
router.put("/:id", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.UPDATE]),
    controller.update);
    */

router.put("/updateStatus", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.UPDATE_STATUS]),
    controller.changeStatus);

router.delete("/:id", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.DELETE]),
    controller.delete);

export default router;
