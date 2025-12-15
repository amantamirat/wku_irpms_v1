import express from "express";
import { ProjectDocController } from "./document.controller";
import { upload } from "../../../../util/multer";
import { checkPermission, verifyActiveAccount } from "../../../users/user.middleware";
import { PERMISSIONS } from "../../../../common/constants/permissions";

const router = express.Router();

router.post("/", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.CREATE]),
    upload.single("document"), ProjectDocController.create);
router.get("/", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.READ]),
    ProjectDocController.get);
router.put("/:id", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.UPDATE]),
    ProjectDocController.update);
router.delete("/:id", verifyActiveAccount,
    checkPermission([PERMISSIONS.DOCUMENT.DELETE]),
    ProjectDocController.delete);

export default router;
