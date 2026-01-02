import express from "express";
import { ProjectDocController } from "./document.controller";
import { upload } from "../../../util/multer";
import { checkPermission, checkStatusPermission, verifyActiveAccount } from "../../users/user.middleware";
import { PERMISSIONS } from "../../../common/constants/permissions";

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

router.put("/:status", verifyActiveAccount,
    checkStatusPermission("document"),
    controller.updateStatus);

router.delete("/:id", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.DELETE]),
    controller.delete);

export default router;
