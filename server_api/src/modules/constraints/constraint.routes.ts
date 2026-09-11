import { Router } from "express";
import { ConstraintController } from "./constraint.controller";
import { ConstraintService } from "./constraint.service";


import {
    verifyAuthToken,
} from "../auth/auth.middleware";
import { checkPermission } from '../../core/container';
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
    verifyAuthToken,
    checkPermission("constraint:create"),
    controller.create
);

/**
 * @route GET /constraints/:id
 * @desc Get constraint by ID
 * @access Protected
 */
router.get(
    "/lookup",
    verifyAuthToken,
    checkPermission("constraint:lookup"),
    controller.get
);

/**
 * @route GET /constraints/:id
 * @desc Get constraint by ID
 * @access Protected
 */
router.get(
    "/:id",
    verifyAuthToken,
    checkPermission("constraint:lookup"),
    controller.getById
);



/**
 * @route GET /constraints
 * @desc Get all constraint profiles
 * @access Protected
 */
router.get(
    "/",
    verifyAuthToken,
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
    verifyAuthToken,
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
    verifyAuthToken,
    checkPermission("constraint:delete"),
    controller.delete
);


export default router;