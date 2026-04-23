import { Router } from "express";


import { verifyActiveAccount, checkPermission, checkTransitionPermission } from "../../auth/auth.middleware";
import { GrantAllocationService } from "./grant.allocation.service";
import { GrantAllocationRepository } from "./grant.allocation.repository";
import { GrantRepository } from "../grant.repository";
import { CalendarRepository } from "../../calendar/calendar.repository";
import { GrantAllocationController } from "./grant.allocation.controller";
import { CallRepository } from "../../calls/call.repository";
import { ProjectRepository } from "../../projects/project.repository";


const repo = new GrantAllocationRepository();
const grantRepo = new GrantRepository();
const calendarRepo = new CalendarRepository();
const callRepo = new CallRepository();
const projectRepo = new ProjectRepository();

const service = new GrantAllocationService(repo, grantRepo, calendarRepo, callRepo, projectRepo);
const controller = new GrantAllocationController(service);

const router: Router = Router();

//----------------------------------------
// CREATE ALLOCATION
//----------------------------------------
router.post(
    "/",
    verifyActiveAccount,
    checkPermission(["grant.allocation:create"]),
    controller.create
);

//----------------------------------------
// GET ALLOCATION
//----------------------------------------
router.get(
    "/",
    verifyActiveAccount,
    checkPermission("grant.allocation:read"),
    controller.get
);

router.get(
    "/:id",
    verifyActiveAccount,
    checkPermission("grant.allocation:read"),
    controller.getById
);

//----------------------------------------
// UPDATE ALLOCATION
//----------------------------------------
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission("grant.allocation:update"),
    controller.update
);

// Update status
router.patch(
    '/:id',
    verifyActiveAccount,
    checkTransitionPermission("grant.allocation"),
    controller.transitionState
);

//----------------------------------------
// DELETE ALLOCATION
//----------------------------------------
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission("grant.allocation:delete"),
    controller.delete
);

export default router;
