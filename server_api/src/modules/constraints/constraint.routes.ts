import { Router } from "express";
import { ConstraintController } from "./constraint.controller";
import { ConstraintService } from "./constraint.service";


import {
    verifyActiveAccount,
    checkPermission,
} from "../auth/auth.middleware";
import { constraintRepo } from "../../core/container";


const service = new ConstraintService(constraintRepo);
const controller = new ConstraintController(service);


const router = Router();


/**
 * @route POST /constraints
 * @desc Create a new constraint profile
 * @access Protected
 */
router.post(
    "/",
    verifyActiveAccount,
    checkPermission("constraint:create"),
    controller.create
);


/**
 * @route GET /constraints/:id
 * @desc Get constraint by ID
 * @access Protected
 */
router.get(
    "/:id",
    verifyActiveAccount,
    checkPermission("constraint:read"),
    controller.getById
);



/**
 * @route GET /constraints
 * @desc Get all constraint profiles
 * @access Protected
 */
router.get(
    "/",
    verifyActiveAccount,
    checkPermission("constraint:read"),
    controller.get
);




/**
 * @route PUT /constraints/:id
 * @desc Update constraint profile
 * @access Protected
 */
router.put(
    "/:id",
    verifyActiveAccount,
    checkPermission("constraint:update"),
    controller.update
);


/**
 * @route DELETE /constraints/:id
 * @desc Delete constraint profile
 * @access Protected
 */
router.delete(
    "/:id",
    verifyActiveAccount,
    checkPermission("constraint:delete"),
    controller.delete
);


export default router;