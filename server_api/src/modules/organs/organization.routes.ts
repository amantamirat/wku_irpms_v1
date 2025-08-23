import { Router } from "express";
import { OrganizationController } from "./organization.controller";

const router = Router();

router.get("/", OrganizationController.getOrganizations);
router.post("/", OrganizationController.createOrganization);
router.put("/:id", OrganizationController.updateOrganization);
router.delete("/:id", OrganizationController.deleteOrganization);

export default router;
