import { Request, Response, NextFunction } from 'express';
import { checkPermission } from '../users/user.middleware';
import { PermissionAction, PERMISSIONS } from '../../util/permissions';
import { errorResponse } from '../../util/response';
import { CycleType } from './cycle.d';



export function checkCyclePermission(action: PermissionAction) {
    return (req: Request, res: Response, next: NextFunction) => {
        const typeInput = (req.body && req.body.type) || req.query?.type;

        const type = typeInput as CycleType;

        if (type !== 'Call' && type !== 'Program') {
            return errorResponse(res, 400, "Invalid or missing cycle type");
        }
        const permissions: string[] = type === "Call"
            ? [PERMISSIONS.CYCLE.CALL[action]]
            : [PERMISSIONS.CYCLE.PROGRAM[action]];

        return checkPermission(permissions)(req, res, next);
    };
}
