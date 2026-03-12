import { Request, Response, NextFunction } from 'express';
import { PermissionAction, PERMISSIONS } from "../../common/constants/permissions";
import { errorResponse } from "../../common/helpers/response";
import { checkPermission } from "../users/user.middleware";
import { Unit } from '../../common/constants/enums';


const UNIT_PERMISSION_KEY: Record<Unit, keyof typeof PERMISSIONS.ORGANIAZTION> = {
    [Unit.College]: "COLLEGE",
    [Unit.Department]: "DEPARTMENT",
    [Unit.Program]: "PROGRAM",
    [Unit.Directorate]: "DIRECTORATE",
    [Unit.Center]: "CENTER",
    [Unit.External]: "EXTERNAL",
};

export function checkUnitPermission(action: PermissionAction) {
    return (req: Request, res: Response, next: NextFunction) => {
        const unitInput = (req.body && req.body.type) || req.query?.type;
        const unit = unitInput as Unit;
        // Validate unit
        if (!Object.values(Unit).includes(unit)) {
            return errorResponse(res, 400, "Invalid or missing unit type");
        }
        const permissionKey = UNIT_PERMISSION_KEY[unit];
        // Map unit to its permission
        const permissions: string[] = [
            PERMISSIONS.ORGANIAZTION[permissionKey][action]
        ];

        return checkPermission(permissions)(req, res, next);
    };
}
